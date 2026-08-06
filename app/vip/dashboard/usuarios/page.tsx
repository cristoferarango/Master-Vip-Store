import { getAllUsers } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UserDetailButton } from "@/components/vip/UserDetailModal";
import { EditUserButton } from "@/components/vip/EditUserModal";
import { formatDatePE } from "@/lib/utils/dates";

export default async function VipUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Usuarios registrados</h1>
        <p className="text-sm text-muted-foreground">{users.length} cuentas en la plataforma.</p>
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
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{u.name}</span>
                    {u.providerProfile && <Badge tone="primary">Proveedor</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.whatsapp}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDatePE(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <UserDetailButton userId={u.id} userName={u.name} />
                    <EditUserButton
                      userId={u.id}
                      initialEmail={u.email}
                      initialWhatsapp={u.whatsapp}
                      isProvider={!!u.providerProfile}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Todavía no hay usuarios registrados.</p>
        )}
      </Card>
    </div>
  );
}
