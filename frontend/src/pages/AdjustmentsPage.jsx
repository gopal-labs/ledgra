import React, { useState, useEffect, useCallback } from 'react'
import AppLayout from '../components/AppLayout'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { adjustmentApi, productApi, locationApi, warehouseApi } from '../api'

/* ─── Icons ─────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const PlusIco = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const SearchIco = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const SliderIco = ({ size = 36 }) => <Ico size={size} d={<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>} />

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const AdjustmentsPage = () => {
  const [adjustments, setAdjustments] = useState([])
  const [stats, setStats] = useState({ Draft: 0, Done: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  // New Adjustment Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])

  const [form, setForm] = useState({
    product: '',
    location: '',
    warehouse: '',
    recordedQuantity: 0,
    countedQuantity: '',
    reason: '',
  })
  const [fetchingStock, setFetchingStock] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)

  const fetchAdjustments = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const r = await adjustmentApi.getAll(params)
      setAdjustments(r.data.data)
      if (r.data.stats) setStats(r.data.stats)
    } catch {
      setAdjustments([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchAdjustments()
  }, [fetchAdjustments])

  // Open New Adjustment Modal & Load options
  const openNewModal = () => {
    setModalOpen(true)
    setModalError(null)
    Promise.all([
      productApi.getAll().then(r => r.data.data).catch(() => []),
      locationApi.getAll().then(r => r.data.data).catch(() => []),
      warehouseApi.getAll().then(r => r.data.data).catch(() => []),
    ]).then(([prods, locs, whs]) => {
      setProducts(prods)
      setLocations(locs)
      setWarehouses(whs)
      const defProd = prods[0]?._id || ''
      const defLoc = locs[0]?._id || ''
      const defWh = whs.find(w => w.isDefault)?._id || whs[0]?._id || ''
      setForm({
        product: defProd,
        location: defLoc,
        warehouse: defWh,
        recordedQuantity: 0,
        countedQuantity: '',
        reason: '',
      })
      if (defProd && defLoc) {
        fetchSystemStock(defProd, defLoc)
      }
    })
  }

  // Fetch recorded system stock when product or location changes
  const fetchSystemStock = async (prodId, locId) => {
    if (!prodId || !locId) return
    setFetchingStock(true)
    try {
      const res = await adjustmentApi.getSystemStock(prodId, locId)
      setForm(f => ({ ...f, recordedQuantity: res.data.recordedQuantity || 0 }))
    } catch {
      setForm(f => ({ ...f, recordedQuantity: 0 }))
    } finally {
      setFetchingStock(false)
    }
  }

  const handleProductChange = (prodId) => {
    setForm(f => ({ ...f, product: prodId }))
    fetchSystemStock(prodId, form.location)
  }

  const handleLocationChange = (locId) => {
    setForm(f => ({ ...f, location: locId }))
    fetchSystemStock(form.product, locId)
  }

  const computedDifference = (parseFloat(form.countedQuantity) || 0) - form.recordedQuantity

  // Submit & Validate Adjustment directly
  const handleSubmitAdjustment = async (e) => {
    e.preventDefault()
    if (!form.product || !form.location) {
      setModalError('Product and Location are required')
      return
    }
    if (form.countedQuantity === '') {
      setModalError('Please enter physical counted quantity')
      return
    }

    setSaving(true)
    setModalError(null)
    try {
      // 1. Create Adjustment
      const createRes = await adjustmentApi.create({
        product: form.product,
        location: form.location,
        warehouse: form.warehouse,
        countedQuantity: parseFloat(form.countedQuantity),
        reason: form.reason,
      })
      const adjId = createRes.data.data._id
      // 2. Validate immediately to update stock
      await adjustmentApi.validate(adjId)

      setModalOpen(false)
      fetchAdjustments()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to submit adjustment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Stock Adjustments">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Button variant="primary" onClick={openNewModal} icon={<PlusIco />}>
          New Stock Adjustment
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

          <div style={{ display: 'flex', gap: 4, background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: 3, borderRadius: 10 }}>
            <button
              onClick={() => setStatusFilter('')}
              style={{
                border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                background: statusFilter === '' ? 'var(--accent)' : 'transparent',
                color: statusFilter === '' ? '#fff' : 'var(--text-muted)',
              }}>
              All ({adjustments.length})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'Done' ? '' : 'Done')}
              style={{
                border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                background: statusFilter === 'Done' ? '#4ade80' : 'transparent',
                color: statusFilter === 'Done' ? '#111' : 'var(--text-muted)',
                fontWeight: statusFilter === 'Done' ? 600 : 400,
              }}>
              Applied / Done ({stats.Done || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading adjustments...</div>
      ) : adjustments.length === 0 ? (
        <div className="ledgra-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}><SliderIco /></div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>No Stock Adjustments Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>
            Reconcile physical inventory counts against system recorded stock.
          </p>
          <Button variant="primary" onClick={openNewModal} icon={<PlusIco />}>
            Create Stock Adjustment
          </Button>
        </div>
      ) : (
        <div className="ledgra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ledgra-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Product</th>
                <th>Location</th>
                <th>Recorded Qty</th>
                <th>Counted Qty</th>
                <th>Difference</th>
                <th>Reason / Note</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(adj => {
                const isPositive = adj.difference > 0
                const isNegative = adj.difference < 0
                return (
                  <tr key={adj._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                        {adj.reference}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{adj.product?.name || 'Product'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{adj.location?.name || '—'}</td>
                    <td style={{ fontSize: 13 }}>{adj.recordedQuantity} {adj.product?.uom}</td>
                    <td style={{ fontWeight: 600 }}>{adj.countedQuantity} {adj.product?.uom}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: isPositive ? 'rgba(74,222,128,0.15)' : isNegative ? 'rgba(248,113,113,0.15)' : 'var(--border-color)',
                        color: isPositive ? '#4ade80' : isNegative ? '#f87171' : 'var(--text-muted)',
                      }}>
                        {isPositive ? `+${adj.difference}` : adj.difference} {adj.product?.uom}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{adj.reason || '—'}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(adj.createdAt)}</td>
                    <td>
                      <Badge variant={adj.status === 'Done' ? 'success' : 'neutral'} size="sm">
                        {adj.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Adjustment Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="New Stock Adjustment (Count Reconciliation)">
          <form onSubmit={handleSubmitAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {modalError && (
              <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Select Product
              </label>
              <select
                value={form.product}
                onChange={e => handleProductChange(e.target.value)}
                className="ledgra-input"
                style={{ width: '100%' }}>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Select Storage Location
              </label>
              <select
                value={form.location}
                onChange={e => handleLocationChange(e.target.value)}
                className="ledgra-input"
                style={{ width: '100%' }}>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name} ({l.shortCode})</option>
                ))}
              </select>
            </div>

            {/* Auto recorded quantity display */}
            <div style={{ background: 'var(--border-color)', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>System Recorded Stock:</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {fetchingStock ? 'Checking...' : `${form.recordedQuantity} units`}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Physical Counted Quantity *
              </label>
              <input
                type="number"
                step="any"
                placeholder="Enter physical count"
                value={form.countedQuantity}
                onChange={e => setForm({ ...form, countedQuantity: e.target.value })}
                required
                className="ledgra-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Computed Difference Preview */}
            {form.countedQuantity !== '' && (
              <div style={{
                padding: 12, borderRadius: 10, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: computedDifference > 0 ? 'rgba(74,222,128,0.15)' : computedDifference < 0 ? 'rgba(248,113,113,0.15)' : 'var(--border-color)',
                color: computedDifference > 0 ? '#4ade80' : computedDifference < 0 ? '#f87171' : 'var(--text-muted)',
              }}>
                <span>Calculated Stock Difference:</span>
                <strong style={{ fontSize: 15 }}>
                  {computedDifference > 0 ? `+${computedDifference}` : computedDifference} units
                </strong>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Reason / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Damaged inventory / Annual physical audit count"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="ledgra-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Validating...' : 'Validate & Apply Adjustment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}

export default AdjustmentsPage
