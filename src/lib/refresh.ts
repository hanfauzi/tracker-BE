import crypto from "crypto";
import { addDays } from "date-fns";
import prisma from "../modules/prisma/prisma.service";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(userId: string) {
  const plain = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(plain);
  const expiresAt = addDays(new Date(), 7); 

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return plain; 
}

export async function verifyRefreshToken(plain: string) {
  const tokenHash = hashToken(plain);
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!token) return null;
  if (token.revokedAt) return null;
  if (token.expiresAt < new Date()) return null;

  return token;
}

export async function revokeRefreshToken(plain: string) {
  const tokenHash = hashToken(plain);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}
