import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getProfile } from '../services/authService'
import { X, AlertCircle } from 'lucide-react'

interface TokenValidatorProps {
  children: React.ReactNode
}

const TokenValidator: React.FC<TokenValidatorProps> = ({ children }) => {
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Sadece protected route'larda token kontrolü yap
    const publicPaths = ['/login', '/register']
    if (publicPaths.includes(location.pathname)) {
      return
    }

    const validateToken = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setShowModal(true)
        return
      }

      try {
        const response = await getProfile()

        if (!response.ok) {
          // Token geçersiz veya expired
          setShowModal(true)
        }
      } catch (error) {
        // Network error veya token invalid
        setShowModal(true)
      }
    }

    validateToken()
  }, [location.pathname])

  const handleLoginRedirect = () => {
    localStorage.removeItem('token')
    setShowModal(false)
    navigate('/login')
  }

  return (
    <>
      {children}

      {/* Token Expired Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-md border border-white/20">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                  Session Expired
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-white/80 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                Your session has expired or is invalid. Please log in again to continue.
              </p>

              <button
                onClick={handleLoginRedirect}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TokenValidator