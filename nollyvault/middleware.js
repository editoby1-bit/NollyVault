// Middleware disabled until Supabase env vars are configured.
// The app runs in demo mode without it.
import { NextResponse } from 'next/server'

export async function middleware(req) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
