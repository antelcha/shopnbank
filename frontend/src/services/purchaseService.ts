import { get, post } from './api'

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_amount: number
  transaction_type: string
  created_at: string
}

export interface PurchaseRequest {
  account_id: string
  product_id: string
  quantity: number
}

export const getPurchaseHistory = (): Promise<Response> => {
  return get('/purchases')
}

export const purchaseProduct = (purchaseData: PurchaseRequest): Promise<Response> => {
  return post('/purchase', purchaseData)
}