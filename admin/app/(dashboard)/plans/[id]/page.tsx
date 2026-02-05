
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PlanEditor from './plan-editor'
import type { Database } from '@/types/database'

type Plan = Database['public']['Tables']['subscription_plans']['Row']
type FeatureFlag = Database['public']['Tables']['feature_flags']['Row']
type PlanFeature = Database['public']['Tables']['plan_features']['Row']

async function getPlan(id: string) {
    if (id === 'new') return null
    const supabase = createAdminClient()
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', id)
        .single()

    return plan as Plan | null
}

async function getFeatureFlags() {
    const supabase = createAdminClient()
    const { data } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name')
    return data as FeatureFlag[] || []
}

async function getPlanFeatures(planId: string) {
    if (planId === 'new') return []
    const supabase = createAdminClient()
    const { data } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_id', planId)
    return data as PlanFeature[] || []
}

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const plan = await getPlan(id)
    const featureFlags = await getFeatureFlags()
    const planFeatures = await getPlanFeatures(id)

    if (id !== 'new' && !plan) {
        notFound()
    }

    return (
        <PlanEditor
            initialPlan={plan}
            featureFlags={featureFlags}
            initialPlanFeatures={planFeatures}
            isNew={id === 'new'}
        />
    )
}
