import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { receiptApi, productApi, warehouseApi, locationApi } from '../api'
import useAuthStore from '../store/authStore'

/* ─── Icons ──────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const PlusIco = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const TrashIco = () => <Ico d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>} />
const PrintIco = () => <Ico d={<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>} />
const SaveIco = () => <Ico d={<><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>} />
const CheckIco = () => <Ico d={<><polyline points="20 6 9 17 4 12"/></>} />
const BanIco = () => <Ico d={<><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>} />
const ArrowIco = () => <Ico d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} />

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const toInputDate = (d) => d ? new Date(d).toISOString().split('T')[0] : ''

/* ─── Status Stepper ──────────────────── */
const StatusStepper = ({ status }) => {
  const STEPS = ['Draft', 'Ready', 'Done']
  const isCancelled = status === 'Cancelled'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {isCancelled ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
          <BanIco /> Cancelled
        </div>
      ) : STEPS.map((step, i) => {
        const passed = STEPS.indexOf(status) > i
        const active = status === step
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: passed || active ? (active ? 'var(--accent)' : 'var(--success)') : 'var(--bg-elevated)',
                border: `2px solid ${passed || active ? (active ? 'var(--accent)' : 'var(--success)') : 'var(--border-default)'}`,
                fontSize: 11, fontWeight: 700,
                color: passed || active ? '#fff' : 'var(--text-muted)',
                transition: 'var(--transition)',
              }}>
                {passed ? <CheckIco /> : i + 1}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : passed ? 'var(--success)' : 'var(--text-muted)' }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 40, height: 2, background: passed ? 'var(--success)' : 'var(--border-default)', margin: '0 8px', transition: 'var(--transition)' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ─── Print helper ────────────────────── */
const printReceipt = (receipt) => {
  const lines = (receipt.lineItems || []).map(item =>
    `<tr><td>${item.product?.name || '—'}</td><td>${item.product?.sku || '—'}</td><td style="text-align:right">${item.quantity}</td><td style="text-align:right">${item.done}</td></tr>`
  ).join('')

  const html = `
    <html><head><title>Receipt ${receipt.reference}</title>
    <style>body{font-family:Inter,sans-serif;padding:32px;color:#111}h1{color:#e85c5c;font-size:24px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px 12px;border-bottom:1px solid #eee;text-align:left}th{background:#f5f5f5;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}.meta-item{background:#f9f9f9;padding:10px 14px;border-radius:8px}.meta-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px}.meta-value{font-size:14px;font-weight:600;margin-top:2px}
    </style></head><body>
    <h1>Ledgra</h1>
    <h2 style="font-size:18px;margin-bottom:4px">${receipt.reference}</h2>
    <p style="color:#888;font-size:13px">Printed on ${new Date().toLocaleString()}</p>
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Receive From</div><div class="meta-value">${receipt.receiveFrom || '—'}</div></div>
      <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value">${receipt.status}</div></div>
      <div class="meta-item"><div class="meta-label">Destination</div><div class="meta-value">${receipt.destinationLocation?.name || '—'}</div></div>
      <div class="meta-item"><div class="meta-label">Schedule Date</div><div class="meta-value">${formatDate(receipt.scheduleDate)}</div></div>
      <div class="meta-item"><div class="meta-label">Responsible</div><div class="meta-value">${receipt.responsible?.loginId || '—'}</div></div>
      <div class="meta-item"><div class="meta-label">Warehouse</div><div class="meta-value">${receipt.warehouse?.name || '—'}</div></div>
    </div>
    <table><thead><tr><th>Product</th><th>SKU</th><th style="text-align:right">Qty Ordered</th><th style="text-align:right">Qty Done</th></tr></thead><tbody>${lines}</tbody></table>
    <script>window.print();window.close();</script></body></html>
  `
  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}

