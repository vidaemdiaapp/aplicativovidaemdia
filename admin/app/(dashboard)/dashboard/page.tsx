
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    Users,
    CreditCard,
    Activity,
    MessageSquare,
    ArrowUpRight,
    TrendingUp,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function getStats() {
    const supabase = createAdminClient()

    // 1. Total users
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // 2. Active subscriptions
    const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

    // 3. New users this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

    // 4. Messages Sent Today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { count: messagesToday } = await supabase
        .from('notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('created_at', startOfDay.toISOString())

    return {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        messagesToday: messagesToday || 0,
    }
}

async function getRecentActivity() {
    const supabase = createAdminClient()

    // Fetch last 5 new users
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5) as { data: { id: string, full_name: string | null, created_at: string }[] | null }

    // Fetch last 5 sent messages
    const { data: logs } = await supabase
        .from('notification_logs')
        .select('id, channel, created_at, template_key')
        .order('created_at', { ascending: false })
        .limit(5) as { data: { id: string, channel: string, created_at: string, template_key: string | null }[] | null }

    const activity: { id: string, type: 'user' | 'message', title: string, date: Date, icon: any, color: string }[] = []

    if (users) {
        users.forEach(u => {
            activity.push({
                id: u.id,
                type: 'user',
                title: `Novo usuário: ${u.full_name || 'Sem nome'}`,
                date: new Date(u.created_at),
                icon: Users,
                color: 'text-blue-600 bg-blue-100'
            })
        })
    }

    if (logs) {
        logs.forEach(l => {
            activity.push({
                id: l.id,
                type: 'message',
                title: `Disparo ${l.channel}: ${l.template_key}`,
                date: new Date(l.created_at),
                icon: MessageSquare,
                color: 'text-purple-600 bg-purple-100'
            })
        })
    }

    // Sort by date desc and take top 5
    return activity.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6)
}

export default async function DashboardPage() {
    const stats = await getStats()
    const recentActivity = await getRecentActivity()

    const cards = [
        {
            title: 'Total de Usuários',
            value: stats.totalUsers.toLocaleString('pt-BR'),
            description: 'Usuários cadastrados',
            icon: Users,
            trend: '+12%', // Mock trend for now
            trendUp: true,
        },
        {
            title: 'Assinaturas Ativas',
            value: stats.activeSubscriptions.toLocaleString('pt-BR'),
            description: 'Planos pagos ativos',
            icon: CreditCard,
            trend: '+5%',
            trendUp: true,
        },
        {
            title: 'Novos no Mês',
            value: stats.newUsersThisMonth.toLocaleString('pt-BR'),
            description: 'Crescimento mensal',
            icon: TrendingUp,
            trend: '+23%',
            trendUp: true,
        },
        {
            title: 'Mensagens Hoje',
            value: stats.messagesToday.toLocaleString('pt-BR'),
            description: 'Disparos enviados',
            icon: Activity,
            trend: 'Diário',
            trendUp: true,
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Visão geral de performance do Vida em Dia
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span
                                    className={
                                        card.trendUp ? 'text-green-500' : 'text-red-500'
                                    }
                                >
                                    <ArrowUpRight className="h-3 w-3 inline" />
                                    {card.trend}
                                </span>
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">Nenhuma atividade recente.</p>
                            ) : (
                                recentActivity.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${item.color}`}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(item.date, { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Status do Sistema</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-green-50 border border-green-200">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-800">
                                        Supabase Operacional
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Banco de dados conectado
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">
                                        Jobs Processor
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        Aguardando configuração de infra
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
