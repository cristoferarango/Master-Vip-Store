import { Mail, Phone, Calendar, User } from "lucide-react";
import { formatDatePE } from "@/lib/utils/dates";

export function AccountInfoCard({
  name,
  email,
  whatsapp,
  createdAt,
}: {
  name: string;
  email: string;
  whatsapp: string;
  createdAt: Date;
}) {
  const rows = [
    { icon: User, label: "Nombre", value: name },
    { icon: Mail, label: "Correo", value: email },
    { icon: Phone, label: "WhatsApp", value: whatsapp },
    { icon: Calendar, label: "Cuenta creada", value: formatDatePE(createdAt) },
  ];

  return (
    <div className="flex flex-col divide-y divide-border">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 py-2.5 text-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-strong text-accent">
            <Icon size={14} />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-foreground">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
