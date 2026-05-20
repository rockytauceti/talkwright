import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return new Response('Missing email', { status: 400 })

    await supabaseAdmin
      .from('early_access')
      .upsert({ email }, { onConflict: 'email' })

    return new Response('OK', { status: 200 })
  } catch {
    return new Response('Error', { status: 500 })
  }
}
