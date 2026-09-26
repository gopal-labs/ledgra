import React, { useState, useEffect, useCallback } from 'react'
import AppLayout from '../components/AppLayout'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { moveApi } from '../api'

/* ─── Icons ─────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const SearchIco = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const DownloadIco = () => <Ico d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />
const HistoryIco = ({ size = 36 }) => <Ico size={size} d={<><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></>} />

const MOVE_TYPES = ['Receipt', 'Delivery', 'Transfer', 'Adjustment']

const TYPE_BADGES = {
  Receipt: { variant: 'success', label: 'Receipt' },
  Delivery: { variant: 'info', label: 'Delivery' },
  Transfer: { variant: 'warning', label: 'Transfer' },
  Adjustment: { variant: 'neutral', label: 'Adjustment' },
}

const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const MoveHistoryPage = () => {
  const [moves, setMoves] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')

  const fetchMoves = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (typeFilter) params.moveType = typeFilter
      const r = await moveApi.getAll(params)
      setMoves(r.data.data || [])
    } catch {
      setMoves([])
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    fetchMoves()
  }, [fetchMoves])

  // Export Stock Ledger to CSV
  const exportToCSV = () => {
    if (moves.length === 0) return
    const headers = ['Reference,Move Type,Product,SKU,From Location,To Location,Quantity,Responsible,Date\n']
    const rows = moves.map(m => [
      `"${m.reference}"`,
      `"${m.moveType}"`,
      `"${m.product?.name || ''}"`,
      `"${m.product?.sku || ''}"`,
      `"${m.fromLocation?.name || '—'}"`,
      `"${m.toLocation?.name || '—'}"`,
      `"${m.quantity}"`,
      `"${m.responsible?.loginId || ''}"`,
      `"${formatDate(m.date)}"`,
    ].join(','))

    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Ledgra_Stock_Move_History_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <AppLayout title="Move History & Stock Ledger">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Button variant="secondary" onClick={exportToCSV} disabled={moves.length === 0} icon={<DownloadIco />}>
          Export Stock Ledger (CSV)
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showSearch ? (
            <input
              type="text"
              placeholder="Search reference..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ledgra-input"
              style={{ width: 200, padding: '6px 12px', fontSize: 13 }}
              autoFocus
              onBlur={() => !search && setShowSearch(false)}
            />
          ) : (
            <button
              className="ledgra-icon-btn"
              onClick={() => setShowSearch(true)}
              style={{ padding: 8, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', cursor: 'pointer' }}>
              <SearchIco />
            </button>
          )}

          {/* Move Type Filter Pills */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: 3, borderRadius: 10 }}>
            <button
              onClick={() => setTypeFilter('')}
              style={{
                border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                background: typeFilter === '' ? 'var(--accent)' : 'transparent',
                color: typeFilter === '' ? '#fff' : 'var(--text-muted)',
              }}>
              All Moves ({moves.length})
            </button>
            {MOVE_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                style={{
                  border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                  background: typeFilter === t ? 'var(--accent)' : 'transparent',
                  color: typeFilter === t ? '#fff' : 'var(--text-muted)',
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading stock move history...</div>
      ) : moves.length === 0 ? (
        <div className="ledgra-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}><HistoryIco /></div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>No Stock Movements Recorded</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Validate receipts, delivery orders, internal transfers, or stock adjustments to log movements in the Stock Ledger.
          </p>
        </div>
      ) : (
        <div className="ledgra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ledgra-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Product</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Quantity</th>
                <th>Responsible</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {moves.map(m => {
                const badgeInfo = TYPE_BADGES[m.moveType] || { variant: 'neutral', label: m.moveType }
                return (
                  <tr key={m._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                        {m.reference}
                      </span>
                    </td>
                    <td>
                      <Badge variant={badgeInfo.variant} size="sm">{badgeInfo.label}</Badge>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{m.product?.name || 'Product'}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{m.product?.sku}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.fromLocation?.name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.toLocation?.name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.product?.uom || 'pcs'}
                    </td>
                    <td style={{ fontSize: 13 }}>{m.responsible?.loginId || 'System'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(m.date || m.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}

export default MoveHistoryPage
