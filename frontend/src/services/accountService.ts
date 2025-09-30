import { get, post } from './api'

export interface Account {
  id: string
  user_id: string
  account_name: string
  balance: number
  created_at: string
}

export interface CreateAccountRequest {
  account_name: string
}

export const getAccounts = (): Promise<Response> => {
  return get('/accounts')
}

export const getAccountsByUserId = (userId: string): Promise<Response> => {
  return get(`/accounts/${userId}`)
}


export const createAccount = (accountData: CreateAccountRequest): Promise<Response> => {
  return post('/accounts', accountData)
}

export interface DepositRequest {
  account_id: string
  amount: number
}

export const depositMoney = (depositData: DepositRequest): Promise<Response> => {
  return post('/deposit', depositData)
}

export interface TransferRequest {
  from_account_id: string
  to_account_id: string
  amount: number
}

export const transferMoney = (transferData: TransferRequest): Promise<Response> => {
  return post('/transfer', transferData)
}
