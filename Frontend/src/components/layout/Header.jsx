"use client"
import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import api from "../../services/api" // Import the API instance
import toast from "react-hot-toast" // Assuming toast is available for notifications
import { Search, Bell, User, LogOut, ChevronDown, MessageSquare } from "lucide-react"

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState([]) // State for dynamic notifications
  const [loadingNotifications, setLoadingNotifications] = useState(true) // Loading state for notifications

  const { user, logout } = useAuthStore()
  const profileMenuRef = useRef(null)
  const notificationRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch notifications when component mounts or user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoadingNotifications(false)
        return
      }
      try {
        setLoadingNotifications(true)
        const response = await api.get("/notifications") // Call the new backend endpoint
        console.log("Fetched notifications:", response.data.notifications)
        setNotifications(response.data.notifications)
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
        toast.error("Failed to load notifications.")
        setNotifications([]) // Clear notifications on error
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()
  }, [user]) // Re-fetch if user object changes (e.g., after login)

  const handleLogout = async () => {
    await logout()
    setIsProfileMenuOpen(false)
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Side - Logo/Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-xl font-bold text-gray-900">KPP SI PRIMA</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 px-4 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                name="search"
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="ml-4 flex items-center md:ml-6">
            {/* WhatsApp Status */}
            <div className="flex items-center space-x-2 mr-4">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">WhatsApp Connected</span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Notifications</p>
                    <p className="text-xs text-gray-500">{unreadCount} unread</p>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-2 text-sm text-gray-700">Loading notifications...</div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={notification.link || "#"} // Assuming notifications might have a link
                          className="flex items-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsNotificationOpen(false)}
                        >
                          <div className="flex-shrink-0 mr-3">
                            {notification.unread && <span className="block h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-xs text-gray-500">{notification.message}</p>
                            <p className="text-xs text-gray-400">{notification.time}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-700">No new notifications.</div>
                    )}
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="px-4 py-2">
                    <Link
                      to="/reminders" // Link to a dedicated notifications page
                      className="block text-center text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => setIsNotificationOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative ml-3" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-3 p-2 text-sm rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">{user?.role_name}</div>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    {/* <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link> */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
