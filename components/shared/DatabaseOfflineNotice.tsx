import { DatabaseZap } from "lucide-react";

/** Aviso amigable cuando una página no pudo consultar la base de datos (ej. DATABASE_URL sin configurar todavía). */
export function DatabaseOfflineNotice() {
  return (
    <div className="glass-card flex flex-col items-center gap-2 rounded-2xl p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
        <DatabaseZap size={22} />
      </span>
      <h2 className="text-base font-semibold text-foreground">Estamos preparando la tienda</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Todavía no pudimos conectar con la base de datos. Vuelve a intentarlo en un momento.
      </p>
    </div>
  );
}
