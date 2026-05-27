import { NavBar } from '@/components/layout/NavBar'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="flex-1 w-full">
        {children}
      </main>
    </>
  )
}
