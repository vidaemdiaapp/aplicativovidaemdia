import { Sidebar, Header, Breadcrumbs } from '@/components/layout'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Get admin user details
    let adminUser: { full_name: string | null } | null = null
    if (user?.id) {
        const { data } = await supabase
            .from('admin_users')
            .select('full_name')
            .eq('id', user.id)
            .single() as { data: { full_name: string | null } | null }
        adminUser = data
    }

    const userData = {
        email: user?.email || '',
        full_name: adminUser?.full_name,
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header user={userData} />
                <main className="flex-1 overflow-auto p-6">
                    <Breadcrumbs />
                    {children}
                </main>
            </div>
        </div>
    )
}
