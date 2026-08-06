import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth.schema";
import { login, AuthError } from "@/lib/actions/auth.actions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const user = await login(parsed.data);
    return NextResponse.json({
      ok: true,
      role: user.role,
      isAdmin: user.isAdmin,
      hasProvider: !!user.providerProfile,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
    }
    console.error("Error en /api/auth/login:", err);
    return NextResponse.json({ ok: false, error: "Error del servidor" }, { status: 500 });
  }
}
