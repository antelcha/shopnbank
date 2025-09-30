import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useParams, useNavigate } from 'react-router-dom'
import { getAccounts, depositMoney, type Account } from '../services/accountService'
import { Building2, Plus, ArrowLeft, TrendingUp } from 'lucide-react'
import { generateGradients } from '../utils/gradientGenerator'

const AccountDetail = () => {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [cardGradient, setCardGradient] = useState('')

  useEffect(() => {
    fetchAccount()
    setCardGradient(generateGradients(1)[0])
  }, [accountId])

  const fetchAccount = async () => {
    try {
      setLoading(true)
      const response = await getAccounts()
      const data = await response.json()
      
      if (response.ok) {
        const foundAccount = data.find((acc: Account) => acc.id === accountId)
        if (foundAccount) {
          setAccount(foundAccount)
        } else {
          setError('Account not found')
        }
      } else {
        setError(data.message || 'Failed to fetch account')
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositAmount.trim() || !account) return

    const amountInTRY = parseFloat(depositAmount)
    if (amountInTRY <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    const amountInCents = Math.round(amountInTRY * 100)

    try {
      setIsDepositing(true)
      const response = await depositMoney({
        account_id: account.id,
        amount: amountInCents
      })
      
      if (response.ok) {
        setShowDepositModal(false)
        setDepositAmount('')
        fetchAccount() // Refresh account data
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to deposit money')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setIsDepositing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Loading account...</p>
        </div>
      </Layout>
    )
  }

  if (error && !account) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
          <button 
            onClick={() => navigate('/accounts')}
            className="mt-4 px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold"
          >
            Back to Accounts
          </button>
        </div>
      </Layout>
    )
  }

  if (!account) return null

  return (
    <Layout>
      <div className="mb-8">
        <button 
          onClick={() => navigate('/accounts')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span style={{ fontFamily: 'Inter, sans-serif' }}>Back to Accounts</span>
        </button>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
          Account Details
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
        </div>
      )}

      {/* Account Card */}
      <div className="mb-8">
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: cardGradient || 'rgb(18, 18, 18)' }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="grain-overlay"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <Building2 size={32} color="white" />
              <span className="text-white/60 text-lg font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                {account.account_name}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Lyon Display, serif' }}>
              {formatAccountId(account.id)}
            </h2>
            
            <div className="mb-6">
              <p className="text-white/60 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Current Balance
              </p>
              <p className="text-4xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                {formatBalance(account.balance)}
              </p>
            </div>
            
            <div className="text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
              Created {new Date(account.created_at).toLocaleDateString('tr-TR')}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowDepositModal(true)}
          className="flex items-center gap-3 p-6 bg-green-600/20 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition-all duration-300"
        >
          <Plus size={24} className="text-green-400" />
          <div className="text-left">
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
              Deposit Money
            </h3>
            <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Add money to this account
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3 p-6 bg-blue-600/20 border border-blue-500/30 rounded-xl opacity-50">
          <TrendingUp size={24} className="text-blue-400" />
          <div className="text-left">
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
              Transaction History
            </h3>
            <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                Deposit Money
              </h2>
              <button 
                onClick={() => setShowDepositModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Amount (TRY)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="100.50"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 px-4 bg-transparent border border-gray-600 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDepositing || !depositAmount.trim()}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {isDepositing ? 'Depositing...' : 'Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default AccountDetail