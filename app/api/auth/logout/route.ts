import { NextResponse } from "next/server";
import { logout } from "@/lib/actions/auth.actions";

export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
