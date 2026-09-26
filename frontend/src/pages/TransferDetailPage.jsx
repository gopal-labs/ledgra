import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { transferApi, productApi, locationApi, warehouseApi } from '../api'

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

const STATUSES = ['Draft', 'Ready', 'Done']

const toInputDate = (d) => {
  if (!d) return ''
  return new Date(d).toISOString().split('T')[0]
}

const TransferDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [transfer, setTransfer] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)
  const [error, setError] = useState(null)
  const [printModal, setPrintModal] = useState(false)

  const [form, setForm] = useState({
    fromLocation: '',
    toLocation: '',
    scheduleDate: toInputDate(new Date()),
    warehouse: '',
  })
  const [lineItems, setLineItems] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])

  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])

  // Load Metadata
  useEffect(() => {
    Promise.all([
      warehouseApi.getAll().then(r => r.data.data).catch(() => []),
      locationApi.getAll().then(r => r.data.data).catch(() => []),
    ]).then(([whs, locs]) => {
      setWarehouses(whs)
      setLocations(locs)
      if (isNew && locs.length > 1) {
        const defWh = whs.find(w => w.isDefault) || whs[0]
        setForm(f => ({
          ...f,
          warehouse: defWh?._id || '',
          fromLocation: locs[0]?._id || '',
          toLocation: locs[1]?._id || '',
        }))
      }
    })
  }, [isNew])

  // Load Existing Transfer
  useEffect(() => {
    if (isNew) return
    setLoading(true)
    transferApi.getById(id)
      .then(r => {
        const tr = r.data.data
        setTransfer(tr)
        setForm({
          fromLocation: tr.fromLocation?._id || tr.fromLocation || '',
          toLocation: tr.toLocation?._id || tr.toLocation || '',
          scheduleDate: toInputDate(tr.scheduleDate),
          warehouse: tr.warehouse?._id || tr.warehouse || '',
        })
        setLineItems((tr.lineItems || []).map(li => ({
          _id: li._id,
          product: li.product?._id || li.product,
          productName: li.product?.name || '',
          productSku: li.product?.sku || '',
          productUom: li.product?.uom || 'pcs',
          quantity: li.quantity || 1,
          done: li.done || 0,
        })))
      })
      .catch(() => setError('Failed to load transfer'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  // Product Autocomplete
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    const t = setTimeout(() => {
      productApi.getAll({ search: productSearch })
        .then(r => setProductResults(r.data.data || []))
        .catch(() => setProductResults([]))
    }, 250)
    return () => clearTimeout(t)
  }, [productSearch])

  const addProductLine = (prod) => {
    if (lineItems.some(i => i.product === prod._id)) return
    setLineItems(prev => [
      ...prev,
      {
        product: prod._id,
        productName: prod.name,
        productSku: prod.sku,
        productUom: prod.uom || 'pcs',
        quantity: 1,
        done: 0,
      }
    ])
    setProductSearch('')
    setProductResults([])
  }

  const updateQuantity = (index, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1)
    setLineItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], quantity: num }
      return next
    })
  }

  const removeLine = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!form.fromLocation || !form.toLocation) {
      setError('Please select both From and To locations')
      return
    }
    if (form.fromLocation === form.toLocation) {
      setError('From and To locations cannot be identical')
      return
    }
    if (lineItems.length === 0) {
      setError('Please add at least one line item')
      return
    }

    setSaving(true)
    setError(null)
    setActionMsg(null)

    const payload = {
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      scheduleDate: form.scheduleDate,
      warehouse: form.warehouse,
      lineItems: lineItems.map(li => ({ product: li.product, quantity: li.quantity })),
    }

    try {
      if (isNew) {
        const res = await transferApi.create(payload)
        navigate(`/operations/internal/${res.data.data._id}`, { replace: true })
      } else {
        const res = await transferApi.update(id, payload)
        setTransfer(res.data.data)
        setActionMsg('Transfer saved successfully.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transfer')
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    if (lineItems.length === 0) {
      setError('Add line items before validating')
      return
    }
    setSaving(true)
    setError(null)
    setActionMsg(null)

    try {
      let targetId = id
      if (isNew) {
        const payload = {
          fromLocation: form.fromLocation,
          toLocation: form.toLocation,
          scheduleDate: form.scheduleDate,
          warehouse: form.warehouse,
          lineItems: lineItems.map(li => ({ product: li.product, quantity: li.quantity })),
        }
        const createRes = await transferApi.create(payload)
        targetId = createRes.data.data._id
      }

      const res = await transferApi.validate(targetId)
      setTransfer(res.data.data)
      setActionMsg('Internal transfer validated successfully! Stock moved.')
      if (isNew) navigate(`/operations/internal/${targetId}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer validation failed')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = transfer?.status || 'Draft'

  return (
    <AppLayout title={isNew ? 'New Internal Transfer' : (transfer?.reference || 'Internal Transfer')}>
      {/* Top navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={() => navigate('/operations/internal')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <ArrowLeftIco /> Back to Internal Transfers
        </button>

        <div style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
          {STATUSES.map((st, idx) => {
            const active = currentStatus === st
            const doneIndex = STATUSES.indexOf(currentStatus)
            const isPast = doneIndex > idx && currentStatus !== 'Cancelled'
            return (
              <div
                key={st}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: active ? 600 : 400,
                  background: active ? 'var(--accent)' : isPast ? 'rgba(96,165,250,0.15)' : 'transparent',
                  color: active ? '#fff' : isPast ? '#60a5fa' : 'var(--text-muted)',
                  borderRight: idx < STATUSES.length - 1 ? '1px solid var(--border-color)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {isPast ? <CheckIco /> : `${idx + 1}.`} {st}
              </div>
            )
          })}
        </div>
      </div>

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
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading transfer details...</div>
      ) : (
        <div className="ledgra-card" style={{ padding: 24 }}>
          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
            {(isNew || currentStatus === 'Draft') && (
              <Button variant="secondary" onClick={handleSave} disabled={saving}>
                {isNew ? 'Create Draft' : 'Save Changes'}
              </Button>
            )}

            {currentStatus !== 'Done' && (
              <Button variant="primary" onClick={handleValidate} disabled={saving} icon={<CheckIco />}>
                Validate Transfer
              </Button>
            )}

            {currentStatus === 'Done' && (
              <Button variant="secondary" onClick={() => setPrintModal(true)} icon={<PrintIco />}>
                Print Transfer Note
              </Button>
            )}
          </div>

          {/* Form Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                From Source Location
              </label>
              <select
                value={form.fromLocation}
                onChange={e => setForm({ ...form, fromLocation: e.target.value })}
                disabled={currentStatus === 'Done'}
                className="ledgra-input"
                style={{ width: '100%' }}>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name} ({l.shortCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                To Destination Location
              </label>
              <select
                value={form.toLocation}
                onChange={e => setForm({ ...form, toLocation: e.target.value })}
                disabled={currentStatus === 'Done'}
                className="ledgra-input"
                style={{ width: '100%' }}>
                {locations.map(l => (
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
                disabled={currentStatus === 'Done'}
                className="ledgra-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Products to Transfer</h4>

            {(currentStatus === 'Draft' || isNew) && (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}><SearchIco /></span>
                  <input
                    type="text"
                    placeholder="Search product by name or SKU..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="ledgra-input"
                    style={{ flex: 1 }}
                  />
                </div>
                {productResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                    {productResults.map(p => (
                      <div key={p._id} onClick={() => addProductLine(p)} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <div><span style={{ fontWeight: 500 }}>{p.name}</span> <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({p.sku})</span></div>
                        <span style={{ fontSize: 12, color: 'var(--accent)' }}>+ Add Line</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {lineItems.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 13 }}>
                No products added to internal transfer.
              </div>
            ) : (
              <table className="ledgra-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Transfer Quantity</th>
                    {(currentStatus === 'Draft' || isNew) && <th style={{ width: 50 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{item.productName}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.productSku}</td>
                      <td>
                        {currentStatus === 'Draft' || isNew ? (
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateQuantity(idx, e.target.value)}
                            className="ledgra-input"
                            style={{ width: 90, padding: '4px 8px' }}
                          />
                        ) : (
                          <span>{item.quantity} {item.productUom}</span>
                        )}
                      </td>
                      {(currentStatus === 'Draft' || isNew) && (
                        <td>
                          <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                            <TrashIco />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default TransferDetailPage
