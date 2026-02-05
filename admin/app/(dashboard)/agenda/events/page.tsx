
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Eye, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

async function getEvents() {
    const supabase = createAdminClient()

    const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_at', { ascending: false })
        .limit(50) as { data: CalendarEvent[] | null, error: any }

    if (error || !events) {
        console.error('Error fetching events:', error)
        return []
    }

    // Get Profiles
    const userIds = Array.from(new Set(events.map(e => e.user_id).filter(Boolean))) as string[]

    let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds) as { data: { id: string, full_name: string | null, avatar_url: string | null }[] | null }

        profiles?.forEach(p => {
            profilesMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url })
        })
    }

    return events.map(e => ({
        ...e,
        user: e.user_id ? profilesMap.get(e.user_id) : null
    }))
}

export default async function EventsPage() {
    const events = await getEvents()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
                <p className="text-muted-foreground">
                    Lista dos últimos eventos agendados pelos usuários.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Últimos 50 Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Evento</TableHead>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Local</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum evento encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={event.user?.avatar_url || ''} />
                                                    <AvatarFallback>U</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {event.user?.full_name || 'Usuário Desconhecido'}
                                                    </span>
                                                    <Link
                                                        href={`/users/${event.user_id}`}
                                                        className="text-xs text-muted-foreground hover:underline"
                                                    >
                                                        Ver perfil
                                                    </Link>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{event.title}</div>
                                            {event.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {event.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {event.start_at ? format(new Date(event.start_at), "dd 'de' MMM, HH:mm", { locale: ptBR }) : '-'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {event.all_day ? 'Dia inteiro' : event.end_at ? `Até ${format(new Date(event.end_at), "HH:mm")}` : ''}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {event.location ? (
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <MapPin className="mr-1 h-3 w-3" />
                                                    {event.location}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                                                {event.status || 'Pendente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/agenda/events/${event.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
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
