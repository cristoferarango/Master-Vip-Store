"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Check, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getCheckoutInfo, createPurchaseRequest } from "@/lib/actions/purchase.actions";
import { formatSoles } from "@/lib/utils/currency";
import { formatOrderId } from "@/lib/utils/orderId";
import { buildActivationWhatsappLink } from "@/lib/utils/whatsapp";

type CheckoutInfo = NonNullable<Awaited<ReturnType<typeof getCheckoutInfo>>>;

export function PaymentCheckoutModal({
  productId,
  open,
  onClose,
}: {
  productId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [info, setInfo] = useState<CheckoutInfo | null>(null);
  const fetchedRef = useRef(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [operationCode, setOperationCode] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    getCheckoutInfo(productId).then(setInfo);
  }, [open, productId]);

  function copyNumber() {
    if (!info?.yapeNumber) return;
    navigator.clipboard.writeText(info.yapeNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleScreenshotChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "pagos");
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir la captura");
        return;
      }
      setScreenshotUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!screenshotUrl) {
      setError("Sube la captura de tu pago por Yape.");
      return;
    }
    if (info?.productType === "ACTIVACION" && !clientEmail) {
      setError("Ingresa el correo donde se activará el servicio.");
      return;
    }

    setSubmitting(true);
    const result = await createPurchaseRequest({
      productId,
      screenshotUrl,
      operationCode: operationCode || undefined,
      clientEmail: info?.productType === "ACTIVACION" ? clientEmail : undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setRequestId(result.data.requestId);
    setDone(true);
    router.refresh();
  }

  function handleClose() {
    onClose();
    // Reinicia el formulario para la próxima vez que se abra (con otro producto o el mismo).
    setTimeout(() => {
      setDone(false);
      setScreenshotUrl("");
      setOperationCode("");
      setClientEmail("");
      setInfo(null);
      setRequestId(null);
      fetchedRef.current = false;
    }, 200);
  }

  return (
    <Modal open={open} onClose={handleClose} title={done ? "Solicitud enviada" : "Pagar con Yape"}>
      {open && !info && !done && <p className="text-sm text-muted-foreground">Cargando datos de pago...</p>}

      {done && requestId && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <p className="text-sm text-foreground">
            Enviamos tu comprobante. En cuanto se valide el pago, la cuenta aparecerá en{" "}
            <span className="font-medium">Mis compras</span>.
          </p>

          <div className="flex flex-col items-center gap-1 rounded-2xl border border-border-strong bg-surface px-6 py-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tu código de solicitud
            </span>
            <span className="text-3xl font-extrabold tracking-wide text-foreground">
              {formatOrderId(requestId)}
            </span>
            <span className="text-xs text-muted-foreground">Guárdalo — lo vas a necesitar para dar seguimiento.</span>
          </div>

          {info?.productType === "ACTIVACION" && info.providerWhatsapp && (
            <a
              href={buildActivationWhatsappLink({
                whatsapp: info.providerWhatsapp,
                productName: info.productName,
                orderCode: formatOrderId(requestId),
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="press-feedback inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-strong px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110"
            >
              <MessageCircle size={16} /> Escribir al proveedor por WhatsApp
            </a>
          )}

          <Button onClick={handleClose}>Entendido</Button>
        </div>
      )}

      {info && !done && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs text-muted-foreground">Paga directo al proveedor</p>
            <p className="mb-3 text-lg font-bold text-foreground">{formatSoles(info.price)}</p>

            {info.yapeQrUrl ? (
              <div className="relative mx-auto mb-3 h-28 w-28 overflow-hidden rounded-lg border border-border bg-white">
                <Image src={info.yapeQrUrl} alt={`QR de Yape de ${info.providerName}`} fill className="object-contain p-1.5" />
              </div>
            ) : (
              <p className="mb-3 text-xs text-warning">Este proveedor todavía no subió su QR — usa el número.</p>
            )}

            {info.yapeNumber ? (
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-base font-semibold text-foreground">{info.yapeNumber}</span>
                <button type="button" onClick={copyNumber} aria-label="Copiar número de Yape" className="text-muted-foreground hover:text-foreground">
                  {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-danger">Este proveedor todavía no configuró su Yape. Contáctalo antes de pagar.</p>
            )}
            {info.yapeName && <p className="mt-1 text-xs text-muted-foreground">A nombre de {info.yapeName}</p>}
          </div>

          {info.productType === "ACTIVACION" && (
            <Input
              label="Correo donde se activará el servicio"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/90">Captura del pago</label>
            <input
              type="file"
              accept="image/*"
              required={!screenshotUrl}
              onChange={(e) => handleScreenshotChange(e.target.files?.[0] ?? null)}
              className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-strong file:px-3 file:py-1.5 file:text-foreground"
            />
            {uploading && <p className="text-xs text-muted-foreground">Subiendo...</p>}
            {screenshotUrl && <p className="text-xs text-success">Captura lista.</p>}
          </div>

          <Input
            label="Código de operación (opcional)"
            value={operationCode}
            onChange={(e) => setOperationCode(e.target.value)}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" isLoading={submitting} disabled={uploading}>
            Enviar comprobante
          </Button>
        </form>
      )}
    </Modal>
  );
}
