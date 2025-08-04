"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import {
  Home,
  Bell,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  BarChart3,
  Shield,
  User,
} from "lucide-react"
import LOGOKPP from "../../assets/BgWeb.png"

const Sidebar = () => {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

 const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Reminders", href: "/reminders", icon: Bell },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "E-Sign", href: "/esign", icon: Shield },
]

// Hanya admin dan kpho_monitoring yang bisa lihat menu ini
if (["admin", "kpho_monitoring"].includes(user?.role_name)) {
  navigation.push(
    { name: "Send Reminder", href: "/reminders/send", icon: MessageSquare },
    { name: "Send Reminder Schedule", href: "/reminders/schedule", icon: MessageSquare }
  )
}

// Admin panel khusus admin
if (user?.role_name === "admin") {
  navigation.push({ name: "Admin Panel", href: "/admin", icon: Users })
}


 

  const handleLogout = async () => {
    await logout()
    setIsMobileMenuOpen(false)
  }

  const NavItem = ({ item, mobile = false }) => {
    const isActive = location.pathname === item.href
    const baseClasses = mobile
      ? "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200"
      : "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"

    const activeClasses = isActive
      ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"

    return (
      <Link
        to={item.href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <item.icon className="h-5 w-5 mr-3" />
        {item.name}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md border border-gray-200 text-gray-600 hover:text-gray-900"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0  bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-16 px-4 ">
            {/* <h1 className="text-xl font-bold text-white">KPP SI PRIMA</h1>
             */}
             <img src={LOGOKPP} className="mx-auto h-40  mb-4 w-full" alt="" />
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || "User"}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role_name || "Role"} • {user?.position || "Position"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/profile"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 mb-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings className="h-5 w-5 mr-3" />
              Profile Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
