import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateWhatsappSchema } from "@/lib/validators/auth.schema";
import { updateWhatsapp } from "@/lib/actions/auth.actions";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateWhatsappSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  await updateWhatsapp(session.userId, parsed.data.whatsapp);
  return NextResponse.json({ ok: true });
}
