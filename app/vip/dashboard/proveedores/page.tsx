import Link from "next/link";
import { getAllProviders } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EditProviderButton } from "@/components/vip/EditProviderModal";
import { formatDatePE } from "@/lib/utils/dates";

export default async function VipProvidersPage() {
  const providers = await getAllProviders();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Proveedores</h1>
        <p className="text-sm text-muted-foreground">{providers.length} proveedores registrados.</p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Registrado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {providers.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{p.businessName}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.user.whatsapp}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDatePE(p.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/vip/dashboard/proveedores/${p.id}`}>
                      <Button size="sm" variant="secondary">
                        Detalles
                      </Button>
                    </Link>
                    <EditProviderButton
                      userId={p.userId}
                      providerId={p.id}
                      initialEmail={p.user.email}
                      initialWhatsapp={p.user.whatsapp}
                      status={p.status}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {providers.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Todavía no hay proveedores.</p>
        )}
      </Card>
    </div>
  );
}
