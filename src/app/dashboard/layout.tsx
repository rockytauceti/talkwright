import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E8F1F2] flex">
      <Sidebar />
      {/* Mobile header — visible only on small screens */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-10 bg-[#E8F1F2] border-b border-[#3C3E3A]/10 px-5 py-4 flex items-center justify-between">
        <span className="font-bold text-[#1E1E1E] text-sm tracking-tight">TalkWright</span>
        <a href="/dashboard/new" className="text-sm text-[#7776BC] font-semibold">+ New</a>
      </div>
      <main className="flex-1 min-w-0 overflow-auto sm:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}