import { get } from './api'

export interface User {
  id: string
  username: string
  email: string
  full_name: string
}

export const getUsers = (): Promise<Response> => {
  return get('/users')
}