import { prisma } from '@/lib/prisma'

export async function GET() {
  const count = await prisma.earlyAccess.count()
  return Response.json(
    { count },
    { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } }
  )
}
