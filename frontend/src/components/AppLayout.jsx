import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

/**
 * App shell layout - Sidebar + Topbar + page content area
 */
const AppLayout = ({ children, title }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
