import Sidebar from './Sidebar'
import Modal from '../ui/Modal'

export default function MobileMenu({ open, onClose, collapsed, onToggleCollapsed }) {
  return (
    <Modal
      open={open}
      title="Menu"
      onClose={onClose}
      className="max-w-sm p-0 overflow-hidden"
      footer={null}
    >
      <div className="h-[75vh] overflow-auto">
        <div className="md:hidden">
          <Sidebar collapsed={collapsed} onToggle={onToggleCollapsed} />
        </div>
      </div>
    </Modal>
  )
}

