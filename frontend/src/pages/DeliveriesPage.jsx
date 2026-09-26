import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { deliveryApi } from '../api'

/* ─── Icons ─────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const PlusIco = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const SearchIco = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const ListIco = () => <Ico d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />
const KanbanIco = () => <Ico d={<><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/></>} />
const TruckIco = ({ size = 36 }) => <Ico size={size} d={<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>} />

const STATUS_ORDER = ['Draft', 'Waiting', 'Ready', 'Done', 'Cancelled']

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_BADGES = {
  Draft: { variant: 'neutral', label: 'Draft' },
  Waiting: { variant: 'warning', label: 'Waiting Stock' },
  Ready: { variant: 'info', label: 'Ready' },
  Done: { variant: 'success', label: 'Done' },
  Cancelled: { variant: 'danger', label: 'Cancelled' },
}

const STATUS_COLORS = {
  Draft: 'var(--text-muted)',
  Waiting: '#f59e0b',
  Ready: '#60a5fa',
  Done: '#4ade80',
  Cancelled: '#f87171',
}

/* ─── Kanban Card ─────────────────────────── */
const KanbanCard = ({ delivery, onClick }) => (
  <div
    className="ledgra-card ledgra-card-clickable"
    style={{ padding: 14, cursor: 'pointer', marginBottom: 10 }}
    onClick={() => onClick(delivery)}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
        {delivery.reference}
      </span>
      <Badge variant={STATUS_BADGES[delivery.status]?.variant || 'neutral'} size="sm">
        {delivery.status}
      </Badge>
    </div>
    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{delivery.deliveryTo || '—'}</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
      <span>{delivery.lineItems?.length || 0} item{delivery.lineItems?.length !== 1 ? 's' : ''}</span>
      <span>{formatDate(delivery.scheduleDate)}</span>
    </div>
  </div>
)

/* ─── Main Deliveries Page ─────────────── */
const DeliveriesPage = () => {
  const navigate = useNavigate()
  const [deliveries, setDeliveries] = useState([])
  const [stats, setStats] = useState({ Draft: 0, Waiting: 0, Ready: 0, Done: 0, Cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState('list') // 'list' | 'kanban'

  const fetchDeliveries = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const r = await deliveryApi.getAll(params)
      setDeliveries(r.data.data)
      if (r.data.stats) setStats(r.data.stats)
    } catch {
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const openDetail = (delivery) => navigate(`/operations/delivery/${delivery._id}`)

  // Kanban grouping
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = deliveries.filter(d => d.status === s)
    return acc
  }, {})

  return (
    <AppLayout title="Delivery Orders">
      {/* ─── Header bar ───────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="primary" onClick={() => navigate('/operations/delivery/new')} icon={<PlusIco />}>
            New Delivery
          </Button>

          <div style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 3 }}>
            <button
              onClick={() => setView('list')}
              style={{
                background: view === 'list' ? 'var(--accent)' : 'transparent',
                color: view === 'list' ? '#fff' : 'var(--text-muted)',
                border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
              }}>
              <ListIco /> List
            </button>
            <button
              onClick={() => setView('kanban')}
              style={{
                background: view === 'kanban' ? 'var(--accent)' : 'transparent',
                color: view === 'kanban' ? '#fff' : 'var(--text-muted)',
                border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
              }}>
              <KanbanIco /> Kanban
            </button>
          </div>
        </div>

        {/* Right side: search & filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showSearch ? (
            <input
              type="text"
              placeholder="Search reference or customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ledgra-input"
              style={{ width: 220, padding: '6px 12px', fontSize: 13 }}
              autoFocus
              onBlur={() => !search && setShowSearch(false)}
            />
          ) : (
            <button
              className="ledgra-icon-btn"
              onClick={() => setShowSearch(true)}
              title="Search deliveries"
              style={{ padding: 8, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', cursor: 'pointer' }}>
              <SearchIco />
            </button>
          )}

          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: 3, borderRadius: 10 }}>
            <button
              onClick={() => setStatusFilter('')}
              style={{
                border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                background: statusFilter === '' ? 'var(--accent)' : 'transparent',
                color: statusFilter === '' ? '#fff' : 'var(--text-muted)',
              }}>
              All ({deliveries.length})
            </button>
            {STATUS_ORDER.map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
                style={{
                  border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                  background: statusFilter === st ? STATUS_COLORS[st] : 'transparent',
                  color: statusFilter === st ? '#111' : 'var(--text-muted)',
                  fontWeight: statusFilter === st ? 600 : 400,
                }}>
                {st} {stats[st] !== undefined ? `(${stats[st]})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading delivery orders...</div>
      ) : deliveries.length === 0 ? (
        <div className="ledgra-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}><TruckIco /></div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>No Delivery Orders Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>
            {statusFilter ? `No delivery orders matching status "${statusFilter}"` : 'Create your first outgoing delivery order to dispatch products.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/operations/delivery/new')} icon={<PlusIco />}>
            Create Delivery Order
          </Button>
        </div>
      ) : view === 'list' ? (
        /* ─── List View Table ─────────────────────────── */
        <div className="ledgra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ledgra-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Delivery To</th>
                <th>Source Location</th>
                <th>Schedule Date</th>
                <th>Items</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(del => {
                const badgeInfo = STATUS_BADGES[del.status] || { variant: 'neutral', label: del.status }
                return (
                  <tr
                    key={del._id}
                    onClick={() => openDetail(del)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                        {del.reference}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{del.deliveryTo || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {del.sourceLocation?.name || '—'} ({del.warehouse?.shortCode || 'WH'})
                    </td>
                    <td style={{ fontSize: 13 }}>{formatDate(del.scheduleDate)}</td>
                    <td>
                      <span style={{ background: 'var(--border-color)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                        {del.lineItems?.length || 0} line{del.lineItems?.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <Badge variant={badgeInfo.variant} size="sm">
                        {badgeInfo.label}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── Kanban Board View ──────────────────────── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {STATUS_ORDER.map(st => {
            const list = byStatus[st] || []
            return (
              <div key={st} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: STATUS_COLORS[st] }}>{st}</span>
                  <span style={{ background: 'var(--border-color)', borderRadius: 10, padding: '2px 8px', fontSize: 11, color: 'var(--text-muted)' }}>
                    {list.length}
                  </span>
                </div>
                {list.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>No orders</div>
                ) : (
                  list.map(del => (
                    <KanbanCard key={del._id} delivery={del} onClick={openDetail} />
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}

export default DeliveriesPage
