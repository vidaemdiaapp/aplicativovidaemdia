
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
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLink, FileText } from 'lucide-react'
import type { Database } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Invoice = Database['public']['Tables']['invoices']['Row']

async function getInvoices() {
    const supabase = createAdminClient()

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) as { data: Invoice[] | null, error: any }

    if (error || !invoices) {
        console.error('Error fetching invoices:', error)
        return []
    }

    const userIds = Array.from(new Set(invoices.map(i => i.user_id).filter(Boolean))) as string[]

    let profilesMap = new Map<string, { full_name: string | null, avatar_url: string | null }>()

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds) as { data: any[] | null }

        profiles?.forEach(p => profilesMap.set(p.id, p))
    }

    return invoices.map(inv => ({
        ...inv,
        profile: inv.user_id ? profilesMap.get(inv.user_id) : null
    }))
}

function getStatusBadge(status: string | null) {
    switch (status) {
        case 'paid':
            return <Badge className="bg-green-600 capitalize">{status}</Badge>
        case 'open':
            return <Badge className="bg-blue-600 capitalize">{status}</Badge>
        case 'void':
        case 'canceled':
            return <Badge variant="outline" className="capitalize text-muted-foreground">{status}</Badge>
        case 'expired':
            return <Badge variant="destructive" className="capitalize">{status}</Badge>
        default:
            return <Badge variant="outline" className="capitalize">{status}</Badge>
    }
}

function formatCurrency(cents: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency || 'BRL'
    }).format(cents / 100)
}

function getInitials(name: string | null) {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export default async function BillingPage() {
    const invoices = await getInvoices()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Faturas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data Criação</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead className="w-[100px]">PDF</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhuma fatura encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-mono text-xs">
                                        {format(new Date(inv.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={inv.profile?.avatar_url || ''} />
                                                <AvatarFallback>{getInitials(inv.profile?.full_name || null)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{inv.profile?.full_name || 'Usuário Desconhecido'}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{inv.user_id?.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatCurrency(inv.amount_cents, inv.currency)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(inv.status)}
                                    </TableCell>
                                    <TableCell>
                                        {inv.due_date
                                            ? format(new Date(inv.due_date), "dd/MM/yyyy", { locale: ptBR })
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {inv.secure_url ? (
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={inv.secure_url} target="_blank" rel="noopener noreferrer">
                                                    <FileText className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
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
