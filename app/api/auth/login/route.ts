import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth.schema";
import { login, AuthError } from "@/lib/actions/auth.actions";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Límite amplio por IP (evita barrido de muchas cuentas desde un mismo origen)
  // y uno más ajustado por IP+correo (evita fuerza bruta dirigida a una cuenta).
  if (!checkRateLimit(`login:ip:${ip}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Espera unos minutos y vuelve a intentar." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  if (!checkRateLimit(`login:acct:${ip}:${parsed.data.email.toLowerCase()}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos con este correo. Espera unos minutos y vuelve a intentar." },
      { status: 429 }
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
