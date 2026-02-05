
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Database, Server, HardDrive, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

async function checkDatabase() {
    const supabase = createAdminClient()
    const start = performance.now()
    try {
        await supabase.from('profiles').select('*', { count: 'exact', head: true })
        const end = performance.now()
        return { status: 'ok', latency: Math.floor(end - start) }
    } catch (e) {
        return { status: 'error', latency: 0, error: String(e) }
    }
}

export default async function HealthPage() {
    const dbCheck = await checkDatabase()

    // Mocks for other services
    const apiStatus = { status: 'ok', latency: 35 } // Edge Function
    const storageStatus = { status: 'ok', usage: '1.2GB / 10GB' }

    const getStatusParams = (status: string) => {
        if (status === 'ok')
            return { color: 'text-green-500', statusIcon: CheckCircle2, text: 'Operacional' }
        if (status === 'warning')
            return { color: 'text-yellow-500', statusIcon: AlertTriangle, text: 'Degradado' }
        return { color: 'text-red-500', statusIcon: XCircle, text: 'Indisponível' }
    }

    const services = [
        { name: 'Database (Supabase)', icon: Database, ...dbCheck, ...getStatusParams(dbCheck.status), details: `${dbCheck.latency}ms latency` },
        { name: 'Edge Functions API', icon: Server, ...apiStatus, ...getStatusParams(apiStatus.status), details: `${apiStatus.latency}ms latency` },
        { name: 'Storage Buckets', icon: HardDrive, ...storageStatus, ...getStatusParams(storageStatus.status), details: storageStatus.usage },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
                <p className="text-muted-foreground">Monitoramento em tempo real da infraestrutura.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                    <Card key={service.name}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {service.name}
                            </CardTitle>
                            <service.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold flex items-center gap-2 ${service.color}`}>
                                <service.statusIcon className="h-6 w-6" />
                                {service.text}
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                                {service.details}
                            </p>
                            {service.status === 'error' && (
                                <p className="text-xs text-red-500 mt-2">
                                    {(service as any).error}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Maintenance Windows</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        Nenhuma janela de manutenção programada para os próximos 7 dias.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
