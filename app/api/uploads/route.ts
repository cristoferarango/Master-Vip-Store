import { NextResponse } from "next/server";
import { saveUploadedFile, type UploadFolder } from "@/lib/storage/local-storage";
import { getSession } from "@/lib/auth/session";

const ALLOWED_FOLDERS: UploadFolder[] = ["productos", "avatares", "depositos"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const folder = formData?.get("folder");

  if (!(file instanceof File) || typeof folder !== "string" || !ALLOWED_FOLDERS.includes(folder as UploadFolder)) {
    return NextResponse.json({ ok: false, error: "Archivo o carpeta inválida" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "Formato de imagen no permitido" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ ok: false, error: "La imagen supera 5MB" }, { status: 400 });
  }

  const url = await saveUploadedFile(file, folder as UploadFolder);
  return NextResponse.json({ ok: true, url });
}
