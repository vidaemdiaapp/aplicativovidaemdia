
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, Clock, Bell } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/types/database'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Reminder = Database['public']['Tables']['event_reminders']['Row']

async function getEventDetails(id: string) {
    const supabase = createAdminClient()

    // 1. Get Event
    const { data: event, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .single() as { data: CalendarEvent | null, error: any }

    if (error || !event) {
        return null
    }

    // 2. Get User
    let user: Partial<Profile> & { email?: string } | null = null
    if (event.user_id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', event.user_id)
            .single() as { data: Profile | null }

        const { data: authData } = await supabase.auth.admin.getUserById(event.user_id)

        if (profile) {
            user = { ...profile, email: authData?.user?.email }
        }
    }

    // 3. Get Reminders
    const { data: reminders } = await supabase
        .from('event_reminders')
        .select('*')
        .eq('event_id', id)
        .order('scheduled_for', { ascending: true })

    return {
        event,
        user,
        reminders: reminders as Reminder[] || []
    }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getEventDetails(id)

    if (!data) {
        return notFound()
    }

    const { event, user, reminders } = data

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/agenda/events">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Detalhes do Evento</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-mono text-xs">{event.id}</span>
                        <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                            {event.status || 'Pendente'}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{event.title || 'Sem título'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {event.description && (
                                <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {event.description}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Início
                                    </div>
                                    <p>
                                        {event.start_at
                                            ? format(new Date(event.start_at), "PPPP 'às' HH:mm", { locale: ptBR })
                                            : '-'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                                        <Clock className="mr-2 h-4 w-4" />
                                        Fim
                                    </div>
                                    <p>
                                        {event.end_at
                                            ? format(new Date(event.end_at), "PPPP 'às' HH:mm", { locale: ptBR })
                                            : '-'}
                                    </p>
                                </div>
                                {event.location && (
                                    <div className="col-span-2 space-y-1">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Localização
                                        </div>
                                        <p>{event.location}</p>
                                    </div>
                                )}
                                {event.link && (
                                    <div className="col-span-2 space-y-1">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <LinkIcon className="mr-2 h-4 w-4" />
                                            Link
                                        </div>
                                        <a href={event.link} target="_blank" className="text-blue-600 hover:underline break-all">
                                            {event.link}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Lembretes ({reminders.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reminders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nenhum lembrete configurado.</p>
                                ) : (
                                    reminders.map(rem => (
                                        <div key={rem.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {rem.minutes_before} min antes
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Agendado: {rem.scheduled_for ? format(new Date(rem.scheduled_for), "dd/MM HH:mm") : '?'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{rem.channel}</Badge>
                                                <Badge className={rem.status === 'sent' ? 'bg-green-600' : rem.status === 'failed' ? 'bg-red-600' : 'bg-gray-500'}>
                                                    {rem.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usuário</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user ? (
                                <div className="flex flex-col items-center text-center space-y-3">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={user.avatar_url || ''} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-lg">{user.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        <Link href={`/users/${user.id}`}>
                                            <Button variant="outline" size="sm" className="mt-4">
                                                Ver Perfil Completo
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Usuário não encontrado</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recorrência</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {event.recurrence_rrule ? (
                                <code className="text-xs bg-muted p-2 rounded block break-all">
                                    {event.recurrence_rrule}
                                </code>
                            ) : (
                                <p className="text-sm text-muted-foreground">Evento único (sem repetição)</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Metadados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Criado em:</span>
                                <span>{new Date(event.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Atualizado em:</span>
                                <span>{new Date(event.updated_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tag ID:</span>
                                <span className="font-mono">{event.tag_id ? event.tag_id.slice(0, 8) : '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
