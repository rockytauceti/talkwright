import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import TalkEditor from './TalkEditor'

export default async function TalkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect('/sign-in')

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { clerkUserId } })
  if (!user) redirect('/sign-in')

  const talk = await prisma.talk.findFirst({
    where: { id, userId: user.id },
  })

  if (!talk) notFound()

  return (
    <TalkEditor
      initialTalk={{
        id: talk.id,
        title: talk.title,
        category: talk.category,
        status: talk.status,
        body: talk.body,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outline: talk.outline as any,
        wordCount: talk.wordCount,
        estimatedMinutes: talk.estimatedMinutes,
      }}
    />
  )
}
