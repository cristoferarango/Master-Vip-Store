"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "./Button";
import type { UploadFolder } from "@/lib/storage/local-storage";

/** Campo de subida de imagen reutilizable: botón custom, preview a un aspect-ratio fijo, reemplazar/eliminar. */
export function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  aspect = "1080/1440",
  widthClass = "w-28",
  buttonLabel = "Seleccionar archivo",
  hint,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  /** ej. "1080/1440" o "1/1" */
  aspect?: string;
  widthClass?: string;
  buttonLabel?: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir el archivo");
        return;
      }
      onChange(data.url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-foreground/90">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {value ? (
        <div className="flex items-start gap-3">
          <div
            className={`relative ${widthClass} shrink-0 overflow-hidden rounded-lg border border-border bg-white`}
            style={{ aspectRatio: aspect }}
          >
            {/* unoptimized: sirve el archivo tal cual, sin pasar por el optimizador de Next — evita que
                se vea como imagen rota si el hosting no tiene bien configurado ese pipeline. */}
            <Image src={value} alt="Vista previa" fill className="object-contain p-1" unoptimized />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              isLoading={uploading}
              className="gap-1.5"
            >
              <RefreshCw size={14} /> Reemplazar
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => onChange("")} className="gap-1.5">
              <Trash2 size={14} /> Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex ${widthClass} flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-surface p-3 text-center text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-50`}
          style={{ aspectRatio: aspect }}
        >
          <Upload size={18} />
          <span className="text-[11px] leading-tight">{uploading ? "Subiendo..." : buttonLabel}</span>
        </button>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
