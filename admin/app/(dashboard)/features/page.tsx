
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FeatureList from './feature-list'
import type { Database } from '@/types/database'

type FeatureFlag = Database['public']['Tables']['feature_flags']['Row']

async function getFeatures() {
    const supabase = createAdminClient()
    const { data } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false })

    return data as FeatureFlag[] || []
}

export default async function FeaturesPage() {
    const features = await getFeatures()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Feature Flags</h2>
                <p className="text-muted-foreground">
                    Gerencie os recursos disponíveis no sistema globalmente.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Features do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                    <FeatureList features={features} />
                </CardContent>
            </Card>
        </div>
    )
}
