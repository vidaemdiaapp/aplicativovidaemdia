
import { createAdminClient } from "@/lib/supabase/admin"
import { AuditList } from "./audit-list"

export default async function AuditPage() {
    const supabase: any = createAdminClient()
    const { data: logs } = await supabase
        .from("admin_audit_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
                <p className="text-muted-foreground">
                    Rastreamento de ações administrativas (últimos 100 registros).
                </p>
            </div>
            <AuditList logs={logs || []} />
        </div>
    )
}
