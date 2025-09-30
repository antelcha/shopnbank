import React from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'rgb(5, 5, 5)' }}>
      {/* Sidebar - Desktop Only */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  )
}

export default Layout