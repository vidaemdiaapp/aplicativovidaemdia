'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'

const breadcrumbNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'Usuários',
    plans: 'Planos',
    subscriptions: 'Assinaturas',
    billing: 'Financeiro',
    invoices: 'Faturas',
    transactions: 'Transações',
    reports: 'Relatórios',
    refunds: 'Reembolsos',
    agenda: 'Agenda',
    events: 'Eventos',
    reminders: 'Lembretes',
    messaging: 'Mensagens',
    templates: 'Templates',
    logs: 'Logs',
    campaigns: 'Campanhas',
    integrations: 'Integrações',
    ops: 'Operações',
    jobs: 'Jobs',
    webhooks: 'Webhooks',
    health: 'Health',
    compliance: 'Compliance',
    audit: 'Auditoria',
    requests: 'Solicitações',
}

export function Breadcrumbs() {
    const pathname = usePathname()
    const pathSegments = pathname.split('/').filter(Boolean)

    // Don't show breadcrumbs on dashboard
    if (pathname === '/dashboard') {
        return null
    }

    return (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>

            {pathSegments.map((segment, index) => {
                // Skip UUIDs in breadcrumbs
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    segment
                )

                const href = '/' + pathSegments.slice(0, index + 1).join('/')
                const isLast = index === pathSegments.length - 1
                const name = isUuid ? 'Detalhes' : breadcrumbNameMap[segment] || segment

                return (
                    <Fragment key={segment}>
                        <ChevronRight className="h-4 w-4" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{name}</span>
                        ) : (
                            <Link href={href} className="hover:text-foreground transition-colors">
                                {name}
                            </Link>
                        )}
                    </Fragment>
                )
            })}
        </nav>
    )
}
