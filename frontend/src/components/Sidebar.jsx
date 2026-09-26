import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// Icons (inline SVG for zero dependencies)
const Icon = ({ name, size = 16 }) => {
  const icons = {
    dashboard: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
    package: <><path d="M12 2l9 4.9V17L12 22l-9-5.1V7z"/><polyline points="12 22 12 12"/><line x1="21" y1="7" x2="12" y2="12"/><line x1="3" y1="7" x2="12" y2="12"/></>,
    truck: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    arrowsRightLeft: <><path d="M7.5 3 3 7.5l4.5 4.5"/><path d="M3 7.5h18"/><path d="m16.5 21 4.5-4.5-4.5-4.5"/><path d="M21 16.5H3"/></>,
    clipboardList: <><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></>,
    history: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    warehouse: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
  }

  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {icons[name]}
    </svg>
  )
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  {
    label: 'Operations',
    icon: 'arrowsRightLeft',
    children: [
      { label: 'Receipts', path: '/operations/receipts', icon: 'inbox' },
      { label: 'Delivery', path: '/operations/delivery', icon: 'truck' },
      { label: 'Internal Transfers', path: '/operations/internal', icon: 'arrowsRightLeft' },
      { label: 'Adjustments', path: '/operations/adjustments', icon: 'clipboardList' },
    ],
  },
  { label: 'Products', path: '/products', icon: 'package' },
  { label: 'Move History', path: '/history', icon: 'history' },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      { label: 'Warehouse', path: '/settings/warehouse', icon: 'warehouse' },
      { label: 'Locations', path: '/settings/locations', icon: 'mapPin' },
    ],
  },
]

const LedgraLogo = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path d="M4 4h6v24H4V4zm8 0h16v6H12V4zm0 9h14v6H12v-6zm0 9h16v6H12v-6z" fill="white"/>
  </svg>
)

const Sidebar = () => {
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState({ Operations: true, Settings: false })

  const toggleGroup = (label) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  const isChildActive = (children) =>
    children?.some((c) => location.pathname.startsWith(c.path))

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <LedgraLogo />
        </div>
        <span className="sidebar-logo-text">Ledgra</span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 16 }}>
        <div className="nav-section-label">Main</div>

        {NAV_ITEMS.map((item) => {
          if (!item.children) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon" style={{ color: 'inherit' }}>
                  <Icon name={item.icon} size={16} />
                </span>
                {item.label}
              </NavLink>
            )
          }

          const isOpen = openGroups[item.label]
          const childActive = isChildActive(item.children)

          return (
            <div key={item.label}>
              <button
                className={`nav-item ${childActive ? 'active' : ''}`}
                onClick={() => toggleGroup(item.label)}
              >
                <span className="nav-icon" style={{ color: 'inherit' }}>
                  <Icon name={item.icon} size={16} />
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <Icon name="chevronDown" size={14} />
                </span>
              </button>

              {isOpen && (
                <div style={{ marginTop: 2 }}>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) =>
                        `nav-item nav-item-sub ${isActive ? 'active' : ''}`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom version tag */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        Ledgra v1.0.0
      </div>
    </aside>
  )
}

export default Sidebar
