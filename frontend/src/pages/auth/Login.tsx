
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/authService'


const LoginPage = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [imageUrl, setImageUrl] = useState("")

    useEffect(() => {
        setImageUrl('https://picsum.photos/1024')
    }, [])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        
        try {
            const response = await login(formData.email, formData.password);
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                navigate('/dashboard');
            } else {
                setErrorMessage(data.message || 'Login failed');
            }
        } catch (error) {
            setErrorMessage('Network error occurred');
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className="h-screen p-12 overflow-hidden" style={{ backgroundColor: 'rgb(5, 5, 5)' }}>
        <div className="h-full flex flex-col md:flex-row gap-8 md:gap-12 rounded-3xl" style={{ height: 'calc(100vh - 96px)' }}>
            
            {/* Sağ taraf - Image (Mobile'da üstte) */}
            <div className="h-[20vh] md:h-auto md:flex-1 flex items-center justify-center rounded-3xl border border-white/20 md:order-2 overflow-hidden relative" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt="Login background"
                            className="w-full h-full object-cover"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
                            }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-6">
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Lyon Display, serif' }}>
                                Shop'n'Bank
                            </h1>
                            <p className="text-white/90 text-lg md:text-xl max-w-md" style={{ fontFamily: 'Inter, sans-serif' }}>
                                bank smarter. shop better.
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-400 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Loading image...</p>
                )}
            </div>

            {/* Sol taraf - Form (Mobile'da altta) */}
            <div className="flex-1 flex items-center justify-center rounded-3xl border border-white/20 md:order-1" style={{ backgroundColor: 'rgb(18, 18, 18)' }}>
                <div className="w-full max-w-md px-6 md:px-12">
                    <h2 className="text-2xl md:text-4xl font-bold text-center text-white mb-6 md:mb-12" style={{ fontFamily: 'Lyon Display, serif' }}>Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="Email"
                        required
                        className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            />
                    <input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-white text-black rounded-xl hover:bg-gray-300 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-semibold mb-4"
                                            >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                    <button 
                        type="button"
                        onClick={() => navigate('/register')}
                        className="w-full py-3 px-4 bg-transparent border border-gray-600 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold"
                                            >
                        Sign Up
                    </button>
                    {errorMessage && <p className="text-red-400 text-center text-sm mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>{errorMessage}</p>}
                </form>
                </div>
            </div>
        </div>
    </div>
  )
}

export default LoginPage