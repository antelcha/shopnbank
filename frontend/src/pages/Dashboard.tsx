import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { generateGradients } from '../utils/gradientGenerator'
import { Building2, Send, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'


const Dashboard = () => {
    const [cardGradients, setCardGradients] = useState<string[]>([])

    useEffect(() => {
        // Generate 4 gradients: 1 for welcome card + 3 for action cards
        setCardGradients(generateGradients(4))
    }, [])

    const extractGradientColors = (gradient: string) => {
        // Extract colors from gradient string
        const colorMatches = gradient.match(/#[a-fA-F0-9]{6}/g)
        return colorMatches ? colorMatches[0] : '#ffffff'
    }

    const createGlowShadow = (gradient: string) => {
        const color = extractGradientColors(gradient)
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : {r: 255, g: 255, b: 255}
        }
        
        const rgb = hexToRgb(color)
        return `
            0 0 0 1px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2),
            0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4),
            0 0 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3),
            0 0 80px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)
        `
    }

    const navigate = useNavigate();

    return (
        <Layout>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Lyon Display, serif' }}>
                Dashboard
            </h1>
                    
                    {/* Welcome Card */}
                    <div className="rounded-3xl p-6 md:p-8 bg-gray-800/30 border border-white/10 mb-8">
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Lyon Display, serif' }}>
                            Welcome to Shop'n'Bank!
                        </h2>
                        <p className="text-white/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Manage your accounts, transfer money, and shop with ease.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Lyon Display, serif' }}>
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <div 
                                className="rounded-3xl p-6 cursor-pointer relative overflow-hidden transition-all duration-300"
                                style={{ background: cardGradients[1] || 'rgb(18, 18, 18)' }}
                                onMouseEnter={(e) => {
                                    if (cardGradients[1]) {
                                        e.currentTarget.style.boxShadow = createGlowShadow(cardGradients[1])
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div className="absolute inset-0 bg-black/20" ></div>
                                <div className="grain-overlay"></div>
                                <div className="relative z-10" onClick={() => navigate("/accounts")}>
                                    <div className="mb-3">
                                        <Building2 size={24} color="white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2"
                                    
                                    style={{ fontFamily: 'Lyon Display, serif' }}>
                                        Bank Accounts
                                    </h3>
                                    <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        View and manage your accounts
                                    </p>
                                </div>
                            </div>

                            <div 
                                className="rounded-3xl p-6 cursor-pointer relative overflow-hidden transition-all duration-300"
                                style={{ background: cardGradients[2] || 'rgb(18, 18, 18)' }}
                                onMouseEnter={(e) => {
                                    if (cardGradients[2]) {
                                        e.currentTarget.style.boxShadow = createGlowShadow(cardGradients[2])
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div className="absolute inset-0 bg-black/20" ></div>
                                <div className="grain-overlay" ></div>
                                <div className="relative z-10" onClick={() => navigate("/transfer")}>
                                    <div className="mb-3">
                                        <Send size={24} color="white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2"
                                    
                                    style={{ fontFamily: 'Lyon Display, serif' }}>
                                        Transfer Money
                                    </h3>
                                    <p className="text-white/70 text-sm" 
                                    
                                    style={{ fontFamily: 'Inter, sans-serif' }}>
                                        Send money to other users
                                    </p>
                                </div>
                            </div>

                            <div 
                                className="rounded-3xl p-6 cursor-pointer relative overflow-hidden transition-all duration-300"
                                style={{ background: cardGradients[3] || 'rgb(18, 18, 18)' }}
                                onMouseEnter={(e) => {
                                    if (cardGradients[3]) {
                                        e.currentTarget.style.boxShadow = createGlowShadow(cardGradients[3])
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                                onClick={() => navigate("/products")}
                            >
                                
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="grain-overlay"></div>
                                <div className="relative z-10">
                                    <div className="mb-3">
                                        <ShoppingBag size={24} color="white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Lyon Display, serif' }}>
                                        Shop Products
                                    </h3>
                                    <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        Browse and purchase items
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
        </Layout>
    )
}

export default Dashboard