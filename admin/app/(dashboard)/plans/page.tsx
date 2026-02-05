
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Database } from '@/types/database'

type Plan = Database['public']['Tables']['subscription_plans']['Row']

async function getPlans() {
    const supabase = createAdminClient()
    const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true })

    if (error) {
        console.error('Error fetching plans:', error)
        return []
    }

    return plans as Plan[]
}

function formatCurrency(amount: number | null) {
    if (amount === null) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount / 100)
}

export default async function PlansPage() {
    const plans = await getPlans()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Planos</h2>
                    <p className="text-muted-foreground">
                        Gerencie os planos de assinatura disponíveis
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Plano
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">Listagem</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome (ID)</TableHead>
                                <TableHead>Mensal</TableHead>
                                <TableHead>Anual</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Iugu ID</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum plano cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>
                                            <div className="font-medium">{plan.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {plan.id}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(plan.price_monthly)}</TableCell>
                                        <TableCell>{formatCurrency(plan.price_yearly)}</TableCell>
                                        <TableCell>
                                            {plan.is_active ? (
                                                <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {plan.iugu_plan_id || '-'}
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
                                                        <Link href={`/plans/${plan.id}`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
