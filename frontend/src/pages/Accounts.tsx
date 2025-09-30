import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getAccounts, createAccount, type Account } from '../services/accountService'
import { generateGradients } from '../utils/gradientGenerator'
import { Building2, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Accounts = () => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cardGradients, setCardGradients] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setCardGradients(generateGradients(accounts.length))
    }
  }, [accounts])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await getAccounts()
      const data = await response.json()
      
      if (response.ok) {
        setAccounts(data)
      } else {
        setError(data.message || 'Failed to fetch accounts')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = (balanceInCents: number) => {
    const balanceInTRY = balanceInCents / 100
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balanceInTRY)
  }

  const formatAccountId = (id: string) => {
    return id.replace(/(.{4})/g, '$1 ').trim()
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return

    try {
      setIsCreating(true)
      const response = await createAccount({ account_name: accountName })
      
      if (response.ok) {
        setShowModal(false)
        setAccountName('')
        fetchAccounts() // Refresh accounts list
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to create account')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
          Bank Accounts
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold"
        >
          <Plus size={20} />
          New Account
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Loading accounts...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
        </div>
      )}

      {!loading && !error && accounts && accounts.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-white/40 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Lyon Display, serif' }}>
            No accounts found
          </h3>
          <p className="text-white/60 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create your first account to get started
          </p>
          <button className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold">
            Create Account
          </button>
        </div>
      )}

      {!loading && !error && accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account, index) => (
            <div
              key={account.id}
              className="rounded-3xl p-6 relative overflow-hidden cursor-pointer transition-all duration-300"
              style={{ background: cardGradients[index] || 'rgb(18, 18, 18)' }}
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="grain-overlay"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <Building2 size={24} color="white" />
                  <span className="text-white/60 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {account.account_name}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Lyon Display, serif' }}>
                  {formatAccountId(account.id)}
                </h3>
                
                <div className="mb-4">
                  <p className="text-white/60 text-sm mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Balance
                  </p>
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                    {formatBalance(account.balance)}
                  </p>
                </div>
                
                <div className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Created {new Date(account.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                Create New Account
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., Savings Account"
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-transparent border border-gray-600 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !accountName.trim()}
                  className="flex-1 py-3 px-4 bg-white text-black rounded-xl hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Accounts