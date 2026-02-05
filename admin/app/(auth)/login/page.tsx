'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const errorParam = searchParams.get('error')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError(signInError.message)
                setLoading(false)
                return
            }

            // Check if user is admin
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Falha ao obter dados do usuário')
                setLoading(false)
                return
            }

            const { data: adminUser } = await supabase
                .from('admin_users')
                .select('id, is_active')
                .eq('id', user.id)
                .single() as { data: { id: string; is_active: boolean } | null }

            if (!adminUser) {
                await supabase.auth.signOut()
                setError('Acesso não autorizado. Você não é um administrador.')
                setLoading(false)
                return
            }

            if (!adminUser.is_active) {
                await supabase.auth.signOut()
                setError('Sua conta de administrador está desativada.')
                setLoading(false)
                return
            }

            const redirectTo = searchParams.get('redirectTo') || '/dashboard'
            router.push(redirectTo)
        } catch {
            setError('Ocorreu um erro. Tente novamente.')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {(error || errorParam === 'unauthorized') && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {error || 'Você não tem permissão para acessar o painel.'}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="admin@vidaemdiaapp.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                    </>
                ) : (
                    'Entrar'
                )}
            </Button>
        </form>
    )
}

function LoginLoading() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="h-4 w-10 bg-muted/20 rounded animate-pulse" />
                <div className="h-10 w-full bg-muted/20 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-10 bg-muted/20 rounded animate-pulse" />
                <div className="h-10 w-full bg-muted/20 rounded animate-pulse" />
            </div>
            <div className="h-10 w-full bg-muted/20 rounded animate-pulse" />
        </div>
    )
}

export default function LoginPage() {
    return (
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-lg">
                        V
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Vida em Dia</CardTitle>
                <CardDescription>
                    Acesse o painel administrativo
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<LoginLoading />}>
                    <LoginForm />
                </Suspense>
            </CardContent>
        </Card>
    )
}
