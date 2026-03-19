import { cn } from '../../utils/helpers'

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

