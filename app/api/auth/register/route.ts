import { NextResponse } from "next/server";
import { registerClientSchema, registerProviderSchema } from "@/lib/validators/auth.schema";
import { registerClient, registerProvider, AuthError } from "@/lib/actions/auth.actions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  const kind = (body as { kind?: string }).kind;

  try {
    if (kind === "proveedor") {
      const parsed = registerProviderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
          { status: 400 }
        );
      }
      const user = await registerProvider(parsed.data);
      return NextResponse.json({ ok: true, role: user.role, isAdmin: user.isAdmin });
    }

    const parsed = registerClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    const user = await registerClient(parsed.data);
    return NextResponse.json({ ok: true, role: user.role, isAdmin: user.isAdmin });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    console.error("Error en /api/auth/register:", err);
    return NextResponse.json({ ok: false, error: "Error del servidor" }, { status: 500 });
  }
}
