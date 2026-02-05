'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface MessagingLayoutProps {
    children: React.ReactNode
}

export default function MessagingLayout({ children }: MessagingLayoutProps) {
    const pathname = usePathname()

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 pl-4">
                        <Link
                            href="/messaging/templates"
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                pathname.includes('/templates')
                                    ? "bg-muted hover:bg-muted"
                                    : "hover:bg-transparent hover:underline",
                                "justify-start"
                            )}
                        >
                            Templates
                        </Link>
                        <Link
                            href="/messaging/logs"
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                pathname.includes('/logs')
                                    ? "bg-muted hover:bg-muted"
                                    : "hover:bg-transparent hover:underline",
                                "justify-start"
                            )}
                        >
                            Logs de Disparo
                        </Link>
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-5xl">{children}</div>
            </div>
        </div>
    )
}
