import { Role } from "../generated/prisma";
import prisma from "../modules/prisma/prisma.service";
import { AppError } from "../utils/app.error";

export async function getChildByFamily(familyCode: string) {
  return prisma.user.findFirst({
    where: {
      role: Role.CHILD,
      isActive: true,
      parent: { is: { familyCode } },
    },
  });
}

export async function assertNotLocked(child: { lockedUntil: Date | null }) {
  if (child.lockedUntil && child.lockedUntil > new Date()) {
    throw new AppError("Too many attempts. Try again later.", 429);
  }
}

export async function recordFailedAttempt(
  childId: string,
  currentAttempts: number
) {
  const MAX = 10; 
  const LOCK_MS = 10 * 60 * 1000; 

  const nextAttempts = currentAttempts + 1;
  if (nextAttempts >= MAX) {
    await prisma.user.update({
      where: { id: childId },
      data: {
        failedPinAttempts: 0,
        lockedUntil: new Date(Date.now() + LOCK_MS),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: childId },
      data: { failedPinAttempts: nextAttempts },
    });
  }
}

export async function clearAttempts(childId: string) {
  await prisma.user.update({
    where: { id: childId },
    data: { failedPinAttempts: 0, lockedUntil: null },
  });
}
