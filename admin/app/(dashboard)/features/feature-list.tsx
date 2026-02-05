'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import { upsertFeatureFlag, deleteFeatureFlag } from './actions'

type FeatureFlag = Database['public']['Tables']['feature_flags']['Row']

interface FeatureListProps {
    features: FeatureFlag[]
}

export default function FeatureList({ features }: FeatureListProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editing, setEditing] = useState<FeatureFlag | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<FeatureFlag>>({
        key: '',
        name: '',
        description: '',
        default_enabled: false,
    })

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setEditing(null)
            setFormData({
                key: '',
                name: '',
                description: '',
                default_enabled: false,
            })
        }
    }

    const handleEdit = (feature: FeatureFlag) => {
        setEditing(feature)
        setFormData(feature)
        setOpen(true)
    }

    const handleSave = async () => {
        if (!formData.key || !formData.name) {
            toast.error('Key e Nome são obrigatórios')
            return
        }

        setLoading(true)
        try {
            const result = await upsertFeatureFlag(formData as any)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Feature salva com sucesso!')
                handleOpenChange(false)
            }
        } catch (err) {
            toast.error('Ocorreu um erro')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso pode quebrar funcionalidades dependentes desta flag.')) return

        try {
            const result = await deleteFeatureFlag(id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Feature removida')
            }
        } catch {
            toast.error('Erro ao deletar')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Feature
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Padrão</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhuma feature flag cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            features.map((feature) => (
                                <TableRow key={feature.id}>
                                    <TableCell className="font-mono text-xs">{feature.key}</TableCell>
                                    <TableCell className="font-medium">{feature.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{feature.description}</TableCell>
                                    <TableCell>
                                        {feature.default_enabled ? (
                                            <span className="text-green-600 text-xs font-semibold px-2 py-1 bg-green-100 rounded-full">ON</span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs font-semibold px-2 py-1 bg-muted rounded-full">OFF</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(feature)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(feature.id)}>
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
            </div>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Feature' : 'Nova Feature'}</DialogTitle>
                        <DialogDescription>
                            Feature flags controlam funcionalidades do sistema.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="key">Key (Identificador no código)</Label>
                            <Input
                                id="key"
                                value={formData.key || ''}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                placeholder="ex: whatsapp_reminders"
                                disabled={!!editing} // Keys shouldn't change ideally, or handle with care
                            />
                            {editing && <p className="text-xs text-muted-foreground">A chave não pode ser alterada.</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome (Legível)</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="ex: Lembretes via WhatsApp"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Descrição</Label>
                            <Textarea
                                id="desc"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="O que essa feature faz?"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="default"
                                checked={formData.default_enabled || false}
                                onCheckedChange={(c) => setFormData({ ...formData, default_enabled: c })}
                            />
                            <Label htmlFor="default">Habilitado por padrão</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
