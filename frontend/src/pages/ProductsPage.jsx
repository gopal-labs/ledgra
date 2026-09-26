import React, { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Input from '../components/Input'
import { productApi, categoryApi, warehouseApi, locationApi } from '../api'

/* ─── Inline Icons ─────────────────────────────── */
const Ico = ({ d, size = 16, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d}
  </svg>
)
const SearchIco = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const PlusIco = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const EditIco = () => <Ico d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
const TrashIco = () => <Ico d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>} />
const ChevIco = () => <Ico d={<polyline points="6 9 12 15 18 9"/>} />
const BoxIco = ({ size=40 }) => <Ico size={size} d={<><path d="M12 2l9 4.9V17L12 22l-9-5.1V7z"/><polyline points="12 22 12 12"/><line x1="21" y1="7" x2="12" y2="12"/><line x1="3" y1="7" x2="12" y2="12"/></>} />
const TagIco = () => <Ico d={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>} />

const UOM_OPTIONS = ['pcs', 'kg', 'g', 'box', 'ltr', 'm', 'cm', 'pair', 'set', 'dozen']

/* ─── Category Manager Modal ──────────────────── */
const CategoryManagerModal = ({ isOpen, onClose, categories, onRefresh }) => {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startEdit = (cat) => { setEditId(cat._id); setName(cat.name); setDesc(cat.description || '') }
  const resetForm = () => { setEditId(null); setName(''); setDesc(''); setError('') }

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true); setError('')
    try {
      if (editId) {
        await categoryApi.update(editId, { name: name.trim(), description: desc })
      } else {
        await categoryApi.create({ name: name.trim(), description: desc })
      }
      resetForm(); onRefresh()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try { await categoryApi.delete(id); onRefresh() }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose() }} title="Manage Categories" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div className="alert-error">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="ledgra-input" placeholder="Category name" value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            style={{ flex: 1 }}
          />
          <input
            className="ledgra-input" placeholder="Description (optional)" value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ flex: 1.5 }}
          />
          <Button variant="primary" onClick={handleSave} loading={loading} style={{ whiteSpace: 'nowrap' }}>
            {editId ? 'Update' : 'Add'}
          </Button>
          {editId && <Button variant="ghost" onClick={resetForm}>Cancel</Button>}
        </div>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {categories.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>
              No categories yet
            </div>
          )}
          {categories.map(cat => (
            <div key={cat._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 8, marginBottom: 4,
              background: editId === cat._id ? 'var(--accent-light)' : 'var(--bg-elevated)',
              border: `1px solid ${editId === cat._id ? 'var(--accent)' : 'var(--border-subtle)'}`,
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{cat.name}</div>
                {cat.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="ledgra-btn ledgra-btn-ghost" style={{ padding: '4px 8px' }}
                  onClick={() => startEdit(cat)}><EditIco /></button>
                <button className="ledgra-btn ledgra-btn-danger" style={{ padding: '4px 8px' }}
                  onClick={() => handleDelete(cat._id)}><TrashIco /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/* ─── Stock Detail Modal ──────────────────────── */
const StockDetailModal = ({ product, isOpen, onClose }) => {
  const [stockData, setStockData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !product) return
    setLoading(true)
    productApi.getStock(product._id)
      .then(r => setStockData(r.data.data))
      .catch(() => setStockData([]))
      .finally(() => setLoading(false))
  }, [isOpen, product])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stock — ${product?.name}`} size="md">
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner spinner-dark" /></div>
      ) : stockData.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32, fontSize: 13 }}>
          No stock entries for this product yet.
        </div>
      ) : (
        <div className="ledgra-table-container">
          <table className="ledgra-table">
            <thead>
              <tr>
                <th>Warehouse</th><th>Location</th>
                <th style={{ textAlign: 'right' }}>On Hand</th>
                <th style={{ textAlign: 'right' }}>Reserved</th>
                <th style={{ textAlign: 'right' }}>Free to Use</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((sl, i) => (
                <tr key={i}>
                  <td>{sl.warehouse?.name || '—'}</td>
                  <td>{sl.location?.name || '—'} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sl.location?.shortCode}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{sl.quantityOnHand}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{sl.quantityReserved}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: sl.quantityFree > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {sl.quantityFree}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

/* ─── Product Form Modal ──────────────────────── */
const ProductFormModal = ({ isOpen, onClose, editProduct, categories, warehouses, locations, onSaved, onManageCategories }) => {
  const blank = { name: '', sku: '', category: '', uom: 'pcs', costPrice: '', reorderPoint: 10, initialStock: '', locationId: '', warehouseId: '' }
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalErr, setGlobalErr] = useState('')
  const isEdit = !!editProduct

  useEffect(() => {
    if (isOpen) {
      if (editProduct) {
        setForm({
          name: editProduct.name || '',
          sku: editProduct.sku || '',
          category: editProduct.category?._id || editProduct.category || '',
          uom: editProduct.uom || 'pcs',
          costPrice: editProduct.costPrice ?? '',
          reorderPoint: editProduct.reorderPoint ?? 10,
          initialStock: '', locationId: '', warehouseId: '',
        })
      } else {
        setForm(blank)
      }
      setErrors({}); setGlobalErr('')
    }
  }, [isOpen, editProduct])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })) }

  const filteredLocations = form.warehouseId
    ? locations.filter(l => l.warehouse?._id === form.warehouseId || l.warehouse === form.warehouseId)
    : locations

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.sku.trim()) e.sku = 'Required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    setLoading(true); setGlobalErr('')
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category || null,
        uom: form.uom,
        costPrice: Number(form.costPrice) || 0,
        reorderPoint: Number(form.reorderPoint) || 10,
        ...(!isEdit && form.initialStock ? {
          initialStock: Number(form.initialStock),
          locationId: form.locationId,
          warehouseId: form.warehouseId,
        } : {}),
      }
      if (isEdit) {
        await productApi.update(editProduct._id, payload)
      } else {
        await productApi.create(payload)
      }
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed'
      if (msg.toLowerCase().includes('sku')) setErrors(er => ({ ...er, sku: msg }))
      else setGlobalErr(msg)
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit Product — ${editProduct?.name}` : 'New Product'} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        {globalErr && <div className="alert-error" style={{ marginBottom: 16 }}>{globalErr}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Product Name *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="e.g. Steel Rod 10mm" />
          <Input label="SKU / Code *" value={form.sku} onChange={e => set('sku', e.target.value.toUpperCase())} error={errors.sku} placeholder="e.g. SR-10MM" />

          {/* Category with manage link */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Category</label>
              <button type="button" onClick={onManageCategories}
                style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Manage
              </button>
            </div>
            <select className="ledgra-input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">— None —</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unit of Measure</label>
            <select className="ledgra-input" value={form.uom} onChange={e => set('uom', e.target.value)}>
              {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <Input label="Per Unit Cost (₹)" type="number" min="0" step="0.01" value={form.costPrice}
            onChange={e => set('costPrice', e.target.value)} placeholder="0.00" />
          <Input label="Reorder Point" type="number" min="0" value={form.reorderPoint}
            onChange={e => set('reorderPoint', e.target.value)} placeholder="10"
            hint="Alert threshold for low stock" />
        </div>

        {/* Initial stock (new only) */}
        {!isEdit && (
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Initial Stock (optional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Input label="Quantity" type="number" min="0" value={form.initialStock}
                onChange={e => set('initialStock', e.target.value)} placeholder="0" />
              <div className="form-group">
                <label className="form-label">Warehouse</label>
                <select className="ledgra-input" value={form.warehouseId}
                  onChange={e => { set('warehouseId', e.target.value); set('locationId', '') }}>
                  <option value="">— Select —</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <select className="ledgra-input" value={form.locationId} onChange={e => set('locationId', e.target.value)}>
                  <option value="">— Select —</option>
                  {filteredLocations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Main Products Page ──────────────────────── */
const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [categories, setCategories] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [stockProduct, setStockProduct] = useState(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)

  const searchRef = useRef(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productApi.getAll({ search: search || undefined })
      setProducts(res.data.data)
      setTotal(res.data.total)
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }, [search])

  const fetchMeta = async () => {
    const [cats, whs, locs] = await Promise.all([
      categoryApi.getAll().then(r => r.data.data).catch(() => []),
      warehouseApi.getAll().then(r => r.data.data).catch(() => []),
      locationApi.getAll().then(r => r.data.data).catch(() => []),
    ])
    setCategories(cats); setWarehouses(whs); setLocations(locs)
  }

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { fetchMeta() }, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return
    try { await productApi.delete(id); fetchProducts() }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  const openNew = () => { setEditProduct(null); setModalOpen(true) }
  const openEdit = (p) => { setEditProduct(p); setModalOpen(true) }
  const openStock = (p) => { setStockProduct(p); setStockModalOpen(true) }

  const handleSaved = () => { setModalOpen(false); fetchProducts() }
  const handleCatRefresh = () => { fetchMeta() }

  const getCatName = (cat) => {
    if (!cat) return '—'
    if (typeof cat === 'object') return cat.name
    return categories.find(c => c._id === cat)?.name || '—'
  }

  return (
    <AppLayout title="Products">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} product{total !== 1 ? 's' : ''} in catalog</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Search toggle */}
          <div style={{ position: 'relative' }}>
            {showSearch ? (
              <input
                ref={searchRef}
                className="ledgra-input"
                placeholder="Search name or SKU…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onBlur={() => { if (!search) setShowSearch(false) }}
                autoFocus
                style={{ width: 220, paddingLeft: 36 }}
              />
            ) : null}
            <button
              onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50) }}
              className="ledgra-btn ledgra-btn-secondary"
              style={{ padding: '8px 10px', position: showSearch ? 'absolute' : 'static', left: 8, top: '50%', transform: showSearch ? 'translateY(-50%)' : 'none', background: 'none', border: 'none', color: 'var(--text-muted)' }}
            >
              <SearchIco />
            </button>
          </div>
          <Button variant="secondary" icon={<TagIco />} onClick={() => setCatModalOpen(true)}>
            Categories
          </Button>
          <Button variant="primary" icon={<PlusIco />} onClick={openNew} id="new-product-btn">
            New Product
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="ledgra-table-container">
        <table className="ledgra-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>UOM</th>
              <th style={{ textAlign: 'right' }}>Per Unit Cost</th>
              <th style={{ textAlign: 'right' }}>On Hand</th>
              <th style={{ textAlign: 'right' }}>Free to Use</th>
              <th style={{ textAlign: 'right' }}>Reorder Point</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <span className="spinner spinner-dark" style={{ display: 'inline-block', marginRight: 8 }} />Loading…
              </td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <BoxIco size={36} />
                  <span>No products found. <button onClick={openNew} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Add your first product</button></span>
                </div>
              </td></tr>
            ) : (
              products.map(p => {
                const isLow = p.totalOnHand <= p.reorderPoint && p.totalOnHand > 0
                const isOut = p.totalOnHand === 0
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{getCatName(p.category)}</td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.uom}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>₹{(p.costPrice || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--text-primary)', cursor: 'pointer' }}
                        onClick={() => openStock(p)}>
                        {p.totalOnHand ?? 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: p.totalFree > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {p.totalFree ?? 0}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13 }}>{p.reorderPoint}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="ledgra-btn ledgra-btn-ghost" style={{ padding: '5px 8px' }} onClick={() => openEdit(p)} title="Edit"><EditIco /></button>
                        <button className="ledgra-btn ledgra-btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(p._id, p.name)} title="Delete"><TrashIco /></button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editProduct={editProduct}
        categories={categories}
        warehouses={warehouses}
        locations={locations}
        onSaved={handleSaved}
        onManageCategories={() => { setModalOpen(false); setCatModalOpen(true) }}
      />
      <CategoryManagerModal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        categories={categories}
        onRefresh={handleCatRefresh}
      />
      <StockDetailModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        product={stockProduct}
      />
    </AppLayout>
  )
}

export default ProductsPage
