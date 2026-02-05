'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function updateRequestStatus(id: string, status: 'completed' | 'rejected') {
    const supabase: any = createAdminClient()
    const { error } = await supabase
        .from('data_deletion_requests' as any)
        .update({
            status,
            completed_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/compliance/requests')
}

export async function seedAuditLogs() {
    const supabase: any = createAdminClient()

    // Check if empty
    const { count } = await supabase.from('admin_audit_logs' as any).select('*', { count: 'exact', head: true })
    if (count && count > 0) return

    const logs = [
        {
            action: 'user.block',
            entity_type: 'user',
            entity_id: 'user_123',
            before: { status: 'active' },
            after: { status: 'blocked' },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
            action: 'subscription.cancel',
            entity_type: 'subscription',
            entity_id: 'sub_123',
            before: { status: 'active' },
            after: { status: 'canceled' },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        }
    ]

    await supabase.from('admin_audit_logs' as any).insert(logs)
    revalidatePath('/compliance/audit')
}

export async function seedDeletionRequest() {
    const supabase: any = createAdminClient()

    // Get a random user or creating a mock user ID if none
    const { data: users } = await supabase.from('profiles').select('id').limit(1)
    const userId = users && users.length > 0 ? users[0].id : '00000000-0000-0000-0000-000000000000'

    await supabase.from('data_deletion_requests' as any).insert({
        user_id: userId,
        reason: 'Solicito a exclusão dos meus dados pessoais conforme a LGPD.',
        status: 'pending'
    })
    revalidatePath('/compliance/requests')
}
