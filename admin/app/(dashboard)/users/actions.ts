'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type OverrideInput = {
    id?: string
    user_id: string
    feature_key: string
    enabled: boolean
    reason: string
    expires_at?: string | null
}

export async function upsertEntitlementOverride(data: OverrideInput) {
    const supabase = createAdminClient()

    // Get current admin user for 'created_by'
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    if (!adminUser) {
        return { error: 'Unauthorized' }
    }

    const payload = {
        ...data,
        created_by: adminUser.id,
        // Ensure feature_key is matched against existing flags if needed, 
        // but database FK will handle valid keys.
    }

    const { error } = await supabase
        .from('entitlement_overrides')
        .upsert(payload as any) // Type assertion to avoid generic issues

    if (error) {
        console.error('Error upserting override:', error)
        return { error: error.message }
    }

    // Opcional: Audit Logger aqui
    /*
    await supabase.from('admin_audit_logs').insert({
        action: data.id ? 'UPDATE_OVERRIDE' : 'CREATE_OVERRIDE',
        target_resource: 'entitlement_overrides',
        target_id: data.user_id, // ou id do override
        details: { feature: data.feature_key, enabled: data.enabled, reason: data.reason },
        actor_id: adminUser.id
    })
    */

    revalidatePath(`/users/${data.user_id}`)
    return { success: true }
}

export async function deleteEntitlementOverride(id: string, userId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('entitlement_overrides')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/users/${userId}`)
    return { success: true }
}
