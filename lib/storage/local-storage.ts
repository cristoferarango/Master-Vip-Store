import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Almacenamiento de archivos para desarrollo local: guarda en
 * /public/uploads/<carpeta>/. La interfaz (saveUploadedFile) está pensada
 * para poder reemplazarse por S3/Cloudinary en producción sin tocar el
 * código que la llama — solo se cambiaría esta implementación.
 */

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export type UploadFolder = "productos" | "avatares" | "depositos";

export async function saveUploadedFile(
  file: File,
  folder: UploadFolder
): Promise<string> {
  const targetDir = path.join(UPLOADS_ROOT, folder);
  await mkdir(targetDir, { recursive: true });

  const ext = path.extname(file.name) || ".bin";
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(targetDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Ruta pública servida por Next.js desde /public
  return `/uploads/${folder}/${filename}`;
}
