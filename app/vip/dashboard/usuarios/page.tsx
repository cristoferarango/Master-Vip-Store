import { getAllUsers } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export default async function VipUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Usuarios registrados</h1>
        <p className="text-sm text-muted-foreground">{users.length} clientes en la plataforma.</p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Compras</th>
              <th className="px-4 py-3 font-medium">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.whatsapp}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatSoles(u.wallet?.balance.toString() ?? "0")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.purchases}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDatePE(u.createdAt)}</td>
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
