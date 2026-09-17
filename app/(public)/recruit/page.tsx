import type { Metadata } from 'next'
import { RecruitPage } from './RecruitPage'

export const metadata: Metadata = {
  title: 'Answer the Call | Blades Edge',
  description: 'Are you Blades Edge material? Take the oath quiz and find out.',
}

export default function RecruitRoute() {
  return <RecruitPage />
}
