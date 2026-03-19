import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'

export default function NotFound() {
  return (
    <Card className="max-w-xl">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link className="mt-4 inline-block text-sm font-medium text-violet-600 hover:underline" to="/">
        Go home
      </Link>
    </Card>
  )
}

