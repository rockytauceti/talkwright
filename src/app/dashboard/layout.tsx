import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <header className="bg-[#f7f6f2] border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo size={24} theme="light" />
          <span className="font-semibold text-stone-900 tracking-tight">TalkWright</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/new"
            className="bg-stone-900 hover:bg-stone-800 text-stone-100 text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
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
