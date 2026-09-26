import React from 'react'

/**
 * Reusable Card component
 */
const Card = ({ children, className = '', clickable = false, ...props }) => {
  return (
    <div
      className={`ledgra-card ${clickable ? 'ledgra-card-clickable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${className}`}
    style={{ borderColor: 'var(--border-subtle)' }}>
    {children}
  </div>
)

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>{children}</div>
)

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-5 py-3 border-t flex items-center justify-between gap-3 ${className}`}
    style={{ borderColor: 'var(--border-subtle)' }}>
    {children}
  </div>
)

export default Card
