import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard/requests')
  return null
}
