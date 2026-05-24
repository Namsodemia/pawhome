import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function GET() {
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
}
