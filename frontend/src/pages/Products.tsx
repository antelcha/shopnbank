import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getProducts, createProduct, type Product, type CreateProductRequest } from '../services/productService'
import { getAccounts, type Account } from '../services/accountService'
import { purchaseProduct } from '../services/purchaseService'
import { getProfile } from '../services/authService'
import { ShoppingCart, Package, Star, CreditCard, X, CheckCircle, AlertCircle, Plus } from 'lucide-react'

const Products = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [myAccounts, setMyAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Purchase modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [quantityInput, setQuantityInput] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [modalError, setModalError] = useState('')
  
  // Add product modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [newProduct, setNewProduct] = useState<CreateProductRequest>({
    name: '',
    description: '',
    price: 0,
    stock: 0
  })
  const [priceInput, setPriceInput] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [addProductError, setAddProductError] = useState('')
  
  // Success modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [purchaseDetails, setPurchaseDetails] = useState<{
    product: Product
    account: Account
    quantity: number
    totalAmount: number
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Profile, products ve accounts'ı paralel olarak fetch et
      const [profileResponse, productsResponse, accountsResponse] = await Promise.all([
        getProfile(),
        getProducts(),
        getAccounts()
      ])
      
      // Check if user is admin
      if (profileResponse.ok) {
        const userData = await profileResponse.json()
        setIsAdmin(userData.role === 'admin')
      }
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData)
      } else {
        setError('Failed to fetch products')
      }
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        setMyAccounts(accountsData)
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const openPurchaseModal = (product: Product) => {
    setSelectedProduct(product)
    setShowPurchaseModal(true)
    setQuantity(1)
    setQuantityInput('')
    setModalError('')
    setSelectedAccount(null)
  }

  const closePurchaseModal = () => {
    setShowPurchaseModal(false)
    setSelectedProduct(null)
    setSelectedAccount(null)
    setQuantity(1)
    setQuantityInput('')
    setModalError('')
  }

  const closeSuccessModal = () => {
    setShowSuccessModal(false)
    setPurchaseDetails(null)
  }

  const openAddProductModal = () => {
    setShowAddProductModal(true)
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      stock: 0
    })
    setPriceInput('')
    setStockInput('')
    setAddProductError('')
  }

  const closeAddProductModal = () => {
    setShowAddProductModal(false)
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      stock: 0
    })
    setPriceInput('')
    setStockInput('')
    setAddProductError('')
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

  const handleCreateProduct = async () => {
    const price = parseFloat(priceInput) || 0
    const stock = parseInt(stockInput) || 0
    
    if (!newProduct.name.trim() || !newProduct.description.trim() || price <= 0 || stock <= 0) {
      setAddProductError('Please fill all fields with valid values')
      return
    }

    try {
      setIsCreatingProduct(true)
      setAddProductError('')
      
      // Convert price to cents
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: Math.round(price * 100),
        stock: stock
      }
      
      const response = await createProduct(productData)
      
      if (response.ok) {
        // Product başarıyla oluşturuldu
        closeAddProductModal()
        
        // Products listesini yenile
        fetchData()
      } else {
        const data = await response.json()
        setAddProductError(data.message || 'Failed to create product')
      }
    } catch (err) {
      setAddProductError('Network error occurred')
    } finally {
      setIsCreatingProduct(false)
    }
  }

  const handlePurchase = async () => {
    const qty = parseInt(quantityInput) || 1
    
    if (!selectedProduct || !selectedAccount || qty <= 0) {
      setModalError('Please select an account and valid quantity')
      return
    }

    if (qty > selectedProduct.stock) {
      setModalError('Not enough stock available')
      return
    }

    const totalAmount = selectedProduct.price * qty
    if (selectedAccount.balance < totalAmount) {
      setModalError('Insufficient balance')
      return
    }

    try {
      setIsPurchasing(true)
      setModalError('')
      
      const response = await purchaseProduct({
        account_id: selectedAccount.id,
        product_id: selectedProduct.id,
        quantity: qty
      })
      
      if (response.ok) {
        // Purchase başarılı - detayları kaydet
        setPurchaseDetails({
          product: selectedProduct,
          account: selectedAccount,
          quantity: qty,
          totalAmount: totalAmount
        })
        
        // Purchase modalini kapat ve success modalini aç
        setShowPurchaseModal(false)
        setShowSuccessModal(true)
        
        // Products ve accounts'ı yenile
        fetchData()
      } else {
        const data = await response.json()
        setModalError(data.message || 'Purchase failed')
      }
    } catch (err) {
      setModalError('Network error occurred')
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
          Shop Products
        </h1>
        
        {isAdmin && (
          <button
            onClick={openAddProductModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Plus size={20} />
            Add Product
          </button>
        )}
      </div>

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
        <div className="max-w-6xl">
          {!products || products.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-white/40" />
              </div>
              <p className="text-white/60 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                No products available
              </p>
              <p className="text-white/40" style={{ fontFamily: 'Inter, sans-serif' }}>
                Products will appear here when available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 md:p-6 bg-gray-800/50 border border-white/10 rounded-xl hover:bg-gray-800/70 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-blue-400 md:hidden" />
                      <Package size={20} className="text-blue-400 hidden md:block" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base md:text-lg truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {product.name}
                      </h3>
                      <p className="text-white/60 text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Stock: {product.stock}
                      </p>
                    </div>
                  </div>

                  <p className="text-white/80 text-xs md:text-sm mb-4 md:mb-6 line-clamp-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {product.description}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="font-bold text-white text-lg md:text-xl" style={{ fontFamily: 'Lyon Display, serif' }}>
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => openPurchaseModal(product)}
                      disabled={product.stock <= 0}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-medium text-xs sm:text-sm w-full sm:w-auto"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <ShoppingCart size={14} />
                      <span className="truncate">
                        {product.stock <= 0 ? 'Out of Stock' : 'Buy'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-md border border-white/20">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                Purchase Product
              </h2>
              <button 
                onClick={closePurchaseModal}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {modalError && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{modalError}</p>
                </div>
              )}

              {/* Product Info */}
              <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                <h3 className="font-semibold text-white text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedProduct.name}
                </h3>
                <p className="text-white/60 text-sm mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedProduct.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>Price:</span>
                  <span className="font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                    {formatPrice(selectedProduct.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>Available:</span>
                  <span className="text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedProduct.stock} units
                  </span>
                </div>
              </div>

              {/* Account Selection */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Select Account
                </h4>
                {!myAccounts || myAccounts.length === 0 ? (
                  <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                    No accounts available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                          selectedAccount?.id === account.id
                            ? 'bg-blue-600/20 border-blue-500/50'
                            : 'bg-gray-800/50 border-white/10 hover:bg-gray-800/70'
                        }`}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {account.account_name}
                          </span>
                          <span className="text-white/80 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatPrice(account.balance)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  placeholder="1"
                  min="1"
                  max={selectedProduct.stock}
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Total */}
              {selectedAccount && (
                <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>Total:</span>
                    <span className="font-bold text-white text-lg" style={{ fontFamily: 'Lyon Display, serif' }}>
                      {formatPrice(selectedProduct.price * (parseInt(quantityInput) || 1))}
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closePurchaseModal}
                  className="flex-1 py-3 px-4 bg-transparent border border-gray-600 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={isPurchasing || !selectedAccount}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {isPurchasing ? 'Purchasing...' : 'Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && purchaseDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-md border border-white/20">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              
              {/* Success Message */}
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Lyon Display, serif' }}>
                Purchase Successful!
              </h2>
              <p className="text-white/60 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Your purchase has been completed successfully
              </p>
              
              {/* Purchase Details */}
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6 text-left">
                <h3 className="text-base font-semibold text-white mb-4" style={{ fontFamily: 'Lyon Display, serif' }}>
                  Purchase Details
                </h3>
                
                <div className="space-y-3">
                  {/* Product */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Product:</span>
                    <span className="font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {purchaseDetails.product.name}
                    </span>
                  </div>
                  
                  {/* Quantity */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Quantity:</span>
                    <span className="text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {purchaseDetails.quantity}
                    </span>
                  </div>
                  
                  {/* Unit Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Unit Price:</span>
                    <span className="text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {formatPrice(purchaseDetails.product.price)}
                    </span>
                  </div>
                  
                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>Total:</span>
                    <span className="font-bold text-white text-lg" style={{ fontFamily: 'Lyon Display, serif' }}>
                      {formatPrice(purchaseDetails.totalAmount)}
                    </span>
                  </div>
                  
                  {/* Account */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>From Account:</span>
                    <span className="text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {purchaseDetails.account.account_name}
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

      {/* Add Product Modal (Admin Only) */}
      {showAddProductModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-md border border-white/20">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Lyon Display, serif' }}>
                Add New Product
              </h2>
              <button 
                onClick={closeAddProductModal}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {addProductError && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{addProductError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>

                {/* Product Description */}
                <div>
                  <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Price (TRY)
                  </label>
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-white/80 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeAddProductModal}
                  className="flex-1 py-3 px-4 bg-transparent border border-gray-600 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateProduct}
                  disabled={isCreatingProduct}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {isCreatingProduct ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Products