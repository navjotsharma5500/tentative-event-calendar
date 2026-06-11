import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PublicPage from './pages/PublicPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { isTcAdminAuthenticated } from './utils/adminAuth'

function TcAdminRouteGuard() {
  return isTcAdminAuthenticated()
    ? <AdminPage />
    : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/admin/login" element={<AdminPage loginOnly />} />
      <Route path="/admin" element={<TcAdminRouteGuard />} />
    </Routes>
  )
}
