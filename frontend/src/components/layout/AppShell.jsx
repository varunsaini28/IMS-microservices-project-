import { Outlet } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileMenu from './MobileMenu'
import SearchModal from './SearchModal'

export default function AppShell() {
  const online = useOnlineStatus()
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('ims.pref.sidebarCollapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useKeyboardShortcut('ctrl+k', () => setSearchOpen(true))
  useKeyboardShortcut('escape', () => {
    setSearchOpen(false)
    setMobileOpen(false)
  })

  const sidebar = useMemo(
    () => (
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          />
      </div>
    ),
    [setSidebarCollapsed, sidebarCollapsed]
  )

  return (
    <div className="h-screen  ml-[-11rem]">
      {!online ? (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black">
          You&apos;re offline. Showing cached data where available.
        </div>
      ) : null}

      <Navbar
        onOpenMobileMenu={() => setMobileOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className=" flex h-[calc(100%-3.5rem)]  ">
        {sidebar}
        <main className="flex-1 overflow-auto p-4 md:p-6 ">
          <Outlet />
        </main>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

