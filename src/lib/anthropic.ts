import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { AIInteractionType } from '@prisma/client'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const AI_MODEL = 'claude-3-5-haiku-20241022'

// Free tier: 5 AI interactions per month
export const FREE_MONTHLY_LIMIT = 5

export async function checkAndResetCredits(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  // Reset credits monthly
  const resetDate = new Date(user.aiCreditsReset)
  const now = new Date()
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  if (resetDate < monthAgo) {
    await prisma.user.update({
      where: { id: userId },
      data: { aiCreditsUsed: 0, aiCreditsReset: now },
    })
    return { used: 0, limit: FREE_MONTHLY_LIMIT, plan: user.plan }
  }

  return { used: user.aiCreditsUsed, limit: FREE_MONTHLY_LIMIT, plan: user.plan }
}

export async function trackAIInteraction({
  userId,
  talkId,
  type,
  promptTokens,
  completionTokens,
}: {
  userId: string
  talkId: string
  type: AIInteractionType
  promptTokens: number
  completionTokens: number
}) {
  await prisma.$transaction([
    prisma.aIInteraction.create({
      data: {
        userId,
        talkId,
        type,
        promptTokens,
        completionTokens,
        creditCounted: true,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { aiCreditsUsed: { increment: 1 } },
    }),
  ])
}

export const CATEGORY_PROMPTS: Record<string, string> = {
  lds_sacrament: 'a Latter-day Saint sacrament meeting talk for an adult congregation',
  lds_primary: 'a Latter-day Saint Primary talk for children ages 3-12',
  lds_funeral: 'a Latter-day Saint funeral or memorial talk',
  lds_conference: 'a Latter-day Saint general conference-style talk',
  christian_sermon: 'a Christian sermon for a church congregation',
  wedding_toast: 'a wedding toast or speech',
  eulogy: 'a secular eulogy or memorial speech',
  graduation: 'a graduation commencement speech',
  ted_style: 'a TED-style talk with a single transformative idea',
  motivational: 'a motivational speech',
  other: 'a speech or talk',
}
