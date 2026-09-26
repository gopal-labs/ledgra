import React, { forwardRef } from 'react'

/**
 * Reusable Input component
 */
const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  rightElement,
  className = '',
  containerClass = '',
  ...props
}, ref) => {
  return (
    <div className={`form-group ${containerClass}`}>
      {label && <label className="form-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          ref={ref}
          className={`ledgra-input ${icon ? 'input-with-icon' : ''} ${error ? 'border-red-500' : ''} ${className}`}
          style={error ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(248, 113, 113, 0.12)' } : {}}
          {...props}
        />
        {rightElement && <span className="input-right-icon">{rightElement}</span>}
      </div>
      {error && (
        <div className="form-error">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
      {hint && !error && <div className="form-error" style={{ color: 'var(--text-muted)' }}>{hint}</div>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
