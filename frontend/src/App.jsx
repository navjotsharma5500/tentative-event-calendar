import React from 'react'
import { Routes, Route } from 'react-router-dom'
import PublicPage from './pages/PublicPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
