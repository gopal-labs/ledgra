import React, { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import Button from '../components/Button'
import Input from '../components/Input'
import { locationApi, warehouseApi } from '../api'

const EditIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
const PinIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const BLANK = { name: '', shortCode: '', warehouse: '' }

const LocationsPage = () => {
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalErr, setGlobalErr] = useState('')
  const [success, setSuccess] = useState('')
  const [filterWH, setFilterWH] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    const [locs, whs] = await Promise.all([
      locationApi.getAll().then(r => r.data.data).catch(() => []),
      warehouseApi.getAll().then(r => r.data.data).catch(() => []),
    ])
    setLocations(locs); setWarehouses(whs); setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: k === 'shortCode' ? v.toUpperCase().replace(/[^A-Z0-9-]/g, '') : v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
    setGlobalErr(''); setSuccess('')
  }

  const startEdit = (loc) => {
    setEditId(loc._id)
    setForm({ name: loc.name, shortCode: loc.shortCode, warehouse: loc.warehouse?._id || loc.warehouse || '' })
    setErrors({}); setGlobalErr(''); setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const cancelEdit = () => { setEditId(null); setForm(BLANK); setErrors({}); setGlobalErr(''); setSuccess('') }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Location name is required'
    if (!form.shortCode.trim()) e.shortCode = 'Short code is required'
    if (!form.warehouse) e.warehouse = 'Warehouse is required'
    return e
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    setSaving(true); setGlobalErr(''); setSuccess('')
    try {
      if (editId) {
        await locationApi.update(editId, form)
        setSuccess('Location updated')
      } else {
        await locationApi.create(form)
        setSuccess('Location created')
      }
      cancelEdit(); fetchAll()
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate location "${name}"?`)) return
    try { await locationApi.delete(id); fetchAll() }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  const displayedLocations = filterWH
    ? locations.filter(l => l.warehouse?._id === filterWH || l.warehouse === filterWH)
    : locations

  return (
    <AppLayout title="Location Settings">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Locations</h1>
            <p className="page-subtitle">Sub-areas within warehouses (racks, rooms, bins)</p>
          </div>
        </div>

        {/* Form */}
        <div className="ledgra-card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            {editId ? 'Edit Location' : 'Add New Location'}
          </div>
          {globalErr && <div className="alert-error" style={{ marginBottom: 14 }}>{globalErr}</div>}
          {success && <div className="alert-success" style={{ marginBottom: 14 }}>{success}</div>}
          {warehouses.length === 0 && (
            <div className="alert-error" style={{ marginBottom: 14 }}>
              No warehouses found. <a href="/settings/warehouse" style={{ color: 'var(--accent)' }}>Create a warehouse first</a>.
            </div>
          )}
          <form onSubmit={handleSave} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr', gap: 14, alignItems: 'start' }}>
              <Input label="Location Name *" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Rack A, Production Floor" error={errors.name} />
              <Input label="Short Code *" value={form.shortCode} onChange={e => set('shortCode', e.target.value)}
                placeholder="e.g. RACK-A" error={errors.shortCode} />
              <div className="form-group">
                <label className="form-label">Warehouse *</label>
                <select className="ledgra-input"
                  value={form.warehouse}
                  onChange={e => set('warehouse', e.target.value)}
                  style={errors.warehouse ? { borderColor: 'var(--danger)' } : {}}>
                  <option value="">— Select Warehouse —</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.shortCode})</option>)}
                </select>
                {errors.warehouse && <div className="form-error">{errors.warehouse}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              {editId && <Button type="button" variant="ghost" onClick={cancelEdit}>Cancel</Button>}
              <Button type="submit" variant="primary" loading={saving}>
                {editId ? 'Save Changes' : 'Add Location'}
              </Button>
            </div>
          </form>
        </div>

        {/* Filter + List */}
        <div className="ledgra-card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
          }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>All Locations ({displayedLocations.length})</span>
            <select className="filter-select" value={filterWH} onChange={e => setFilterWH(e.target.value)}>
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
          ) : displayedLocations.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <PinIco />
              <div style={{ marginTop: 10 }}>No locations yet. Add your first one above.</div>
            </div>
          ) : (
            displayedLocations.map((loc, i) => (
              <div key={loc._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 20px',
                borderBottom: i < displayedLocations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: editId === loc._id ? 'var(--accent-light)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, background: 'var(--bg-elevated)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    <PinIco />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{loc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 4 }}>{loc.shortCode}</span>
                      <span>·</span>
                      <span>{loc.warehouse?.name || '—'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ledgra-btn ledgra-btn-ghost" style={{ padding: '6px 10px' }} onClick={() => startEdit(loc)}><EditIco /></button>
                  <button className="ledgra-btn ledgra-btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(loc._id, loc.name)}><TrashIco /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default LocationsPage
