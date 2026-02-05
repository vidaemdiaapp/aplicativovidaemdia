'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { upsertPlan, upsertPlanFeatures } from '../actions'

type Plan = Database['public']['Tables']['subscription_plans']['Row']
type FeatureFlag = Database['public']['Tables']['feature_flags']['Row']
type PlanFeature = Database['public']['Tables']['plan_features']['Row']

interface PlanEditorProps {
    initialPlan: Plan | null
    featureFlags: FeatureFlag[]
    initialPlanFeatures: PlanFeature[]
    isNew: boolean
}

export default function PlanEditor({
    initialPlan,
    featureFlags,
    initialPlanFeatures,
    isNew,
}: PlanEditorProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Form State - Plan
    const [plan, setPlan] = useState<Partial<Plan>>(
        initialPlan || {
            id: '',
            name: '',
            description: '',
            price_monthly: 0,
            price_yearly: 0,
            is_active: false,
            trial_days: 7,
            grace_days: 3,
            billing_cycle: 'monthly',
            iugu_plan_id: '',
        }
    )

    // Form State - Features (Map by feature_key -> { enabled, limits })
    type FeatureState = { enabled: boolean; limits: string }
    const [features, setFeatures] = useState<Record<string, FeatureState>>(() => {
        const initialState: Record<string, FeatureState> = {}

        featureFlags.forEach(flag => {
            const existing = initialPlanFeatures.find(f => f.feature_key === flag.key)
            initialState[flag.key] = {
                enabled: existing?.enabled ?? flag.default_enabled ?? false,
                limits: existing?.limits ? JSON.stringify(existing.limits) : ''
            }
        })
        return initialState
    })

    const handleSave = async () => {
        if (!plan.id || !plan.name) {
            toast.error('ID e Nome são obrigatórios')
            return
        }

        setLoading(true)

        try {
            // 1. Save Plan
            const planResult = await upsertPlan(plan as any)
            if (planResult.error) {
                toast.error('Erro ao salvar plano: ' + planResult.error)
                setLoading(false)
                return
            }

            // 2. Save Features
            // Prepare plan_features array
            const featuresToSave: any[] = Object.entries(features).map(([key, state]) => {
                let parsedLimits = null
                try {
                    if (state.limits) parsedLimits = JSON.parse(state.limits)
                } catch {
                    console.warn(`Invalid JSON limits for ${key}`)
                }

                return {
                    plan_id: plan.id,
                    feature_key: key,
                    enabled: state.enabled,
                    limits: parsedLimits
                }
            })

            const featuresResult = await upsertPlanFeatures(plan.id!, featuresToSave)
            if (featuresResult.error) {
                toast.error('Plano salvo, mas erro nas features: ' + featuresResult.error)
            } else {
                toast.success('Plano salvo com sucesso!')
                if (isNew) {
                    router.push(`/plans/${plan.id}`)
                }
            }
        } catch (err) {
            toast.error('Erro inesperado')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/plans">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {isNew ? 'Novo Plano' : `Editar: ${plan.name}`}
                        </h2>
                        <p className="text-muted-foreground">
                            {isNew
                                ? 'Crie um novo plano de assinatura'
                                : `Gerencie as configurações do plano ${plan.id}`}
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="features">Features & Entitlements</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="id">ID do Plano (Slug)</Label>
                                    <Input
                                        id="id"
                                        value={plan.id || ''}
                                        onChange={(e) => setPlan({ ...plan, id: e.target.value })}
                                        disabled={!isNew}
                                        placeholder="ex: premium-monthly"
                                    />
                                    {!isNew && <p className="text-xs text-muted-foreground">O ID não pode ser alterado após criação.</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="iugu_id">Iugu Plan ID</Label>
                                    <Input
                                        id="iugu_id"
                                        value={plan.iugu_plan_id || ''}
                                        onChange={(e) => setPlan({ ...plan, iugu_plan_id: e.target.value })}
                                        placeholder="Identificador no Iugu"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Plano</Label>
                                <Input
                                    id="name"
                                    value={plan.name || ''}
                                    onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                                    placeholder="Ex: Vida em Dia Premium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc">Descrição</Label>
                                <Textarea
                                    id="desc"
                                    value={plan.description || ''}
                                    onChange={(e) => setPlan({ ...plan, description: e.target.value })}
                                    placeholder="Descrição curta para exibição no checkout"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price_monthly">Preço Mensal (centavos)</Label>
                                    <Input
                                        id="price_monthly"
                                        type="number"
                                        value={plan.price_monthly || 0}
                                        onChange={(e) => setPlan({ ...plan, price_monthly: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        R$ {(plan.price_monthly || 0) / 100}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price_yearly">Preço Anual (centavos)</Label>
                                    <Input
                                        id="price_yearly"
                                        type="number"
                                        value={plan.price_yearly || 0}
                                        onChange={(e) => setPlan({ ...plan, price_yearly: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        R$ {(plan.price_yearly || 0) / 100}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="active">Status</Label>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="active"
                                            checked={plan.is_active || false}
                                            onCheckedChange={(c) => setPlan({ ...plan, is_active: c })}
                                        />
                                        <Label htmlFor="active" className="cursor-pointer">
                                            {plan.is_active ? 'Ativo e visível' : 'Inativo (Rascunho)'}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Ciclo de Cobrança</Label>
                                    <Select
                                        value={plan.billing_cycle || 'monthly'}
                                        onValueChange={(v) => setPlan({ ...plan, billing_cycle: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trial">Dias de Trial</Label>
                                    <Input
                                        id="trial"
                                        type="number"
                                        value={plan.trial_days || 0}
                                        onChange={(e) => setPlan({ ...plan, trial_days: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="grace">Dias de Carência</Label>
                                    <Input
                                        id="grace"
                                        type="number"
                                        value={plan.grace_days || 0}
                                        onChange={(e) => setPlan({ ...plan, grace_days: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="w-1/3 font-medium text-sm text-muted-foreground">Feature</div>
                                    <div className="w-16 text-center font-medium text-sm text-muted-foreground">Ativo</div>
                                    <div className="flex-1 text-right font-medium text-sm text-muted-foreground pr-2">Limites (JSON opcional)</div>
                                </div>

                                {featureFlags.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhuma Feature Flag cadastrada. Vá em "Settings &gt; Features" para criar.
                                    </div>
                                )}

                                {featureFlags.map((flag) => {
                                    const state = features[flag.key] || { enabled: false, limits: '' }

                                    return (
                                        <div key={flag.key} className="flex items-center gap-4 py-4 border-b last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                                            <div className="w-1/3">
                                                <div className="font-medium">{flag.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{flag.key}</div>
                                            </div>

                                            <div className="w-16 flex justify-center">
                                                <Switch
                                                    checked={state.enabled}
                                                    onCheckedChange={(c) =>
                                                        setFeatures(prev => ({
                                                            ...prev,
                                                            [flag.key]: { ...prev[flag.key], enabled: c }
                                                        }))
                                                    }
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <Input
                                                    className="font-mono text-xs"
                                                    placeholder='{"max": 10}'
                                                    value={state.limits}
                                                    onChange={(e) =>
                                                        setFeatures(prev => ({
                                                            ...prev,
                                                            [flag.key]: { ...prev[flag.key], limits: e.target.value }
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
