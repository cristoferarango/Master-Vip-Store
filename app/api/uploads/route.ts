import { NextResponse } from "next/server";
import { saveUploadedFile, type UploadFolder } from "@/lib/storage/local-storage";
import { getSession } from "@/lib/auth/session";

const ALLOWED_FOLDERS: UploadFolder[] = ["productos", "avatares", "yape-qr", "pagos"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Extensión fija por tipo MIME — NUNCA se deriva del nombre de archivo que
// manda el cliente (atacante-controlado). Evita guardar un .svg/.html
// disfrazado de imagen que, al abrirse directo (ej. "ver captura" en una
// pestaña nueva), ejecutaría JavaScript en el origen del sitio.
const MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Verifica los primeros bytes del archivo contra la "firma" real del
 * formato — el Content-Type que manda el navegador es solo una etiqueta
 * declarada por el cliente y se puede falsificar con una petición hecha a
 * mano (curl/Postman), así que no basta con confiar en `file.type`.
 */
function matchesSignature(bytes: Uint8Array, mimeType: string): boolean {
  const sig = (...expected: number[]) => expected.every((b, i) => bytes[i] === b);

  switch (mimeType) {
    case "image/png":
      return sig(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/jpeg":
      return sig(0xff, 0xd8, 0xff);
    case "image/gif":
      return sig(0x47, 0x49, 0x46, 0x38); // "GIF8" (7a u 9a según versión)
    case "image/webp":
      // "RIFF" .... "WEBP"
      return sig(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    default:
      return false;
  }
}

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

  const extension = MIME_TO_EXT[file.type];
  if (!extension) {
    return NextResponse.json({ ok: false, error: "Formato de archivo no permitido" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ ok: false, error: `El archivo supera ${MAX_SIZE_BYTES / (1024 * 1024)}MB` }, { status: 400 });
  }

  const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!matchesSignature(headerBytes, file.type)) {
    return NextResponse.json(
      { ok: false, error: "El contenido del archivo no coincide con una imagen válida" },
      { status: 400 }
    );
  }

  const url = await saveUploadedFile(file, folder as UploadFolder, extension);
  return NextResponse.json({ ok: true, url, mimeType: file.type });
}
