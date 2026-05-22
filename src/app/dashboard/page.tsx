import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <div className="max-w-xs">
        <h1 className="text-xl font-bold text-[#1E1E1E] mb-2">What will you write today?</h1>
        <p className="text-[#1E1E1E]/40 text-sm mb-8 leading-relaxed">
          Pick a talk from the sidebar, or start a new one.
        </p>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors"
        >
          <span className="text-base leading-none font-light">+</span>
          New talk
        </Link>
      </div>
    </div>
  )
}