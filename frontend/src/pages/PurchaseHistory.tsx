import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getPurchaseHistory, type Transaction } from '../services/purchaseService'
import { getProductById, type Product } from '../services/productService'
import { getAccounts } from '../services/accountService'
import { ShoppingBag, Calendar, Package, CreditCard, ArrowRight } from 'lucide-react'

interface PurchaseWithDetails extends Transaction {
  product?: Product
  account_name?: string
}

const PurchaseHistory = () => {
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [myAccounts, setMyAccounts] = useState<any[]>([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Accounts ve purchase history'yi paralel fetch et
      const [accountsResponse, purchaseResponse] = await Promise.all([
        getAccounts(),
        getPurchaseHistory()
      ])
      
      let accountsData = []
      if (accountsResponse.ok) {
        accountsData = await accountsResponse.json()
        setMyAccounts(accountsData)
      }
      
      if (purchaseResponse.ok) {
        const transactionsData = await purchaseResponse.json()
        
        // Eğer transaction listesi boşsa, boş array set et
        if (!transactionsData || transactionsData.length === 0) {
          setPurchases([])
          return
        }
        
        // Her transaction için product bilgilerini getir
        const purchasesWithDetails = await Promise.all(
          transactionsData.map(async (transaction: Transaction) => {
            try {
              // Product bilgilerini getir
              const productResponse = await getProductById(transaction.product_id)
              let product: Product | undefined
              if (productResponse.ok) {
                product = await productResponse.json()
              }

              // Account name'i accountsData'dan bul
              console.log('Transaction account_id:', transaction.account_id)
              console.log('AccountsData:', accountsData.map(acc => ({ id: acc.id, name: acc.account_name })))
              const account = accountsData.find(acc => acc.id === transaction.account_id)
              const account_name = account?.account_name
              console.log('Found account:', account_name)

              return {
                ...transaction,
                product,
                account_name
              }
            } catch (err) {
              console.error('Error fetching details for transaction:', transaction.id, err)
              return transaction
            }
          })
        )

        // Tarihe göre sırala (en yeni önce)
        purchasesWithDetails.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setPurchases(purchasesWithDetails)
      } else {
        setError('Failed to fetch purchase history')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }


  const formatPrice = (priceInCents: number) => {
    const priceInTRY = priceInCents / 100
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(priceInTRY)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Layout>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Lyon Display, serif' }}>
        Purchase History
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
        <div className="max-w-4xl">
          {!purchases || purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-white/40" />
              </div>
              <p className="text-white/60 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                No purchases yet
              </p>
              <p className="text-white/40" style={{ fontFamily: 'Inter, sans-serif' }}>
                Your purchase history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-6 bg-gray-800/50 border border-white/10 rounded-xl hover:bg-gray-800/70 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <Package size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {purchase.product?.name || 'Unknown Product'}
                        </h3>
                        <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {purchase.product?.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-xl" style={{ fontFamily: 'Lyon Display, serif' }}>
                        {formatPrice(purchase.total_amount)}
                      </p>
                      <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {purchase.quantity} × {formatPrice(purchase.unit_price)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-white/40" />
                      <span className="text-white/80 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatDate(purchase.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-white/40" />
                      <span className="text-white/80 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {purchase.account_name || 'Unknown Account'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-white/40" />
                      <span className="text-white/80 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Quantity: {purchase.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

export default PurchaseHistory