'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

type Plan = Database['public']['Tables']['subscription_plans']['Insert']
type PlanFeature = Database['public']['Tables']['plan_features']['Insert']

export async function upsertPlan(data: Plan) {
    const supabase = await createClient()

    // Validação mínima
    if (!data.id || !data.name) {
        return { error: 'ID e Nome são obrigatórios' }
    }

    const { error } = await supabase
        .from('subscription_plans')
        .upsert(data as any)

    if (error) {
        console.error('Error upserting plan:', error)
        return { error: error.message }
    }

    revalidatePath('/plans')
    revalidatePath(`/plans/${data.id}`)

    return { success: true }
}

export async function upsertPlanFeatures(planId: string, features: PlanFeature[]) {
    const supabase = await createClient()

    // Para simplificar, vou remover features anteriores e reinserir, ou fazer upsert em lote.
    // Upsert em lote é melhor.

    // Garantir que todos tenham plan_id
    const featuresToSave = features.map(f => ({ ...f, plan_id: planId }))

    const { error } = await supabase
        .from('plan_features')
        .upsert(featuresToSave as any, { onConflict: 'plan_id, feature_key' })

    if (error) {
        console.error('Error upserting plan features:', error)
        return { error: error.message }
    }

    revalidatePath(`/plans/${planId}`)
    return { success: true }
}

export async function deletePlan(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/plans')
    redirect('/plans')
}
