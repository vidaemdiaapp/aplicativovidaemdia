'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Template = Database['public']['Tables']['notification_templates']['Insert']

export async function upsertTemplate(data: Template) {
    const supabase = createAdminClient()

    if (!data.key || !data.name || !data.body) {
        return { error: 'Key, Nome e Corpo são obrigatórios' }
    }

    const { error } = await supabase
        .from('notification_templates')
        .upsert(data as any) // Type assertion if needed

    if (error) {
        console.error('Error upserting template:', error)
        return { error: error.message }
    }

    revalidatePath('/messaging/templates')
    return { success: true }
}

export async function deleteTemplate(id: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/messaging/templates')
    return { success: true }
}
