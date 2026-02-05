'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface AgendaLayoutProps {
    children: React.ReactNode
}

export default function AgendaLayout({ children }: AgendaLayoutProps) {
    const pathname = usePathname()

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 pl-4">
                        <Link
                            href="/agenda/events"
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                pathname.includes('/events')
                                    ? "bg-muted hover:bg-muted"
                                    : "hover:bg-transparent hover:underline",
                                "justify-start"
                            )}
                        >
                            Eventos
                        </Link>
                        <Link
                            href="/agenda/reminders"
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                pathname.includes('/reminders')
                                    ? "bg-muted hover:bg-muted"
                                    : "hover:bg-transparent hover:underline",
                                "justify-start"
                            )}
                        >
                            Fila de Lembretes
                        </Link>
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-5xl">{children}</div>
            </div>
        </div>
    )
}
