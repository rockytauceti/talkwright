import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return new Response('Missing email', { status: 400 })

    await prisma.earlyAccess.upsert({
      where: { email },
      update: {},
      create: { email },
    })

    return new Response('OK', { status: 200 })
  } catch {
    return new Response('Error', { status: 500 })
  }
}
