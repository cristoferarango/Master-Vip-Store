import QRCode from "qrcode";
import { Card } from "@/components/ui/Card";
import { DepositRequestForm } from "@/components/streaming/DepositRequestForm";

export default async function RecargarSaldoPage() {
  const yapeNumber = process.env.YAPE_NUMBER ?? "934546289";
  const qrDataUrl = await QRCode.toDataURL(`Yape ${yapeNumber} - Master Vip Store`, {
    margin: 1,
    width: 220,
    color: { dark: "#1a0b2e", light: "#f4f2fb" },
  });

  return (
    <div className="mx-auto grid max-w-3xl gap-6 py-4 md:grid-cols-2">
      <Card className="flex flex-col items-center text-center">
        <h1 className="mb-1 text-lg font-semibold text-foreground">Recarga por Yape</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Escanea el código o yapea directamente al número:
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Código QR de Yape" width={200} height={200} className="rounded-xl" />
        <p className="mt-4 text-2xl font-bold text-foreground">{yapeNumber}</p>
        <p className="mt-1 text-xs text-muted-foreground">Master Vip Store</p>
        <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-left text-xs text-muted-foreground">
          <li>Yapea el monto que quieras recargar a este número.</li>
          <li>Copia el código de operación (o toma una captura).</li>
          <li>Complétalo en el formulario y espera la aprobación.</li>
        </ol>
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-foreground">Reportar mi depósito</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Tu saldo se acredita apenas confirmemos el pago.
        </p>
        <DepositRequestForm />
      </Card>
    </div>
  );
}
