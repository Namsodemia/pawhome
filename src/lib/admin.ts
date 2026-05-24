import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "./prisma";

/** Throws via redirect if not an admin. Returns the user. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user || user.role !== "admin") {
    redirect("/app");
  }
  return user;
}
