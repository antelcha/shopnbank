import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getUsers, type User } from '../services/userService'
import { getAccounts, getAccountsByUserId, transferMoney, type Account } from '../services/accountService'
import { getProfile } from '../services/authService'
import { Users, ArrowRight, X, Building2, Send, CheckCircle } from 'lucide-react'

const Transfer = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Transfer modal states
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userAccounts, setUserAccounts] = useState<Account[]>([])
  const [myAccounts, setMyAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [selectedFromAccount, setSelectedFromAccount] = useState<Account | null>(null)
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(null)
  const [transferAmount, setTransferAmount] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  
  // Success modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [transferDetails, setTransferDetails] = useState<{
    fromAccount: Account
    toAccount: Account
    toUser: User
    amount: string
  } | null>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await getProfile()
      if (response.ok) {
        const userData = await response.json()
        setCurrentUserId(userData.id)
        fetchUsers(userData.id)
        fetchMyAccounts()
      } else {
        setError('Failed to fetch profile')
      }
    } catch (err) {
      setError('Network error occurred')
      setLoading(false)
    }
  }

  const fetchUsers = async (excludeUserId: string) => {
    try {
      setLoading(true)
      const response = await getUsers()
      
      if (response.ok) {
        const usersData = await response.json()

        // Handle null or undefined
        if (!usersData) {
          setUsers([])
          return
        }

        // Mevcut kullanıcıyı listeden çıkar
        const filteredUsers = usersData.filter((user: User) => user.id !== excludeUserId)
        setUsers(filteredUsers)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      console.error('Fetch users error:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyAccounts = async () => {
    try {
      const response = await getAccounts()
      if (response.ok) {
        const accountsData = await response.json()
        setMyAccounts(accountsData)
      }
    } catch (err) {
      console.error('Failed to fetch my accounts:', err)
    }
  }

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user)
    setShowTransferModal(true)
    setLoadingAccounts(true)
    setModalError('') // Modal error temizle
    
    try {
      const response = await getAccountsByUserId(user.id)
      if (response.ok) {
        const accountsData = await response.json()
        setUserAccounts(accountsData)
      } else {
        setModalError('Failed to fetch user accounts')
      }
    } catch (err) {
      setModalError('Network error occurred')
    } finally {
      setLoadingAccounts(false)
    }
  }

  const closeModal = () => {
    setShowTransferModal(false)
    setSelectedUser(null)
    setUserAccounts([])
    setSelectedFromAccount(null)
    setSelectedToAccount(null)
    setTransferAmount('')
    setModalError('')
  }

  const closeSuccessModal = () => {
    setShowSuccessModal(false)
    setTransferDetails(null)
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

  const createAccountGlow = (isSelected: boolean) => {
    if (isSelected) {
      return {
        boxShadow: `
          0 0 0 1px rgba(59, 130, 246, 0.5),
          0 0 20px rgba(59, 130, 246, 0.4),
          0 0 40px rgba(59, 130, 246, 0.3),
          0 0 80px rgba(59, 130, 246, 0.2)
        `
      }
    }
    return {}
  }

  const createToAccountGlow = (isSelected: boolean) => {
    if (isSelected) {
      return {
        boxShadow: `
          0 0 0 1px rgba(34, 197, 94, 0.5),
          0 0 20px rgba(34, 197, 94, 0.4),
          0 0 40px rgba(34, 197, 94, 0.3),
          0 0 80px rgba(34, 197, 94, 0.2)
        `
      }
    }
    return {}
  }

  const handleTransfer = async () => {
    if (!selectedFromAccount || !selectedToAccount || !transferAmount.trim()) {
      setModalError('Please fill all required fields')
      return
    }

    const amountInTRY = parseFloat(transferAmount)
    if (amountInTRY <= 0) {
      setModalError('Amount must be greater than 0')
      return
    }

    if (selectedFromAccount.balance < amountInTRY * 100) {
      setModalError('Insufficient balance')
      return
    }

    const amountInCents = Math.round(amountInTRY * 100)

    try {
      setIsTransferring(true)
      setModalError('')
      
      const response = await transferMoney({
        from_account_id: selectedFromAccount.id,
        to_account_id: selectedToAccount.id,
        amount: amountInCents
      })
      
      if (response.ok) {
        // Transfer başarılı - detayları kaydet
        setTransferDetails({
          fromAccount: selectedFromAccount,
          toAccount: selectedToAccount,
          toUser: selectedUser!,
          amount: transferAmount
        })
        
        // Transfer modalini kapat ve success modalini aç
        setShowTransferModal(false)
        setShowSuccessModal(true)
        
        // Form state'ini temizle
        setSelectedFromAccount(null)
        setSelectedToAccount(null)
        setTransferAmount('')
        
        // Hesapları yenile
        fetchMyAccounts()
      } else {
        const data = await response.json()
        setModalError(data.message || 'Transfer failed')
      }
    } catch (err) {
      setModalError('Network error occurred')
    } finally {
      setIsTransferring(false)
    }
  }


  return (
    <Layout>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Lyon Display, serif' }}>
        Transfer Money
      </h1>

      {loading && (
        <div className="text-center py-12">
          <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Loading...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Lyon Display, serif' }}>
            <Users size={20} />
            Send to User
          </h2>
          
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-white/40" />
              </div>
              <p className="text-white/60 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                No other users available
              </p>
              <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                There are no other users to transfer money to
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 bg-gray-800/50 border border-white/10 rounded-xl hover:bg-gray-800/70 transition-all cursor-pointer group"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {user.full_name}
                      </h3>
                      <p className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        @{user.username}
                      </p>
                      <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {user.email}
                      </p>
                    </div>
                    <ArrowRight size={20} className="text-white/40 group-hover:text-white/80 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-2xl h-[80vh] border border-white/20 flex flex-col">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                Transfer to {selectedUser.full_name}
              </h2>
              <button 
                onClick={closeModal}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Account Selection */}
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Lyon Display, serif' }}>
                  <Building2 size={18} />
                  From My Account
                </h3>
                
                {!myAccounts || myAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                      No accounts found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAccounts && myAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                          selectedFromAccount?.id === account.id
                            ? 'bg-blue-600/20 border-blue-500/50'
                            : 'bg-gray-800/50 border-white/10 hover:bg-gray-800/70'
                        }`}
                        style={createAccountGlow(selectedFromAccount?.id === account.id)}
                        onClick={() => setSelectedFromAccount(account)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {account.account_name}
                            </h4>
                            <p className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatAccountId(account.id)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white text-sm" style={{ fontFamily: 'Lyon Display, serif' }}>
                              {formatBalance(account.balance)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* To Account Selection */}
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Lyon Display, serif' }}>
                  <Send size={18} />
                  To {selectedUser.username}'s Account
                </h3>
                
                {loadingAccounts ? (
                  <div className="text-center py-8">
                    <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Loading accounts...</p>
                  </div>
                ) : !userAccounts || userAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                      User has no accounts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userAccounts && userAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                          selectedToAccount?.id === account.id
                            ? 'bg-green-600/20 border-green-500/50'
                            : 'bg-gray-800/50 border-white/10 hover:bg-gray-800/70'
                        }`}
                        style={createToAccountGlow(selectedToAccount?.id === account.id)}
                        onClick={() => setSelectedToAccount(account)}
                      >
                        <div>
                          <h4 className="font-semibold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {account.account_name}
                          </h4>
                          <p className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatAccountId(account.id)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>

              {/* Transfer Form */}
              {selectedFromAccount && selectedToAccount && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  {modalError && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                      <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{modalError}</p>
                    </div>
                  )}
                  
                  <h3 className="text-base font-bold text-white mb-4" style={{ fontFamily: 'Lyon Display, serif' }}>
                    Transfer Details
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Amount (TRY)
                    </label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="100.50"
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3 px-4 bg-transparent border border-gray-600 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleTransfer}
                      disabled={isTransferring || !transferAmount.trim()}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {isTransferring ? 'Transferring...' : 'Transfer Money'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && transferDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-md border border-white/20">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              
              {/* Success Message */}
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Lyon Display, serif' }}>
                Transfer Successful!
              </h2>
              <p className="text-white/60 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Your money has been transferred successfully
              </p>
              
              {/* Transfer Details */}
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 text-left">
                <h3 className="text-base font-semibold text-white mb-4" style={{ fontFamily: 'Lyon Display, serif' }}>
                  Transaction Details
                </h3>
                
                <div className="space-y-3">
                  {/* Amount */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Amount:</span>
                    <span className="font-bold text-white text-lg" style={{ fontFamily: 'Lyon Display, serif' }}>
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(parseFloat(transferDetails.amount))}
                    </span>
                  </div>
                  
                  {/* From Account */}
                  <div className="flex justify-between items-start">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>From:</span>
                    <div className="text-right">
                      <div className="font-semibold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {transferDetails.fromAccount.account_name}
                      </div>
                      <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatAccountId(transferDetails.fromAccount.id)}
                      </div>
                    </div>
                  </div>
                  
                  {/* To Account */}
                  <div className="flex justify-between items-start">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>To:</span>
                    <div className="text-right">
                      <div className="font-semibold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {transferDetails.toUser.full_name}
                      </div>
                      <div className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {transferDetails.toAccount.account_name}
                      </div>
                      <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatAccountId(transferDetails.toAccount.id)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Time:</span>
                    <span className="text-white/80 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {new Date().toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={closeSuccessModal}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Transfer