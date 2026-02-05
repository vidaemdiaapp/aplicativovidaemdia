
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
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { Database } from '@/types/database'

type Reminder = Database['public']['Tables']['event_reminders']['Row']
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

async function getReminders() {
    const supabase = createAdminClient()

    const { data: reminders, error } = await supabase
        .from('event_reminders')
        .select('*')
        .order('scheduled_for', { ascending: false }) // Mais recentes primeiro (incluindo futuros)
        .limit(50) as { data: Reminder[] | null, error: any } // Force type if needed

    if (error || !reminders) {
        console.error('Error fetching reminders:', error)
        return []
    }

    // Get Events
    const eventIds = Array.from(new Set(reminders.map(r => r.event_id).filter(Boolean))) as string[]

    let eventsMap = new Map<string, CalendarEvent>()
    if (eventIds.length > 0) {
        const { data: events } = await supabase
            .from('calendar_events')
            .select('*')
            .in('id', eventIds) as { data: CalendarEvent[] | null }

        events?.forEach(e => eventsMap.set(e.id, e))
    }

    // Get Profiles (via Events)
    const eventsList = Array.from(eventsMap.values())
    const userIds = Array.from(new Set(eventsList.map(e => e.user_id).filter(Boolean))) as string[]

    let profilesMap = new Map<string, { full_name: string | null }>()
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds) as { data: { id: string, full_name: string | null }[] | null }

        profiles?.forEach(p => profilesMap.set(p.id, { full_name: p.full_name }))
    }

    return reminders.map(r => {
        const event = r.event_id ? eventsMap.get(r.event_id) : null
        const user = event?.user_id ? profilesMap.get(event.user_id) : null
        return {
            ...r,
            eventTitle: event?.title,
            userName: user?.full_name,
        }
    })
}

function getStatusBadge(status: string | null) {
    switch (status) {
        case 'sent':
            return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Enviado</Badge>
        case 'failed':
            return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Falhou</Badge>
        case 'pending':
        default:
            return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pendente</Badge>
    }
}

export default async function RemindersPage() {
    const reminders = await getReminders()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Fila de Lembretes</h2>
                <p className="text-muted-foreground">
                    Monitoramento de notificações agendadas e enviadas.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Últimos 50 Lembretes processados/agendados</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Agendado Para</TableHead>
                                <TableHead>Canal</TableHead>
                                <TableHead>Evento</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead className="w-[200px]">Info/Erro</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reminders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum lembrete na fila.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reminders.map((reminder) => (
                                    <TableRow key={reminder.id}>
                                        <TableCell>
                                            {getStatusBadge(reminder.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-sm">
                                                {reminder.scheduled_for ? format(new Date(reminder.scheduled_for), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {reminder.minutes_before} min antes
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {reminder.channel || 'push'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm truncate max-w-[150px]">
                                                {reminder.eventTitle || 'Evento removido'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {reminder.userName || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]" title={reminder.last_error || ''}>
                                                {reminder.last_error || '-'}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
