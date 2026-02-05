
import { createAdminClient } from '@/lib/supabase/admin'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

async function getSubscriptions() {
    const supabase = createAdminClient()

    const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) as { data: Subscription[] | null, error: any }

    if (error || !subs) {
        console.error('Error fetching subscriptions:', error)
        return []
    }

    const userIds = Array.from(new Set(subs.map(s => s.user_id).filter(Boolean))) as string[]

    let profilesMap = new Map<string, { full_name: string | null, email: string | null, avatar_url: string | null }>()

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds) as { data: any[] | null }

        // Try to fetch emails from auth if possible (admin only), 
        // but for now relying on profile info or just ID if auth fetch is heavy for list.
        // Actually user page fetches auth. We can skip email here to be fast, or fetch.
        // Let's stick to profile name.

        profiles?.forEach(p => profilesMap.set(p.id, p))
    }

    return subs.map(sub => ({
        ...sub,
        profile: sub.user_id ? profilesMap.get(sub.user_id) : null
    }))
}

function getStatusBadge(status: string | null) {
    switch (status) {
        case 'active':
        case 'trialing':
            return <Badge className="bg-green-600 capitalize">{status}</Badge>
        case 'canceled':
        case 'unpaid':
            return <Badge variant="destructive" className="capitalize">{status}</Badge>
        case 'past_due':
            return <Badge className="bg-yellow-600 capitalize">{status}</Badge>
        default:
            return <Badge variant="outline" className="capitalize">{status || 'Unknown'}</Badge>
    }
}

function getPlanBadge(planId: string | null) {
    if (!planId) return <Badge variant="outline">N/A</Badge>

    const color = planId === 'premium' ? 'bg-purple-600' :
        planId === 'pro' ? 'bg-blue-600' : 'bg-gray-500'

    return <Badge className={`${color} capitalize hover:${color}`}>{planId}</Badge>
}

function getInitials(name: string | null) {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export default async function SubscriptionsPage() {
    const subscriptions = await getSubscriptions()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Assinaturas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fim do Período</TableHead>
                            <TableHead>Cancelamento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhuma assinatura encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={sub.profile?.avatar_url || ''} />
                                                <AvatarFallback>{getInitials(sub.profile?.full_name || null)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{sub.profile?.full_name || 'Usuário Desconhecido'}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{sub.user_id?.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getPlanBadge(sub.plan_id)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(sub.status)}
                                    </TableCell>
                                    <TableCell>
                                        {sub.current_period_end
                                            ? format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR })
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {sub.cancel_at_period_end ? (
                                            <Badge variant="outline" className="text-red-500 border-red-200">Agendado</Badge>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
