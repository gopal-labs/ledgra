import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { dashboardApi } from '../api'

/* ============================================================
   INLINE ICONS
   ============================================================ */
const Icon = ({ name, size = 20 }) => {
  const paths = {
    box: <><path d="M12 2l9 4.9V17L12 22l-9-5.1V7z"/><polyline points="12 22 12 12"/><line x1="21" y1="7" x2="12" y2="12"/><line x1="3" y1="7" x2="12" y2="12"/></>,
    alertTriangle: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    truck: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    arrowsRightLeft: <><path d="M7.5 3 3 7.5l4.5 4.5"/><path d="M3 7.5h18"/><path d="m16.5 21 4.5-4.5-4.5-4.5"/><path d="M21 16.5H3"/></>,
    xCircle: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    refreshCw: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name]}
    </svg>
  )
}

/* ============================================================
   KPI CARD
   ============================================================ */
const KpiCard = ({ label, value, icon, iconBg, iconColor, badge, sublabel, to, loading }) => {
  const navigate = useNavigate()

  return (
    <div
      className="kpi-card"
      onClick={() => to && navigate(to)}
      style={{ cursor: to ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div className="kpi-icon" style={{ background: iconBg }}>
          <span style={{ color: iconColor }}><Icon name={icon} size={18} /></span>
        </div>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px',
            borderRadius: 999, background: badge.bg, color: badge.color,
            border: `1px solid ${badge.border}`,
          }}>
            {badge.label}
          </span>
        )}
      </div>
      {loading ? (
        <div style={{ height: 36, display: 'flex', alignItems: 'center' }}>
          <span className="spinner spinner-dark" />
        </div>
      ) : (
        <div className="kpi-value" style={{ marginTop: 14 }}>{value ?? '—'}</div>
      )}
      <div className="kpi-label">{label}</div>
      {sublabel && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sublabel}</div>
      )}
    </div>
  )
}

/* ============================================================
   SUMMARY CARD (Receipt / Delivery)
   ============================================================ */
const SummaryCard = ({ title, icon, iconColor, rows, loading }) => (
  <div className="ledgra-card" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '16px 20px',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ color: iconColor }}><Icon name={icon} size={18} /></span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
    </div>
    <div style={{ padding: '8px 0' }}>
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <span className="spinner spinner-dark" />
        </div>
      ) : rows.map((row, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: row.color || 'var(--text-primary)', lineHeight: 1 }}>
              {row.value ?? '—'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{row.label}</div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            <Icon name="chevronRight" size={16} />
          </span>
        </div>
      ))}
    </div>
  </div>
)

/* ============================================================
   FILTER BAR
   ============================================================ */
const FILTER_TYPES = ['All', 'Receipt', 'Delivery', 'Internal Transfer', 'Adjustment']
const FILTER_STATUSES = ['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Cancelled']

const FilterBar = ({ filters, setFilters, onRefresh }) => (
  <div className="filter-bar">
    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
      <Icon name="filter" size={14} />
    </span>

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
      {/* Type chips */}
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Type:</span>
      {FILTER_TYPES.map((t) => (
        <button
          key={t}
          className={`filter-chip ${filters.type === t ? 'active' : ''}`}
          onClick={() => setFilters((f) => ({ ...f, type: t }))}
        >
          {t}
        </button>
      ))}

      <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px' }} />

      {/* Status select */}
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
      <select
        className="filter-select"
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        id="dashboard-status-filter"
      >
        {FILTER_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Warehouse */}
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Warehouse:</span>
      <select
        className="filter-select"
        value={filters.warehouse}
        onChange={(e) => setFilters((f) => ({ ...f, warehouse: e.target.value }))}
        id="dashboard-warehouse-filter"
      >
        <option value="">All</option>
        <option value="Main Warehouse">Main Warehouse</option>
      </select>
    </div>

    {/* Refresh */}
    <button
      className="theme-toggle"
      onClick={onRefresh}
      title="Refresh dashboard"
      id="dashboard-refresh-btn"
    >
      <Icon name="refreshCw" size={14} />
    </button>
  </div>
)

/* ============================================================
   DASHBOARD PAGE
   ============================================================ */
const DashboardPage = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: 'All', status: 'All', warehouse: '', category: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.type !== 'All') params.type = filters.type
      if (filters.status !== 'All') params.status = filters.status
      if (filters.warehouse) params.warehouse = filters.warehouse
      if (filters.category) params.category = filters.category
      const res = await dashboardApi.getSummary(params)
      setData(res.data.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const p = data?.products || {}
  const r = data?.receipts || {}
  const d = data?.deliveries || {}
  const it = data?.internalTransfers || {}

  return (
    <AppLayout title="Dashboard">
      {/* Filter Bar */}
      <FilterBar filters={filters} setFilters={setFilters} onRefresh={fetchData} />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Products in Stock"
          value={p.totalInStock}
          icon="box"
          iconBg="rgba(96, 165, 250, 0.12)"
          iconColor="#60a5fa"
          sublabel={`${p.totalStockQty ?? 0} total units`}
          to="/products"
          loading={loading}
        />
        <KpiCard
          label="Low Stock Items"
          value={p.lowStock}
          icon="alertTriangle"
          iconBg="rgba(251, 191, 36, 0.12)"
          iconColor="#fbbf24"
          badge={p.lowStock > 0 ? { label: 'Attention', bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.2)' } : null}
          to="/products"
          loading={loading}
        />
        <KpiCard
          label="Out of Stock"
          value={p.outOfStock}
          icon="xCircle"
          iconBg="rgba(248, 113, 113, 0.12)"
          iconColor="#f87171"
          badge={p.outOfStock > 0 ? { label: 'Critical', bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)' } : null}
          to="/products"
          loading={loading}
        />
        <KpiCard
          label="Pending Receipts"
          value={r.pending}
          icon="inbox"
          iconBg="rgba(74, 222, 128, 0.12)"
          iconColor="#4ade80"
          to="/operations/receipts"
          loading={loading}
        />
        <KpiCard
          label="Pending Deliveries"
          value={d.pending}
          icon="truck"
          iconBg="rgba(232, 92, 92, 0.12)"
          iconColor="#e85c5c"
          to="/operations/delivery"
          loading={loading}
        />
        <KpiCard
          label="Internal Transfers Scheduled"
          value={it.scheduled}
          icon="arrowsRightLeft"
          iconBg="rgba(167, 139, 250, 0.12)"
          iconColor="#a78bfa"
          to="/operations/internal"
          loading={loading}
        />
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <SummaryCard
          title="Receipts"
          icon="inbox"
          iconColor="#4ade80"
          loading={loading}
          rows={[
            {
              value: r.toReceive ?? r.ready ?? 0,
              label: 'to receive',
              color: 'var(--text-primary)',
            },
            {
              value: r.total ?? 0,
              label: 'operations',
              color: 'var(--text-secondary)',
            },
          ]}
        />
        <SummaryCard
          title="Deliveries"
          icon="truck"
          iconColor="#e85c5c"
          loading={loading}
          rows={[
            { value: d.late ?? 0, label: 'Late', color: '#f87171' },
            { value: d.waiting ?? 0, label: 'Waiting', color: '#fbbf24' },
            { value: d.total ?? 0, label: 'operations' },
          ]}
        />
      </div>
    </AppLayout>
  )
}

export default DashboardPage
