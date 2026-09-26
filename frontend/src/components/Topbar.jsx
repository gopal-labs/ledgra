import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { stockApi, productApi, receiptApi, deliveryApi, transferApi } from '../api'

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const Topbar = ({ title }) => {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const [profileOpen, setProfileOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [lowStockItems, setLowStockItems] = useState([])

  // Global search state
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)

  const dropdownRef = useRef(null)
  const alertRef = useRef(null)
  const searchRef = useRef(null)

  // Fetch low stock items for topbar notification badge
  useEffect(() => {
    stockApi.getLowStock()
      .then(r => setLowStockItems(r.data.data || []))
      .catch(() => setLowStockItems([]))
  }, [])

  // Global search query
  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    const t = setTimeout(async () => {
      try {
        const [prods, recs, dels, trs] = await Promise.all([
          productApi.getAll({ search: globalSearch }).then(r => r.data.data || []),
          receiptApi.getAll({ search: globalSearch }).then(r => r.data.data || []),
          deliveryApi.getAll({ search: globalSearch }).then(r => r.data.data || []),
          transferApi.getAll({ search: globalSearch }).then(r => r.data.data || []),
        ])

        const combined = [
          ...prods.map(p => ({ type: 'Product', label: p.name, sub: `SKU: ${p.sku}`, link: `/products` })),
          ...recs.map(r => ({ type: 'Receipt', label: r.reference, sub: `From: ${r.receiveFrom || 'Vendor'}`, link: `/operations/receipts/${r._id}` })),
          ...dels.map(d => ({ type: 'Delivery', label: d.reference, sub: `To: ${d.deliveryTo || 'Customer'}`, link: `/operations/delivery/${d._id}` })),
          ...trs.map(t => ({ type: 'Transfer', label: t.reference, sub: `From: ${t.fromLocation?.name} → ${t.toLocation?.name}`, link: `/operations/internal/${t._id}` })),
        ]

        setSearchResults(combined)
        setSearchOpen(true)
      } catch {
        setSearchResults([])
      }
    }, 250)
    return () => clearTimeout(t)
  }, [globalSearch])

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false)
      if (alertRef.current && !alertRef.current.contains(e.target)) setAlertOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {title && <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>}
      </div>

      {/* Global Smart Search Bar */}
      <div style={{ position: 'relative', flex: 1, maxWidth: 360 }} ref={searchRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '5px 12px' }}>
          <span style={{ color: 'var(--text-muted)' }}><SearchIcon /></span>
          <input
            type="text"
            placeholder="Global search SKU or reference (e.g. WH/OUT/00001)..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: '100%' }}
          />
        </div>

        {/* Global Search Results Dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
            background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 10,
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)', marginTop: 6, maxHeight: 280, overflowY: 'auto',
          }}>
            {searchResults.map((res, i) => (
              <div
                key={i}
                onClick={() => { navigate(res.link); setSearchOpen(false); setGlobalSearch('') }}
                style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                className="ledgra-card-clickable">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{res.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{res.sub}</div>
                </div>
                <span style={{ background: 'var(--border-subtle)', padding: '2px 8px', borderRadius: 10, fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                  {res.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Low Stock Alert Bell Notification */}
        <div style={{ position: 'relative' }} ref={alertRef}>
          <button
            onClick={() => setAlertOpen(!alertOpen)}
            className="theme-toggle"
            title="Low Stock Alerts"
            style={{ position: 'relative' }}>
            <BellIcon />
            {lowStockItems.length > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%',
                background: '#f87171', color: '#fff', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {lowStockItems.length}
              </span>
            )}
          </button>

          {/* Low Stock Notification Popover */}
          {alertOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 9999, width: 290,
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)', marginTop: 8, padding: 14, color: 'var(--text-primary)'
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Low Stock Warnings</span>
                <span style={{ color: '#f87171', fontSize: 12 }}>{lowStockItems.length} Items</span>
              </div>
              {lowStockItems.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '14px 0' }}>
                  All products above reorder threshold.
                </div>
              ) : (
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {lowStockItems.map(item => (
                    <div
                      key={item._id}
                      onClick={() => { navigate('/products'); setAlertOpen(false) }}
                      style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>SKU: {item.sku}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#f87171', fontWeight: 600 }}>{item.onHand} {item.uom}</span>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Min: {item.reorderPoint}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Profile menu */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            id="profile-menu-btn"
            onClick={() => setProfileOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 10, padding: '6px 12px',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.loginId?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>
                {user?.loginId || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                {user?.role || 'Warehouse Staff'}
              </div>
            </div>
          </button>

          {profileOpen && (
            <div className="dropdown-menu">
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.loginId}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button
                className="dropdown-item"
                onClick={() => { navigate('/profile'); setProfileOpen(false) }}>
                <UserIcon /> My Profile
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={handleLogout}
                style={{ color: 'var(--danger)' }}>
                <LogoutIcon /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
