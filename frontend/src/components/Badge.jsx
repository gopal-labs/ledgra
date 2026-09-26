import React from 'react'

const STATUS_CONFIG = {
  Draft:     { cls: 'badge-draft',     dot: 'dot-draft'    },
  Waiting:   { cls: 'badge-waiting',   dot: 'dot-waiting'  },
  Ready:     { cls: 'badge-ready',     dot: 'dot-ready'    },
  Done:      { cls: 'badge-done',      dot: 'dot-done'     },
  Cancelled: { cls: 'badge-cancelled', dot: 'dot-cancelled'},
}

/**
 * Status Badge component
 * @param {'Draft'|'Waiting'|'Ready'|'Done'|'Cancelled'} status
 * @param {boolean} showDot
 */
const Badge = ({ status, showDot = true, className = '' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Draft']
  return (
    <span className={`badge ${config.cls} ${className}`}>
      {showDot && <span className={`status-dot ${config.dot}`} />}
      {status}
    </span>
  )
}

export default Badge
