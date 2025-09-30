import { post, get } from "./api"

export const register = (
    username: string, 
    email: string, 
    password: string, 
    full_name:string) => {
        
        return post('/auth/register', {
            username,
            email,
            password,
            full_name
        })
}

export const login = (
    email: string,
    password: string
) => {
    return post('/auth/login', {
        email,
        password
    })
}

export const getProfile = () => {
    return get('/profile') 
}