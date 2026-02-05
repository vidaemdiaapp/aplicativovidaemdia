import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Rotas públicas
    const publicPaths = ['/login', '/forgot-password']
    const isPublicPath = publicPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    )

    if (!user && !isPublicPath) {
        // Não autenticado e tentando acessar rota protegida
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    if (user && isPublicPath) {
        // Autenticado e tentando acessar rota pública (login)
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Se autenticado, verificar se é admin
    if (user && !isPublicPath) {
        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('id, is_active')
            .eq('id', user.id)
            .single() as { data: { id: string; is_active: boolean } | null }

        if (!adminUser || !adminUser.is_active) {
            // Usuário não é admin ou está inativo
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', 'unauthorized')
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
