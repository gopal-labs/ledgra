import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { receiptApi } from '../api'

/* ─── Icons ─────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const PlusIco = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const SearchIco = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const ListIco = () => <Ico d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />
const KanbanIco = () => <Ico d={<><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/></>} />
const InboxIco = ({ size = 36 }) => <Ico size={size} d={<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>} />

const STATUS_ORDER = ['Draft', 'Ready', 'Done', 'Cancelled']

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/* ─── Kanban Card ─────────────────────────── */
const KanbanCard = ({ receipt, onClick }) => (
  <div
    className="ledgra-card ledgra-card-clickable"
    style={{ padding: 14, cursor: 'pointer', marginBottom: 10 }}
    onClick={() => onClick(receipt)}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
        {receipt.reference}
      </span>
    </div>
    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{receipt.receiveFrom || '—'}</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
      <span>{receipt.lineItems?.length || 0} item{receipt.lineItems?.length !== 1 ? 's' : ''}</span>
      <span>{formatDate(receipt.scheduleDate)}</span>
    </div>
  </div>
)

/* ─── Main Receipts List Page ─────────────── */
const ReceiptsPage = () => {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState('list') // 'list' | 'kanban'

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const r = await receiptApi.getAll(params)
      setReceipts(r.data.data); setTotal(r.data.total)
    } catch { setReceipts([]) }
    finally { setLoading(false) }
  }, [search, statusFilter])

  useEffect(() => { fetchReceipts() }, [fetchReceipts])

  const openDetail = (receipt) => navigate(`/operations/receipts/${receipt._id}`)

  // Kanban columns
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = receipts.filter(r => r.status === s)
    return acc
  }, {})

  const STATUS_COLORS = {
    Draft: 'var(--text-muted)', Ready: '#60a5fa', Done: '#4ade80', Cancelled: '#f87171'
  }

  return (
    <AppLayout title="Receipts">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipts</h1>
          <p className="page-subtitle">{total} receipt operation{total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Search */}
          {showSearch && (
            <input
              className="ledgra-input"
              placeholder="Search reference or contact…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setShowSearch(false) }}
              autoFocus
              style={{ width: 240 }}
            />
          )}
          <button className="theme-toggle" onClick={() => setShowSearch(v => !v)} title="Search">
            <SearchIco />
          </button>

          {/* Status filter */}
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="receipt-status-filter">
            <option value="">All Status</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              style={{ padding: '7px 10px', background: view === 'list' ? 'var(--accent-light)' : 'var(--bg-elevated)', border: 'none', cursor: 'pointer', color: view === 'list' ? 'var(--accent)' : 'var(--text-muted)', display: 'flex' }}
              onClick={() => setView('list')} title="List view"
            ><ListIco /></button>
            <button
              style={{ padding: '7px 10px', background: view === 'kanban' ? 'var(--accent-light)' : 'var(--bg-elevated)', border: 'none', cursor: 'pointer', color: view === 'kanban' ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', borderLeft: '1px solid var(--border-default)' }}
              onClick={() => setView('kanban')} title="Kanban view"
            ><KanbanIco /></button>
          </div>

          <Button variant="primary" icon={<PlusIco />} onClick={() => navigate('/operations/receipts/new')} id="new-receipt-btn">
            New
          </Button>
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="ledgra-table-container">
          <table className="ledgra-table">
            <thead>
              <tr>
                <th>Reference</th><th>From</th><th>To</th><th>Responsible</th>
                <th>Schedule Date</th><th>Items</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  <span className="spinner spinner-dark" style={{ display: 'inline-block', marginRight: 8 }} />Loading…
                </td></tr>
              ) : receipts.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <InboxIco />
                    <span>No receipts found. <button onClick={() => navigate('/operations/receipts/new')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Create your first receipt</button></span>
                  </div>
                </td></tr>
              ) : (
                receipts.map(r => (
                  <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => openDetail(r)}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>{r.reference}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.receiveFrom || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.destinationLocation?.name || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.responsible?.loginId || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(r.scheduleDate)}</td>
                    <td style={{ fontSize: 13 }}>{r.lineItems?.length || 0}</td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
          {STATUS_ORDER.map(status => (
            <div key={status}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                paddingBottom: 10, borderBottom: `2px solid ${STATUS_COLORS[status]}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: STATUS_COLORS[status] }}>{status}</span>
                <span style={{ fontSize: 12, background: 'var(--bg-elevated)', padding: '1px 7px', borderRadius: 999, color: 'var(--text-muted)' }}>
                  {byStatus[status]?.length || 0}
                </span>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner spinner-dark" /></div>
              ) : byStatus[status]?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Empty</div>
              ) : (
                byStatus[status].map(receipt => (
                  <KanbanCard key={receipt._id} receipt={receipt} onClick={openDetail} />
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

export default ReceiptsPage
