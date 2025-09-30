import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/Login'
import RegisterPage from './pages/auth/Register'
import ProtectedRoute from './components/ProtectedRoute'
import TokenValidator from './components/TokenValidator'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import Transfer from './pages/Transfer'
import Products from './pages/Products'
import PurchaseHistory from './pages/PurchaseHistory'

const App = () => {
  return (
    <Router>
      <TokenValidator>
        <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
           <Dashboard />
        </ProtectedRoute>
      } />
        <Route path="/accounts" element={
          <ProtectedRoute>
            <Accounts />
          </ProtectedRoute>
        } />
        <Route path="/accounts/:accountId" element={
          <ProtectedRoute>
            <AccountDetail />
          </ProtectedRoute>
        } />
        <Route path="/transfer" element={
          <ProtectedRoute>
            <Transfer />
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } />
        <Route path="/purchases" element={
          <ProtectedRoute>
            <PurchaseHistory />
          </ProtectedRoute>
        } />

        </Routes>
      </TokenValidator>
    </Router>
  )
}

export default App
