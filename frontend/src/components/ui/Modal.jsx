import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/helpers'
import Button from './Button'

export default function Modal({ open, title, children, onClose, footer, className }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 "
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

