import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
    Calendar,
    CreditCard,
    Mail,
    MessageSquare,
    Settings,
    Shield,
    User,
    Clock,
    Activity,
    Flag,
    FileText,
} from 'lucide-react'
import UserFeatures from './user-features'

interface UserPageProps {
    params: Promise<{ id: string }>
}

import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

async function getUser(id: string) {
    const supabase = createAdminClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single() as { data: Profile | null }

    if (!profile) {
        return null
    }

    // Get auth user
    const { data: authData } = await supabase.auth.admin.getUserById(id)

    // Get events count
    const { count: eventsCount } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)

    // Get documents count
    const { count: documentsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)

    return {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        plan_id: profile.plan_id,
        onboarding_completed: profile.onboarding_completed,
        usage_current_month: profile.usage_current_month,
        timezone: profile.timezone,
        taxpayer_type: profile.taxpayer_type,
        created_at: profile.created_at,
        email: authData?.user?.email || 'N/A',
        last_sign_in_at: authData?.user?.last_sign_in_at,
        eventsCount: eventsCount || 0,
        documentsCount: documentsCount || 0,
    }
}

function getInitials(name: string | null, email: string) {
    if (name) {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
}

function getPlanInfo(planId: string | null) {
    switch (planId) {
        case 'premium':
            return { label: 'Premium', color: 'bg-yellow-500' }
        case 'pro':
            return { label: 'Pro', color: 'bg-blue-500' }
        default:
            return { label: 'Free', color: 'bg-gray-500' }
    }
}

export default async function UserDetailPage({ params }: UserPageProps) {
    const { id } = await params
    const user = await getUser(id)

    const supabase = createAdminClient()
    const { data: overrides } = await supabase.from('entitlement_overrides').select('*').eq('user_id', id)
    const { data: features } = await supabase.from('feature_flags').select('key, name')
    const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false }) as { data: Database['public']['Tables']['invoices']['Row'][] | null }

    if (!user) {
        notFound()
    }

    const plan = getPlanInfo(user.plan_id)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="text-xl">
                            {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {user.full_name || 'Sem nome'}
                        </h2>
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className={plan.color}>{plan.label}</Badge>
                            {user.onboarding_completed ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                    Onboarding completo
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                    Onboarding pendente
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Bloquear</Button>
                    <Button variant="outline">Override Plano</Button>
                    <Button>Enviar Mensagem</Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Eventos</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.eventsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.documentsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Uso mensal</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.usage_current_month || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Último acesso</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {user.last_sign_in_at
                                ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                                : 'Nunca'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Assinatura
                    </TabsTrigger>
                    <TabsTrigger value="agenda" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Agenda
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Mensagens
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Logs
                    </TabsTrigger>
                    <TabsTrigger value="features" className="gap-2">
                        <Flag className="h-4 w-4" />
                        Features
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Perfil</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">ID</p>
                                    <p className="font-mono text-sm">{user.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                                    <p>{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                                    <p>{user.full_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Timezone</p>
                                    <p>{user.timezone || 'UTC'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tipo contribuinte</p>
                                    <p>{user.taxpayer_type || 'CLT'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Cadastro</p>
                                    <p>{new Date(user.created_at || '').toLocaleString('pt-BR')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscription">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assinatura & Cobranças</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-lg ${plan.color} flex items-center justify-center text-white font-bold`}>
                                        {plan.label[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium">Plano {plan.label}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.plan_id === 'free'
                                                ? 'Sem cobrança'
                                                : 'Cobrança mensal'}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline">Alterar Plano</Button>
                            </div>
                            <Separator className="my-4" />
                            <h3 className="text-sm font-medium mb-4">Histórico de Faturas</h3>
                            {invoices && invoices.length > 0 ? (
                                <div className="space-y-2">
                                    {invoices.map((inv) => (
                                        <div key={inv.id} className="flex items-center justify-between p-3 border rounded-md text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-green-500' : inv.status === 'open' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: inv.currency || 'BRL' }).format(inv.amount_cents / 100)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground mr-2">
                                                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize">{inv.status}</Badge>
                                                {inv.secure_url && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                                        <a href={inv.secure_url} target="_blank" rel="noopener noreferrer">
                                                            <FileText className="h-3 w-3" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Nenhuma fatura encontrada.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="agenda">
                    <Card>
                        <CardHeader>
                            <CardTitle>Eventos da Agenda</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-8">
                                {user.eventsCount > 0
                                    ? `${user.eventsCount} eventos cadastrados`
                                    : 'Nenhum evento cadastrado'}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Mensagens</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Mensagens enviadas serão listadas aqui.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Logs Técnicos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Logs de atividade do usuário serão exibidos aqui.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="features">
                    <UserFeatures
                        userId={id}
                        overrides={overrides as any[] || []}
                        availableFeatures={features as any[] || []}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
