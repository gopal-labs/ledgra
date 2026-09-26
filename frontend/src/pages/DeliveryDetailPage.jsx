import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { deliveryApi, productApi, locationApi, warehouseApi } from '../api'

/* ─── Icons ─────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const ArrowLeftIco = () => <Ico d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} />
const CheckIco = () => <Ico d={<polyline points="20 6 9 17 4 12"/>} />
const PlusIco = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const TrashIco = () => <Ico d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>} />
const PrintIco = () => <Ico d={<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 012 2h-2"/><rect x="6" y="14" width="12" height="8"/></>} />
const SearchIco = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const RefreshIco = () => <Ico d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>} />

const STATUSES = ['Draft', 'Waiting', 'Ready', 'Done']

const toInputDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toISOString().split('T')[0]
}

const DeliveryDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)
  const [error, setError] = useState(null)
  const [printModal, setPrintModal] = useState(false)

  // Form State
  const [form, setForm] = useState({
    deliveryTo: '',
    scheduleDate: toInputDate(new Date()),
    sourceLocation: '',
    warehouse: '',
  })
  const [lineItems, setLineItems] = useState([]) // [{product, productName, productSku, demand, reserved, done}]
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])

  // Load Meta (Warehouses & Locations)
  useEffect(() => {
    Promise.all([
      warehouseApi.getAll().then(r => r.data.data).catch(() => []),
      locationApi.getAll().then(r => r.data.data).catch(() => []),
    ]).then(([whs, locs]) => {
      setWarehouses(whs)
      setLocations(locs)
      if (isNew) {
        const defWh = whs.find(w => w.isDefault) || whs[0]
        const whId = defWh?._id || ''
        const defLoc = locs.find(l => (l.warehouse?._id === whId || l.warehouse === whId) && l.type === 'Internal') || locs[0]
        setForm(f => ({
          ...f,
          warehouse: whId,
          sourceLocation: defLoc?._id || '',
        }))
      }
    })
  }, [isNew])

  // Load Existing Delivery
  useEffect(() => {
    if (isNew) return
    setLoading(true)
    deliveryApi.getById(id)
      .then(r => {
        const del = r.data.data
        setDelivery(del)
        setForm({
          deliveryTo: del.deliveryTo || '',
          scheduleDate: toInputDate(del.scheduleDate),
          sourceLocation: del.sourceLocation?._id || del.sourceLocation || '',
          warehouse: del.warehouse?._id || del.warehouse || '',
        })
        setLineItems((del.lineItems || []).map(li => ({
          _id: li._id,
          product: li.product?._id || li.product,
          productName: li.product?.name || '',
          productSku: li.product?.sku || '',
          productUom: li.product?.uom || 'pcs',
          demand: li.demand || li.quantity || 1,
          reserved: li.reserved || 0,
          done: li.done || 0,
        })))
      })
      .catch(() => setError('Failed to load delivery order'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  // Search Products for line item adding
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    setSearching(true)
    const t = setTimeout(() => {
      productApi.getAll({ search: productSearch })
        .then(r => setProductResults(r.data.data || []))
        .catch(() => setProductResults([]))
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(t)
  }, [productSearch])

  // Add Product to line items
  const addProductLine = (prod) => {
    if (lineItems.some(i => i.product === prod._id)) return
    setLineItems(prev => [
      ...prev,
      {
        product: prod._id,
        productName: prod.name,
        productSku: prod.sku,
        productUom: prod.uom || 'pcs',
        demand: 1,
        reserved: 0,
        done: 0,
      }
    ])
    setProductSearch('')
    setProductResults([])
  }

  const updateDemand = (index, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1)
    setLineItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], demand: num }
      return next
    })
  }

  const removeLine = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  // Save / Create Delivery
  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (lineItems.length === 0) {
      setError('Please add at least one product line item')
      return
    }

    setSaving(true)
    setError(null)
    setActionMsg(null)

    const payload = {
      deliveryTo: form.deliveryTo,
      scheduleDate: form.scheduleDate,
      sourceLocation: form.sourceLocation,
      warehouse: form.warehouse,
      lineItems: lineItems.map(li => ({
        product: li.product,
        demand: li.demand,
      })),
    }

    try {
      if (isNew) {
        const res = await deliveryApi.create(payload)
        navigate(`/operations/delivery/${res.data.data._id}`, { replace: true })
      } else {
        const res = await deliveryApi.update(id, payload)
        setDelivery(res.data.data)
        setActionMsg('Delivery order saved.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save delivery order')
    } finally {
      setSaving(false)
    }
  }

  // Action: Check Availability (Reserve Stock)
  const handleCheckAvailability = async () => {
    if (lineItems.length === 0) {
      setError('Please add at least one product line item before checking availability')
      return
    }
    setSaving(true)
    setError(null)
    setActionMsg(null)

    try {
      let targetId = id
      if (isNew) {
        const payload = {
          deliveryTo: form.deliveryTo,
          scheduleDate: form.scheduleDate,
          sourceLocation: form.sourceLocation,
          warehouse: form.warehouse,
          lineItems: lineItems.map(li => ({ product: li.product, demand: li.demand })),
        }
        const createRes = await deliveryApi.create(payload)
        targetId = createRes.data.data._id
      }

      const res = await deliveryApi.reserve(targetId)
      setDelivery(res.data.data)
      setActionMsg(res.data.message || 'Stock availability checked.')
      setLineItems(res.data.data.lineItems.map(li => ({
        _id: li._id,
        product: li.product?._id || li.product,
        productName: li.product?.name || '',
        productSku: li.product?.sku || '',
        productUom: li.product?.uom || 'pcs',
        demand: li.demand,
        reserved: li.reserved || 0,
        done: li.done || 0,
      })))

      if (isNew) {
        navigate(`/operations/delivery/${targetId}`, { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check availability')
    } finally {
      setSaving(false)
    }
  }

  // Action: Validate Delivery (Dispatch)
  const handleValidate = async () => {
    if (lineItems.length === 0) {
      setError('Please add at least one product line item before validating delivery')
      return
    }
    setSaving(true)
    setError(null)
    setActionMsg(null)

    try {
      let targetId = id
      if (isNew) {
        const payload = {
          deliveryTo: form.deliveryTo,
          scheduleDate: form.scheduleDate,
          sourceLocation: form.sourceLocation,
          warehouse: form.warehouse,
          lineItems: lineItems.map(li => ({ product: li.product, demand: li.demand })),
        }
        const createRes = await deliveryApi.create(payload)
        targetId = createRes.data.data._id
      }

      const res = await deliveryApi.validate(targetId)
      setDelivery(res.data.data)
      setActionMsg('Delivery validated successfully! Stock deducted.')
      setLineItems(res.data.data.lineItems.map(li => ({
        _id: li._id,
        product: li.product?._id || li.product,
        productName: li.product?.name || '',
        productSku: li.product?.sku || '',
        productUom: li.product?.uom || 'pcs',
        demand: li.demand,
        reserved: li.reserved || 0,
        done: li.done || 0,
      })))

      if (isNew) {
        navigate(`/operations/delivery/${targetId}`, { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed')
    } finally {
      setSaving(false)
    }
  }

  // Action: Cancel Delivery
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this delivery order?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await deliveryApi.cancel(id)
      setDelivery(res.data.data)
      setActionMsg('Delivery order cancelled.')
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel failed')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = delivery?.status || 'Draft'
  const filteredLocations = form.warehouse
    ? locations.filter(l => l.warehouse?._id === form.warehouse || l.warehouse === form.warehouse)
    : locations

  return (
    <AppLayout title={isNew ? 'New Delivery Order' : (delivery?.reference || 'Delivery Order')}>
      {/* ─── Top Bar ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={() => navigate('/operations/delivery')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <ArrowLeftIco /> Back to Delivery Orders
        </button>

        {/* Stepper header */}
        <div style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
          {STATUSES.map((st, idx) => {
            const active = currentStatus === st
            const doneIndex = STATUSES.indexOf(currentStatus)
            const isPast = doneIndex > idx && currentStatus !== 'Cancelled'
            return (
              <div
                key={st}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  background: active ? 'var(--accent)' : isPast ? 'rgba(96,165,250,0.15)' : 'transparent',
                  color: active ? '#fff' : isPast ? '#60a5fa' : 'var(--text-muted)',
                  borderRight: idx < STATUSES.length - 1 ? '1px solid var(--border-color)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {isPast ? <CheckIco /> : `${idx + 1}.`} {st}
              </div>
            )
          })}
          {currentStatus === 'Cancelled' && (
            <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#f87171', color: '#fff' }}>
              Cancelled
            </div>
          )}
        </div>
      </div>

      {/* ─── Feedback Alerts ────────────────────────── */}
      {actionMsg && (
        <div style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid #4ade80', color: '#4ade80', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {actionMsg}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', color: '#f87171', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading delivery details...</div>
      ) : (
        <div className="ledgra-card" style={{ padding: 24 }}>
          {/* ─── Action Toolbar ──────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
            {(isNew || currentStatus === 'Draft' || currentStatus === 'Waiting') && (
              <Button variant="secondary" onClick={handleSave} disabled={saving}>
                {isNew ? 'Create Draft' : 'Save Changes'}
              </Button>
            )}

            {!isNew && (currentStatus === 'Draft' || currentStatus === 'Waiting') && (
              <Button variant="primary" onClick={handleCheckAvailability} disabled={saving} icon={<RefreshIco />}>
                Check Availability (Reserve Stock)
              </Button>
            )}

            {!isNew && (currentStatus === 'Ready' || currentStatus === 'Waiting' || currentStatus === 'Draft') && (
              <Button variant="primary" onClick={handleValidate} disabled={saving} icon={<CheckIco />}>
                Validate Delivery (Dispatch)
              </Button>
            )}

            {!isNew && currentStatus === 'Done' && (
              <Button variant="secondary" onClick={() => setPrintModal(true)} icon={<PrintIco />}>
                Print Delivery Slip
              </Button>
            )}

            {!isNew && currentStatus !== 'Done' && currentStatus !== 'Cancelled' && (
              <Button variant="ghost" onClick={handleCancel} disabled={saving} style={{ color: '#f87171' }}>
                Cancel Order
              </Button>
            )}
          </div>

          {/* ─── Form Metadata Header ──────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Customer / Delivery To
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp / Customer Name"
                value={form.deliveryTo}
                onChange={e => setForm({ ...form, deliveryTo: e.target.value })}
                disabled={currentStatus === 'Done' || currentStatus === 'Cancelled'}
                className="ledgra-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Warehouse
              </label>
              <select
                value={form.warehouse}
                onChange={e => {
                  const whId = e.target.value
                  const loc = locations.find(l => l.warehouse?._id === whId || l.warehouse === whId)
                  setForm({ ...form, warehouse: whId, sourceLocation: loc?._id || '' })
                }}
                disabled={currentStatus === 'Done' || currentStatus === 'Cancelled'}
                className="ledgra-input"
                style={{ width: '100%' }}>
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>{w.name} ({w.shortCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Source Location
              </label>
              <select
                value={form.sourceLocation}
                onChange={e => setForm({ ...form, sourceLocation: e.target.value })}
                disabled={currentStatus === 'Done' || currentStatus === 'Cancelled'}
                className="ledgra-input"
                style={{ width: '100%' }}>
                {filteredLocations.map(l => (
                  <option key={l._id} value={l._id}>{l.name} ({l.shortCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Scheduled Date
              </label>
              <input
                type="date"
                value={form.scheduleDate}
                onChange={e => setForm({ ...form, scheduleDate: e.target.value })}
                disabled={currentStatus === 'Done' || currentStatus === 'Cancelled'}
                className="ledgra-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* ─── Line Items Section ────────────────────── */}
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Line Items (Products to Ship)</h4>

            {/* Product Autocomplete search (if editable) */}
            {(currentStatus === 'Draft' || currentStatus === 'Waiting' || isNew) && (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}><SearchIco /></span>
                  <input
                    type="text"
                    placeholder="Search product by name or SKU to add line item..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="ledgra-input"
                    style={{ flex: 1 }}
                  />
                </div>

                {/* Autocomplete dropdown */}
                {productResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)', marginTop: 4, maxHeight: 200, overflowY: 'auto',
                  }}>
                    {productResults.map(p => (
                      <div
                        key={p._id}
                        onClick={() => addProductLine(p)}
                        style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                        className="ledgra-card-clickable">
                        <div>
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>({p.sku})</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--accent)' }}>+ Add Line</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            {lineItems.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 13 }}>
                No products added to delivery order yet. Use search above to select products.
              </div>
            ) : (
              <table className="ledgra-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th style={{ width: 110 }}>Demand</th>
                    <th style={{ width: 110 }}>Reserved</th>
                    <th style={{ width: 110 }}>Done</th>
                    {(currentStatus === 'Draft' || isNew) && <th style={{ width: 50 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => {
                    const isFullyReserved = item.reserved >= item.demand && item.demand > 0
                    const isPartial = item.reserved > 0 && item.reserved < item.demand
                    return (
                      <tr key={item.product || idx}>
                        <td style={{ fontWeight: 500 }}>{item.productName || 'Product'}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.productSku || '—'}</td>
                        <td>
                          {currentStatus === 'Draft' || isNew ? (
                            <input
                              type="number"
                              min="1"
                              value={item.demand}
                              onChange={e => updateDemand(idx, e.target.value)}
                              className="ledgra-input"
                              style={{ width: 80, padding: '4px 8px' }}
                            />
                          ) : (
                            <span>{item.demand} {item.productUom}</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            background: isFullyReserved ? 'rgba(74,222,128,0.15)' : isPartial ? 'rgba(245,158,11,0.15)' : 'rgba(248,113,113,0.15)',
                            color: isFullyReserved ? '#4ade80' : isPartial ? '#f59e0b' : '#f87171',
                          }}>
                            {item.reserved || 0} {item.productUom}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: item.done > 0 ? 600 : 400, color: item.done > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                            {item.done || 0} {item.productUom}
                          </span>
                        </td>
                        {(currentStatus === 'Draft' || isNew) && (
                          <td>
                            <button
                              onClick={() => removeLine(idx)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}>
                              <TrashIco />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Printable Delivery Slip Modal ─────────────── */}
      {printModal && delivery && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ background: '#fff', color: '#111', width: 600, padding: 30, borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>LEDGRA INVENTORY</h2>
                <div style={{ fontSize: 12, color: '#666' }}>Delivery Packing Slip</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, color: '#e85c5c', fontFamily: 'monospace' }}>{delivery.reference}</h3>
                <div style={{ fontSize: 12 }}>Date: {new Date(delivery.scheduleDate).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, fontSize: 13 }}>
              <div>
                <strong>Customer / Delivery To:</strong>
                <div>{delivery.deliveryTo || 'Customer'}</div>
              </div>
              <div>
                <strong>Source Location:</strong>
                <div>{delivery.sourceLocation?.name || 'Main Stock'} ({delivery.warehouse?.name})</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #ccc' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Product</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>SKU</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Demanded</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Delivered Qty</th>
                </tr>
              </thead>
              <tbody>
                {delivery.lineItems?.map((li, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{li.product?.name}</td>
                    <td style={{ padding: 8, fontFamily: 'monospace' }}>{li.product?.sku}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{li.demand}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{li.done || li.reserved}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="ghost" onClick={() => setPrintModal(false)}>Close</Button>
              <Button variant="primary" onClick={() => window.print()} icon={<PrintIco />}>Print</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default DeliveryDetailPage
