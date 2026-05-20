import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold text-zinc-900 tracking-tight">
          ✦ TalkWright
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/new"
            className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            + New talk
          </Link>
          <UserButton />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-10">{children}</div>
    </div>
  )
}
