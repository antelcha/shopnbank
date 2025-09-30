import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Building2, Send, ShoppingBag, MoreHorizontal, LogOut, History } from 'lucide-react'

const BottomNav = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [showMoreMenu, setShowMoreMenu] = useState(false)

    const menuItems = [
        { name: 'Home', path: '/dashboard', icon: Home },
        { name: 'Accounts', path: '/accounts', icon: Building2 },
        { name: 'Transfer', path: '/transfer', icon: Send },
        { name: 'Shop', path: '/products', icon: ShoppingBag },
    ]

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
            {/* More Menu Dropdown */}
            {showMoreMenu && (
                <div
                    className="absolute bottom-20 right-4 rounded-2xl border border-white/20 p-2 mb-2"
                    style={{
                        backgroundColor: 'rgba(18, 18, 18, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)'
                    }}
                >
                    <button
                        onClick={() => {
                            setShowMoreMenu(false)
                            navigate('/purchases')
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
                    >
                        <History size={20} color="white" />
                        <span className="text-white text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Purchase History
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            setShowMoreMenu(false)
                            handleLogout()
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
                    >
                        <LogOut size={20} color="white" />
                        <span className="text-white text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Logout
                        </span>
                    </button>
                </div>
            )}

            {/* Bottom Navigation */}
            <div
                className="rounded-2xl border border-white/20 p-2"
                style={{
                    backgroundColor: 'rgba(18, 18, 18, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                }}
            >
                <div className="flex items-center justify-around">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => {
                                setShowMoreMenu(false)
                                navigate(item.path)
                            }}
                            className={`flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
                                location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                                    ? 'bg-white/10'
                                    : 'hover:bg-white/5'
                            }`}
                        >
                            <item.icon
                                size={24}
                                color="white"
                                fill={location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? "white" : "transparent"}
                            />
                        </button>
                    ))}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className={`flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
                            showMoreMenu ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                    >
                        <MoreHorizontal size={24} color="white" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BottomNav