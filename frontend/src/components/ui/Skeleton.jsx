import { cn } from '../../utils/helpers'

export default function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/70', className)}
    />
  )
}

