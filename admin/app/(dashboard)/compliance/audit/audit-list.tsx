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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, ShieldAlert } from 'lucide-react'
import { format } from 'date-fns'
import { seedAuditLogs } from '../actions'
import { toast } from 'sonner'

export function AuditList({ logs = [] }: { logs: any[] }) {
    const [selectedLog, setSelectedLog] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const handleSeed = async () => {
        setLoading(true)
        try {
            await seedAuditLogs()
            toast.success('Logs gerados com sucesso')
        } catch (e) {
            console.error(e)
            toast.error('Erro ao gerar logs')
        }
        setLoading(false)
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                <ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    O sistema de auditoria registra ações administrativas críticas.
                </p>
                <Button onClick={handleSeed} disabled={loading}>
                    {loading ? 'Gerando...' : 'Gerar Logs de Teste'}
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Entidade</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead className="w-[100px]">Detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{log.action}</Badge>
                                </TableCell>
                                <TableCell>
                                    {log.entity_type} <span className="text-xs text-muted-foreground">({log.entity_id?.substring(0, 8)})</span>
                                </TableCell>
                                <TableCell>
                                    {log.admin_id || 'System'}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
                        <DialogDescription>
                            ID: {selectedLog?.id} | Data: {selectedLog && format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="border rounded-md p-3 bg-muted/30">
                            <h4 className="font-semibold mb-2 text-xs uppercase text-muted-foreground flex items-center justify-between">
                                Antes (Before)
                                <span className="text-[10px] bg-background px-1 border rounded">JSON</span>
                            </h4>
                            <pre className="text-xs overflow-auto max-h-[400px] font-mono whitespace-pre-wrap">
                                {selectedLog?.before ? JSON.stringify(selectedLog.before, null, 2) : <span className="text-muted-foreground italic">Nenhum dado anterior</span>}
                            </pre>
                        </div>
                        <div className="border rounded-md p-3 bg-muted/30">
                            <h4 className="font-semibold mb-2 text-xs uppercase text-muted-foreground flex items-center justify-between">
                                Depois (After)
                                <span className="text-[10px] bg-background px-1 border rounded">JSON</span>
                            </h4>
                            <pre className="text-xs overflow-auto max-h-[400px] font-mono whitespace-pre-wrap">
                                {selectedLog?.after ? JSON.stringify(selectedLog.after, null, 2) : <span className="text-muted-foreground italic">Nenhum dado posterior</span>}
                            </pre>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
