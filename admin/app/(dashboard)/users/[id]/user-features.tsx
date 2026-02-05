'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, Trash2, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { upsertEntitlementOverride, deleteEntitlementOverride } from '../actions'

type Override = {
    id: string
    feature_key: string | null
    enabled: boolean
    expires_at: string | null
    reason: string
    created_at: string
    key?: string // Joined feature name if available
}

type Feature = {
    key: string
    name: string
}

interface UserFeaturesProps {
    userId: string
    overrides: Override[]
    availableFeatures: Feature[]
}

export default function UserFeatures({ userId, overrides, availableFeatures }: UserFeaturesProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingOverride, setEditingOverride] = useState<Override | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [selectedFeature, setSelectedFeature] = useState('')
    const [isEnabled, setIsEnabled] = useState(true)
    const [reason, setReason] = useState('')
    const [expiresAt, setExpiresAt] = useState('')

    const resetForm = () => {
        setEditingOverride(null)
        setSelectedFeature('')
        setIsEnabled(true)
        setReason('')
        setExpiresAt('')
    }

    const openEdit = (ov: Override) => {
        setEditingOverride(ov)
        setSelectedFeature(ov.feature_key || '')
        setIsEnabled(ov.enabled)
        setReason(ov.reason || '')
        setExpiresAt(ov.expires_at ? new Date(ov.expires_at).toISOString().split('T')[0] : '')
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selectedFeature || !reason) {
            toast.error('Feature e Motivo são obrigatórios')
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                id: editingOverride?.id, // undefined creates new
                user_id: userId,
                feature_key: selectedFeature,
                enabled: isEnabled,
                reason,
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
            }

            const result = await upsertEntitlementOverride(payload)
            if (result.error) {
                toast.error(`Erro: ${result.error}`)
            } else {
                toast.success('Exceção salva com sucesso!')
                setIsDialogOpen(false)
                resetForm()
            }
        } catch (e) {
            toast.error('Erro ao salvar')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta exceção?')) return

        try {
            const result = await deleteEntitlementOverride(id, userId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Exceção removida')
            }
        } catch (e) {
            toast.error('Erro ao remover')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Exceções de Features (Overrides)</CardTitle>
                    <CardDescription>
                        Permite habilitar/desabilitar features específicas para este usuário, independente do plano.
                    </CardDescription>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Exceção
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Feature</TableHead>
                            <TableHead>Estado Forçado</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {overrides.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                    Nenhuma exceção configurada. O usuário segue as regras do plano.
                                </TableCell>
                            </TableRow>
                        ) : (
                            overrides.map((ov) => (
                                <TableRow key={ov.id}>
                                    <TableCell className="font-medium">
                                        {availableFeatures.find(f => f.key === ov.feature_key)?.name || ov.feature_key}
                                        <div className="text-xs text-muted-foreground font-mono">{ov.feature_key}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ov.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {ov.enabled ? 'Habilitado' : 'Desabilitado'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{ov.reason}</TableCell>
                                    <TableCell>
                                        {ov.expires_at ? format(new Date(ov.expires_at), 'dd/MM/yyyy') : 'Permanente'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(ov)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(ov.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingOverride ? 'Editar Exceção' : 'Nova Exceção'}</DialogTitle>
                            <DialogDescription>
                                Sobrepõe a configuração do plano para uma feature específica.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Feature</Label>
                                <Select
                                    value={selectedFeature}
                                    onValueChange={setSelectedFeature}
                                    disabled={!!editingOverride} // Prevent changing feature on edit
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a feature" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableFeatures.map(f => (
                                            <SelectItem key={f.key} value={f.key}>
                                                {f.name} ({f.key})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between space-y-2 border p-3 rounded-md">
                                <Label htmlFor="enabled-switch">Habilitado?</Label>
                                <Switch
                                    id="enabled-switch"
                                    checked={isEnabled}
                                    onCheckedChange={setIsEnabled}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Motivo (Obrigatório)</Label>
                                <Input
                                    placeholder="Ex: Beta tester, cortesia, suporte..."
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Validade (Opcional)</Label>
                                <Input
                                    type="date"
                                    value={expiresAt}
                                    onChange={e => setExpiresAt(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Deixe em branco para permanente.</p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
