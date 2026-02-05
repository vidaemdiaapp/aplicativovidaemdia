'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Edit } from 'lucide-react'
import { upsertTemplate, deleteTemplate } from '../actions'
import type { Database } from '@/types/database'

type Template = Database['public']['Tables']['notification_templates']['Row']

export default function TemplateList({ templates }: { templates: Template[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [key, setKey] = useState('')
    const [name, setName] = useState('')
    const [channel, setChannel] = useState('email')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [description, setDescription] = useState('')

    const resetForm = () => {
        setEditingTemplate(null)
        setKey('')
        setName('')
        setChannel('email')
        setSubject('')
        setBody('')
        setDescription('')
    }

    const openEdit = (tmpl: Template) => {
        setEditingTemplate(tmpl)
        setKey(tmpl.key)
        setName(tmpl.name)
        setChannel(tmpl.channel)
        setSubject(tmpl.subject || '')
        setBody(tmpl.body)
        setDescription(tmpl.description || '')
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!key || !name || !body) {
            toast.error('Preencha os campos obrigatórios')
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                id: editingTemplate?.id,
                key,
                name,
                channel,
                subject: subject || null,
                body,
                description: description || null
            }

            const result = await upsertTemplate(payload)
            if (result.error) {
                toast.error(`Erro: ${result.error}`)
            } else {
                toast.success('Template salvo com sucesso!')
                setIsDialogOpen(false)
                resetForm()
            }
        } catch (e) {
            toast.error('Erro ao salvar')
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este template?')) return

        try {
            const result = await deleteTemplate(id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Template removido')
            }
        } catch (e) {
            toast.error('Erro ao remover')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Templates de Mensagem</h2>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Template
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Chave (Key)</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {templates.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Nenhum template cadastrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        templates.map((tmpl) => (
                            <TableRow key={tmpl.id}>
                                <TableCell className="font-mono text-xs">{tmpl.key}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{tmpl.name}</div>
                                    <div className="text-xs text-muted-foreground">{tmpl.description}</div>
                                </TableCell>
                                <TableCell className="capitalize">{tmpl.channel}</TableCell>
                                <TableCell className="text-sm">{tmpl.subject || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(tmpl)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(tmpl.id)}>
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Chave Única (Key)*</Label>
                            <Input
                                value={key}
                                onChange={e => setKey(e.target.value)}
                                placeholder="ex: welcome_email"
                                disabled={!!editingTemplate} // Key should be immutable ideally or handle unique error
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nome Identificador*</Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="ex: Email de Boas-vindas"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Canal*</Label>
                            <Select value={channel} onValueChange={setChannel}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="push">Push Notification</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição (Opcional)</Label>
                            <Input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        {channel === 'email' && (
                            <div className="col-span-2 space-y-2">
                                <Label>Assunto (Subject)*</Label>
                                <Input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="col-span-2 space-y-2">
                            <Label>Corpo da Mensagem (Body)*</Label>
                            <Textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                className="h-40 font-mono text-sm"
                                placeholder="Olá {{name}}, ..."
                            />
                            <p className="text-xs text-muted-foreground">Suporta variáveis {'{{variable}}'} e Markdown básico.</p>
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
        </div>
    )
}
