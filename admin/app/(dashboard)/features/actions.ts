'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type FeatureFlag = Database['public']['Tables']['feature_flags']['Insert']

export async function upsertFeatureFlag(data: FeatureFlag) {
    const supabase = await createClient()

    if (!data.key || !data.name) {
        return { error: 'Key e Nome são obrigatórios' }
    }

    const { error } = await supabase
        .from('feature_flags')
        .upsert(data as any)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/features')
    return { success: true }
}

export async function deleteFeatureFlag(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/features')
    return { success: true }
}
