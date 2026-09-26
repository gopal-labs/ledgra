import React, { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import Button from '../components/Button'
import Input from '../components/Input'
import { warehouseApi } from '../api'

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
const WarehouseIco = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const BLANK = { name: '', shortCode: '', address: '' }

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalErr, setGlobalErr] = useState('')
  const [success, setSuccess] = useState('')

  const fetch = async () => {
    setLoading(true)
    try { const r = await warehouseApi.getAll(); setWarehouses(r.data.data) }
    catch { setWarehouses([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: k === 'shortCode' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
    setGlobalErr(''); setSuccess('')
  }

  const startEdit = (wh) => {
    setEditId(wh._id)
    setForm({ name: wh.name, shortCode: wh.shortCode, address: wh.address || '' })
    setErrors({}); setGlobalErr(''); setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const cancelEdit = () => { setEditId(null); setForm(BLANK); setErrors({}); setGlobalErr(''); setSuccess('') }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Warehouse name is required'
    if (!form.shortCode.trim()) e.shortCode = 'Short code is required'
    else if (form.shortCode.length > 6) e.shortCode = 'Max 6 characters'
    return e
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    setSaving(true); setGlobalErr(''); setSuccess('')
    try {
      if (editId) {
        await warehouseApi.update(editId, form)
        setSuccess('Warehouse updated successfully')
      } else {
        await warehouseApi.create(form)
        setSuccess('Warehouse created successfully')
      }
      cancelEdit(); fetch()
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete warehouse "${name}"? This cannot be undone.`)) return
    try { await warehouseApi.delete(id); fetch() }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  return (
    <AppLayout title="Warehouse Settings">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Warehouses</h1>
            <p className="page-subtitle">Configure your warehouse locations</p>
          </div>
        </div>

        {/* Form */}
        <div className="ledgra-card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            {editId ? 'Edit Warehouse' : 'Add New Warehouse'}
          </div>
          {globalErr && <div className="alert-error" style={{ marginBottom: 14 }}>{globalErr}</div>}
          {success && <div className="alert-success" style={{ marginBottom: 14 }}>{success}</div>}
          <form onSubmit={handleSave} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr', gap: 14, alignItems: 'start' }}>
              <Input label="Warehouse Name *" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Main Warehouse" error={errors.name} />
              <Input label="Short Code *" value={form.shortCode} onChange={e => set('shortCode', e.target.value)}
                placeholder="e.g. WH" error={errors.shortCode}
                hint="Used in references" />
              <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Warehouse address (optional)" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              {editId && <Button type="button" variant="ghost" onClick={cancelEdit}>Cancel</Button>}
              <Button type="submit" variant="primary" loading={saving}>
                {editId ? 'Save Changes' : 'Add Warehouse'}
              </Button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="ledgra-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 14, fontWeight: 600 }}>
            All Warehouses ({warehouses.length})
          </div>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
          ) : warehouses.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <WarehouseIco />
              <div style={{ marginTop: 12, fontSize: 13 }}>No warehouses yet. Add your first one above.</div>
            </div>
          ) : (
            warehouses.map((wh, i) => (
              <div key={wh._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < warehouses.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: editId === wh._id ? 'var(--accent-light)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, background: 'var(--bg-elevated)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 12, color: 'var(--accent)',
                    border: '1px solid var(--border-default)',
                    fontFamily: 'monospace',
                  }}>{wh.shortCode}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{wh.name}</div>
                    {wh.address && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{wh.address}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ledgra-btn ledgra-btn-ghost" style={{ padding: '6px 10px' }} onClick={() => startEdit(wh)}><EditIco /></button>
                  <button className="ledgra-btn ledgra-btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(wh._id, wh.name)}><TrashIco /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default WarehousePage
