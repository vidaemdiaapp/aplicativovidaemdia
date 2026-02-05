import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Search, UserPlus, Download } from 'lucide-react'
import Link from 'next/link'

import type { Database } from '@/types/database'
type Profile = Database['public']['Tables']['profiles']['Row']

async function getUsers() {
    const supabase = createAdminClient()

    const { data: users, error } = await supabase
        .from('profiles')
        .select(`
      id,
      full_name,
      avatar_url,
      created_at,
      plan_id,
      onboarding_completed,
      usage_current_month
    `)
        .order('created_at', { ascending: false })
        .limit(50) as { data: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'created_at' | 'plan_id' | 'onboarding_completed' | 'usage_current_month'>[] | null, error: any }

    if (error || !users) {
        console.error('Error fetching users:', error)
        return []
    }

    // Get auth emails
    const { data: authData } = await supabase.auth.admin.listUsers({
        perPage: 100,
    })

    const emailMap = new Map<string, string>()
    authData?.users?.forEach((u) => {
        emailMap.set(u.id, u.email || '')
    })

    return users.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        plan_id: user.plan_id,
        onboarding_completed: user.onboarding_completed,
        usage_current_month: user.usage_current_month,
        email: emailMap.get(user.id) || 'N/A',
    }))
}

function getPlanBadge(planId: string | null) {
    switch (planId) {
        case 'premium':
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Premium</Badge>
        case 'pro':
            return <Badge className="bg-blue-500 hover:bg-blue-600">Pro</Badge>
        case 'free':
        default:
            return <Badge variant="secondary">Free</Badge>
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

export default async function UsersPage() {
    const users = await getUsers()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
                    <p className="text-muted-foreground">
                        Gerencie todos os usuários do app
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    <Button size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Buscar por nome ou e-mail..." className="pl-10" />
                    </div>
                    <Button variant="outline">Todos os planos</Button>
                    <Button variant="outline">Status</Button>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Plano</TableHead>
                                <TableHead>Onboarding</TableHead>
                                <TableHead>Uso mensal</TableHead>
                                <TableHead>Cadastro</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar_url || ''} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(user.full_name, user.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/users/${user.id}`}
                                            className="hover:underline"
                                        >
                                            <div className="font-medium">
                                                {user.full_name || 'Sem nome'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {user.email}
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>{getPlanBadge(user.plan_id)}</TableCell>
                                    <TableCell>
                                        {user.onboarding_completed ? (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                Completo
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                                                Pendente
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm">
                                            {user.usage_current_month || 0}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(user.created_at || '').toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/users/${user.id}`}>Ver detalhes</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Bloquear</DropdownMenuItem>
                                                <DropdownMenuItem>Override plano</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
