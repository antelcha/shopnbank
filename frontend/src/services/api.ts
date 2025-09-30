const baseURL : String = "http://localhost:8080"

const getToken = () =>  {
    return localStorage.getItem('token');
}

const apiRequest = (endpoint: string, options: RequestInit) => {

    let token : string | null  = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && {Authorization: `Bearer ${token}`}),
        ...options.headers
    }

    return fetch(baseURL + endpoint, {
        ...options, headers
    })

}

export const get = (endpoint: string) => {
    return apiRequest(endpoint, {method: 'GET'});
}

export const post = (endpoint: string, data:any) => {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    })
}