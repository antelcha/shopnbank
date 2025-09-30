import { get, post } from './api'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  created_at: string
}

export interface CreateProductRequest {
  name: string
  description: string
  price: number
  stock: number
}

export const getProducts = (): Promise<Response> => {
  return get('/products')
}

export const getProductById = (productId: string): Promise<Response> => {
  return get(`/products/${productId}`)
}

export const createProduct = (productData: CreateProductRequest): Promise<Response> => {
  return post('/products', productData)
}