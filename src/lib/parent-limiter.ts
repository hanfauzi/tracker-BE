import { Role } from "../generated/prisma";
import prisma from "../modules/prisma/prisma.service";
import { AppError } from "../utils/app.error";

export async function getParentByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      role: Role.PARENT,
      isActive: true,
      email: email.toLowerCase()
    },
  });
}

export async function assertNotLocked(parent: { lockedUntil: Date | null }) {
  if (parent.lockedUntil && parent.lockedUntil > new Date()) {
    throw new AppError("Too many attempts. Try again later.", 429);
  }
}

export async function recordFailedAttempt(
  parentId: string,
  currentAttempts: number
) {
  const MAX = 5; 
  const LOCK_MS = 10 * 60 * 1000; 

  const nextAttempts = currentAttempts + 1;
  if (nextAttempts >= MAX) {
    await prisma.user.update({
      where: { id: parentId },
      data: {
        failedPinAttempts: 0,
        lockedUntil: new Date(Date.now() + LOCK_MS),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: parentId },
      data: { failedPinAttempts: nextAttempts },
    });
  }
}

export async function clearAttempts(parentId: string) {
  await prisma.user.update({
    where: { id: parentId },
    data: { failedPinAttempts: 0, lockedUntil: null },
  });
}
