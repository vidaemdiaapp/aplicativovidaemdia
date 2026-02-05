'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Receipt,
    Calendar,
    MessageSquare,
    Settings,
    Activity,
    ShieldCheck,
    UserMinus,
    Zap,
    Flag,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Planos', href: '/plans', icon: Zap },
    { name: 'Features', href: '/features', icon: Flag },
    { name: 'Assinaturas', href: '/subscriptions', icon: CreditCard },
    { name: 'Financeiro', href: '/billing', icon: Receipt },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Mensagens', href: '/messaging', icon: MessageSquare },
    { name: 'Integrações', href: '/integrations', icon: Settings },
    { name: 'Operações', href: '/ops', icon: Activity },
    { name: 'Audit Logs', href: '/compliance/audit', icon: ShieldCheck },
    { name: 'LGPD', href: '/compliance/requests', icon: UserMinus },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'flex flex-col border-r bg-card transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                            V
                        </div>
                        <span className="font-semibold text-lg">Vida em Dia</span>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(collapsed && 'mx-auto')}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-2">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                {!collapsed && (
                    <p className="text-xs text-muted-foreground text-center">
                        Admin Panel v1.0
                    </p>
                )}
            </div>
        </aside>
    )
}
