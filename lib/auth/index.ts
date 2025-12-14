import { getServerSession } from "next-auth/next";
import { authOptions } from "./config";
import { prisma } from "@/lib/db";

export { authOptions };

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);

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
