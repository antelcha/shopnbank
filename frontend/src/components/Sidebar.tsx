import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Building2, Send, ShoppingBag, Receipt, LogOut } from 'lucide-react'

const Sidebar = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Accounts', path: '/accounts', icon: Building2 },
        { name: 'Transfer', path: '/transfer', icon: Send },
        { name: 'Products', path: '/products', icon: ShoppingBag },
        { name: 'Purchase History', path: '/purchases', icon: Receipt },
    ]

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    return (
        <div className="hidden md:flex md:flex-col md:w-64 md:min-h-screen md:border-r md:border-white/20" style={{ backgroundColor: 'rgb(5, 5, 5)' }}>
            {/* Logo Placeholder */}
            <div className="p-6 border-b border-white/20">
                <div className="w-full  h-12 rounded-xl flex items-center">
                    <span className="text-gray-200 px-4 text-3xl text-left font-semibold" style={{ fontFamily: 'Lyon Display, serif' }}>Shop'n'Bank</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <button
                                onClick={() => navigate(item.path)}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-all flex items-center space-x-3 text-sm ${
                                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                                        ? 'bg-white/10 text-gray-100'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                }`}
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/20">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center space-x-3 text-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}

export default Sidebar