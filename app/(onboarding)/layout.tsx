import { NavBar } from '@/components/layout/NavBar'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  )
}
