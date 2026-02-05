
import { createAdminClient } from "@/lib/supabase/admin"
import { RequestList } from "./request-list"

export default async function RequestsPage() {
    const supabase: any = createAdminClient()
    const { data: requests } = await supabase
        .from("data_deletion_requests" as any)
        .select("*")
        .order("requested_at", { ascending: false })

    // Manual fetch users for hydration
    let users: any[] = []
    if (requests && requests.length > 0) {
        const userIds = Array.from(new Set(requests.map((r: any) => r.user_id).filter(Boolean)))
        if (userIds.length > 0) {
            const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
            users = data || []
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">LGPD Requests</h2>
                <p className="text-muted-foreground">
                    Gerenciamento de solicitações de exclusão de dados e privacidade.
                </p>
            </div>
            <RequestList requests={requests || []} users={users} />
        </div>
    )
}
