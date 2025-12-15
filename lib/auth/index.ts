import { auth } from "./config";
import { prisma } from "@/lib/db";

export { auth };

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

export async function getUserWithDetails(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      financeAccounts: {
        include: {
          institution: true,
        },
      },
    },
  });
}
