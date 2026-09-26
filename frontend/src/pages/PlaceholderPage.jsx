import React from 'react'
import AppLayout from '../components/AppLayout'

/**
 * Generic placeholder for pages not yet built.
 */
const PlaceholderPage = ({ title, description }) => (
  <AppLayout title={title}>
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 320, gap: 12,
      color: 'var(--text-muted)', textAlign: 'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 17V7m4 10V7m4 10V7"/>
      </svg>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
      <p style={{ fontSize: 14, maxWidth: 360 }}>
        {description || 'This section is coming in a future update. Stay tuned!'}
      </p>
    </div>
  </AppLayout>
)

export default PlaceholderPage
