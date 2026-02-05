
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import TemplateList from './template-list'

async function getTemplates() {
    const supabase = createAdminClient()
    const { data } = await supabase
        .from('notification_templates')
        .select('*')
        .order('key', { ascending: true })

    return data || []
}

export default async function TemplatesPage() {
    const templates = await getTemplates()

    return (
        <Card>
            <CardContent className="pt-6">
                <TemplateList templates={templates} />
            </CardContent>
        </Card>
    )
}
