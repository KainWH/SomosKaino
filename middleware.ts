// middleware.ts — se ejecuta ANTES de renderizar cualquier página
// Su trabajo: revisar si hay sesión activa y redirigir si no

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener el usuario actual (no expira la sesión en este paso)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Si intenta entrar al dashboard sin sesión → redirigir a /login
  const publicPaths = ["/login", "/register", "/api"]
  const isPublic = publicPaths.some(p => path.startsWith(p)) || path === "/"
  const isProtected = !isPublic

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Si ya tiene sesión e intenta ir a /login o /register → al dashboard
  if ((path === "/login" || path === "/register") && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// Este matcher define en qué rutas se ejecuta el middleware
// Excluimos archivos estáticos y assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
