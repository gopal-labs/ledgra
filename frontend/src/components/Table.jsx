import React from 'react'

/**
 * Reusable Table component
 * @param {Array} columns - [{ key, label, render, width }]
 * @param {Array} data - array of row objects
 * @param {boolean} loading
 * @param {string} emptyMessage
 */
const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  className = '',
}) => {
  return (
    <div className={`ledgra-table-container ${className}`}>
      <table className="ledgra-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <span className="spinner spinner-dark" style={{ display: 'inline-block', marginRight: 8 }} />
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row._id || row.id || i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
