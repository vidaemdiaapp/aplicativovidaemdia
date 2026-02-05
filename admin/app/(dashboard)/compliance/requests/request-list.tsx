'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, CheckCircle, XCircle, UserMinus } from 'lucide-react'
import { format } from 'date-fns'
import { seedDeletionRequest, updateRequestStatus } from '../actions'
import { toast } from 'sonner'

export function RequestList({ requests = [], users = [] }: { requests: any[], users: any[] }) {
    const [loading, setLoading] = useState<string | null>(null) // ID being processed
    const [seeding, setSeeding] = useState(false)

    const handleSeed = async () => {
        setSeeding(true)
        try {
            await seedDeletionRequest()
            toast.success('Solicitação simulada criada')
        } catch (e) {
            console.error(e)
            toast.error('Erro ao criar solicitação (verifique se há usuários)')
        }
        setSeeding(false)
    }

    const handleStatus = async (id: string, status: 'completed' | 'rejected') => {
        setLoading(id)
        try {
            await updateRequestStatus(id, status)
            toast.success(`Status atualizado para ${status}`)
        } catch (e) {
            toast.error('Erro ao atualizar status')
        }
        setLoading(null)
    }

    const handleExport = () => {
        toast.info('Simulando exportação de dados (JSON)...')
        setTimeout(() => toast.success('Arquivo user_data_export.json baixado'), 1500)
    }

    const getUser = (userId: string) => users.find(u => u.id === userId)

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                <UserMinus className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sem solicitações pendentes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Nenhuma solicitação de exclusão de dados encontrada.
                </p>
                <Button onClick={handleSeed} disabled={seeding}>
                    {seeding ? 'Gerando...' : 'Simular Solicitação LGPD'}
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((req) => {
                        const user = getUser(req.user_id)
                        const isProcessing = loading === req.id
                        return (
                            <TableRow key={req.id}>
                                <TableCell>
                                    {format(new Date(req.requested_at), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user?.full_name || 'Usuário Desconhecido'}</span>
                                        <span className="text-xs text-muted-foreground">{user?.email || req.user_id}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={req.reason}>
                                    {req.reason}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        req.status === 'completed' ? 'default' :
                                            req.status === 'rejected' ? 'destructive' : 'secondary'
                                    } className={req.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="icon" onClick={handleExport} title="Export Data">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        {req.status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleStatus(req.id, 'completed')}
                                                    disabled={isProcessing}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleStatus(req.id, 'rejected')}
                                                    disabled={isProcessing}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