/* ─── Receipt Detail / Form Page ─────── */
const ReceiptDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isNew = id === 'new'

  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form state (shared for new and editing)
  const [form, setForm] = useState({
    receiveFrom: '',
    scheduleDate: toInputDate(new Date()),
    destinationLocation: '',
    warehouse: '',
  })
  const [lineItems, setLineItems] = useState([]) // [{product, productName, productSku, quantity}]
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])

  // Load meta
  useEffect(() => {
    Promise.all([
      warehouseApi.getAll().then(r => r.data.data).catch(() => []),
      locationApi.getAll().then(r => r.data.data).catch(() => []),
    ]).then(([whs, locs]) => { setWarehouses(whs); setLocations(locs) })
  }, [])

  // Load existing receipt
  useEffect(() => {
    if (isNew) return
    setLoading(true)
    receiptApi.getById(id)
      .then(r => {
        const rec = r.data.data
        setReceipt(rec)
        setForm({
          receiveFrom: rec.receiveFrom || '',
          scheduleDate: toInputDate(rec.scheduleDate),
          destinationLocation: rec.destinationLocation?._id || rec.destinationLocation || '',
          warehouse: rec.warehouse?._id || rec.warehouse || '',
        })
        setLineItems((rec.lineItems || []).map(li => ({
          _id: li._id,
          product: li.product?._id || li.product,
          productName: li.product?.name || '',
          productSku: li.product?.sku || '',
          productUom: li.product?.uom || 'pcs',
          quantity: li.quantity,
          done: li.done || 0,
        })))
      })
      .catch(() => setError('Failed to load receipt'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const filteredLocations = form.warehouse
    ? locations.filter(l => l.warehouse?._id === form.warehouse || l.warehouse === form.warehouse)
    : locations

  // Product search (with debounce)
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await productApi.getAll({ search: productSearch, limit: 8 })
        setProductResults(r.data.data)
      } catch { setProductResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  const addProduct = (p) => {
    if (lineItems.find(li => li.product === p._id)) { setProductSearch(''); setProductResults([]); return }
    setLineItems(prev => [...prev, {
      product: p._id, productName: p.name, productSku: p.sku, productUom: p.uom,
      quantity: 1, done: 0,
    }])
    setProductSearch(''); setProductResults([])
  }

  const updateQty = (idx, val) => {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, quantity: Math.max(1, Number(val)) } : li))
  }

  const removeLine = (idx) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  const isEditable = isNew || ['Draft', 'Ready'].includes(receipt?.status)
  const isDone = receipt?.status === 'Done'
  const isCancelled = receipt?.status === 'Cancelled'

  const buildPayload = () => ({
    ...form,
    lineItems: lineItems.map(li => ({ product: li.product, quantity: li.quantity })),
  })

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccessMsg('')
    try {
      if (isNew) {
        if (!form.warehouse) { setError('Please select a warehouse'); setSaving(false); return }
        const r = await receiptApi.create(buildPayload())
        navigate(`/operations/receipts/${r.data.data._id}`, { replace: true })
        setSuccessMsg('Receipt created as Draft')
      } else {
        await receiptApi.update(id, buildPayload())
        // Refresh
        const r = await receiptApi.getById(id)
        setReceipt(r.data.data)
        setSuccessMsg('Saved')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleValidate = async () => {
    setValidating(true); setError(''); setSuccessMsg('')
    try {
      const r = await receiptApi.validate(id)
      setReceipt(r.data.data)
      setLineItems((r.data.data.lineItems || []).map(li => ({
        _id: li._id, product: li.product?._id || li.product,
        productName: li.product?.name || '', productSku: li.product?.sku || '',
        productUom: li.product?.uom || 'pcs',
        quantity: li.quantity, done: li.done || 0,
      })))
      setSuccessMsg(r.data.message)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e) {
      setError(e.response?.data?.message || 'Validation failed')
    } finally { setValidating(false) }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this receipt?')) return
    setCancelling(true); setError('')
    try {
      const r = await receiptApi.cancel(id)
      setReceipt(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Cancel failed')
    } finally { setCancelling(false) }
  }

  if (loading) {
    return (
      <AppLayout title="Receipt">
        <div style={{ textAlign: 'center', padding: 80 }}><span className="spinner spinner-dark" /></div>
      </AppLayout>
    )
  }

  const pageTitle = isNew ? 'New Receipt' : receipt?.reference || 'Receipt'

  return (
    <AppLayout title={pageTitle}>
      {/* Back link */}
      <button
        onClick={() => navigate('/operations/receipts')}
        className="ledgra-btn ledgra-btn-ghost"
        style={{ marginBottom: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
      >
        <ArrowIco /> Back to Receipts
      </button>

      {/* Header card */}
      <div className="ledgra-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{pageTitle}</h2>
              {receipt && <Badge status={receipt.status} />}
            </div>
            {receipt && <StatusStepper status={receipt.status} />}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isEditable && (
              <Button variant="secondary" icon={<SaveIco />} onClick={handleSave} loading={saving}>
                {isNew ? 'Create' : 'Save'}
              </Button>
            )}
            {!isNew && !isCancelled && !isDone && (
              <Button variant="primary" icon={<CheckIco />} onClick={handleValidate} loading={validating} id="validate-btn">
                {receipt?.status === 'Draft' ? 'Validate → Ready' : 'Validate → Done'}
              </Button>
            )}
            {isDone && (
              <Button variant="secondary" icon={<PrintIco />} onClick={() => printReceipt(receipt)} id="print-btn">
                Print
              </Button>
            )}
            {!isNew && !isDone && !isCancelled && (
              <Button variant="danger" icon={<BanIco />} onClick={handleCancel} loading={cancelling} id="cancel-btn">
                Cancel
              </Button>
            )}
          </div>
        </div>

        {error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}
        {successMsg && <div className="alert-success" style={{ marginTop: 16 }}>{successMsg}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Left: Line Items */}
        <div>
          <div className="ledgra-card" style={{ overflow: 'hidden', marginBottom: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 14, fontWeight: 600 }}>
              Products
            </div>

            {/* Line items table */}
            <table className="ledgra-table">
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>UOM</th>
                  <th style={{ textAlign: 'right' }}>Qty Ordered</th>
                  {!isNew && receipt?.status !== 'Draft' && <th style={{ textAlign: 'right' }}>Qty Done</th>}
                  {isEditable && <th style={{ width: 40 }}></th>}
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                    No products added yet
                  </td></tr>
                )}
                {lineItems.map((li, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{li.productName}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{li.productSku}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{li.productUom}</td>
                    <td style={{ textAlign: 'right' }}>
                      {isEditable ? (
                        <input
                          type="number" min="1" value={li.quantity}
                          onChange={e => updateQty(idx, e.target.value)}
                          style={{
                            width: 80, textAlign: 'right', background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)', borderRadius: 6,
                            padding: '4px 8px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13, outline: 'none',
                          }}
                        />
                      ) : <span style={{ fontWeight: 600 }}>{li.quantity}</span>}
                    </td>
                    {!isNew && receipt?.status !== 'Draft' && (
                      <td style={{ textAlign: 'right', fontWeight: 600, color: li.done >= li.quantity ? 'var(--success)' : 'var(--text-muted)' }}>
                        {li.done}
                      </td>
                    )}
                    {isEditable && (
                      <td>
                        <button className="ledgra-btn ledgra-btn-danger" style={{ padding: '4px 6px' }} onClick={() => removeLine(idx)}>
                          <TrashIco />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add product row */}
            {isEditable && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ledgra-input"
                    placeholder="+ Add product (search by name or SKU)…"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ paddingLeft: 14 }}
                  />
                  {/* Dropdown */}
                  {(productResults.length > 0 || searching) && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      borderRadius: 10, boxShadow: 'var(--shadow-md)', zIndex: 100,
                      maxHeight: 240, overflowY: 'auto',
                    }}>
                      {searching && <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Searching…</div>}
                      {!searching && productResults.map(p => (
                        <button
                          key={p._id}
                          onMouseDown={() => addProduct(p)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                            cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background 0.1s', fontFamily: 'inherit',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.uom}</div>
                        </button>
                      ))}
                      {!searching && productResults.length === 0 && productSearch && (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No products found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Fields */}
        <div className="ledgra-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Details
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Receive From */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Receive From</label>
              {isEditable ? (
                <input className="ledgra-input" placeholder="Supplier / Contact"
                  value={form.receiveFrom} onChange={e => setForm(f => ({ ...f, receiveFrom: e.target.value }))} />
              ) : (
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', padding: '8px 0' }}>
                  {receipt?.receiveFrom || '—'}
                </div>
              )}
            </div>

            {/* Schedule Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Schedule Date</label>
              {isEditable ? (
                <input type="date" className="ledgra-input"
                  value={form.scheduleDate} onChange={e => setForm(f => ({ ...f, scheduleDate: e.target.value }))} />
              ) : (
                <div style={{ fontSize: 14, color: 'var(--text-primary)', padding: '8px 0' }}>
                  {formatDate(receipt?.scheduleDate)}
                </div>
              )}
            </div>

            {/* Responsible */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Responsible</label>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', padding: '8px 0', fontWeight: 500 }}>
                {receipt?.responsible?.loginId || user?.loginId || '—'}
              </div>
            </div>

            {/* Warehouse */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Warehouse</label>
              {isEditable && isNew ? (
                <select className="ledgra-input" value={form.warehouse}
                  onChange={e => { setForm(f => ({ ...f, warehouse: e.target.value, destinationLocation: '' })) }}>
                  <option value="">— Select —</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.shortCode})</option>)}
                </select>
              ) : (
                <div style={{ fontSize: 14, color: 'var(--text-primary)', padding: '8px 0' }}>
                  {receipt?.warehouse?.name || '—'} {receipt?.warehouse?.shortCode && `(${receipt.warehouse.shortCode})`}
                </div>
              )}
            </div>

            {/* Destination Location */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destination Location</label>
              {isEditable ? (
                <select className="ledgra-input" value={form.destinationLocation}
                  onChange={e => setForm(f => ({ ...f, destinationLocation: e.target.value }))}>
                  <option value="">— Select Location —</option>
                  {filteredLocations.map(l => <option key={l._id} value={l._id}>{l.name} ({l.shortCode})</option>)}
                </select>
              ) : (
                <div style={{ fontSize: 14, color: 'var(--text-primary)', padding: '8px 0' }}>
                  {receipt?.destinationLocation?.name || '—'}
                </div>
              )}
            </div>

            {/* Timestamps */}
            {receipt?.validatedAt && (
              <div style={{ padding: '10px 12px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, fontSize: 12, color: 'var(--success)' }}>
                ✓ Validated on {formatDate(receipt.validatedAt)}
              </div>
            )}
            {receipt?.cancelledAt && (
              <div style={{ padding: '10px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, fontSize: 12, color: 'var(--danger)' }}>
                ✕ Cancelled on {formatDate(receipt.cancelledAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default ReceiptDetailPage
