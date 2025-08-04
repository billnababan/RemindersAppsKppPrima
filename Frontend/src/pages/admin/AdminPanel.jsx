"use client"
import { useState, useEffect } from "react"
import api from "../../services/api"
import {
  Users,
  UserPlus,
  Settings,
  BarChart3,
  Send,
  Trash2,
  Edit,
  Key,
  X,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
} from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [userModal, setUserModal] = useState(false)
  const [broadcastModal, setBroadcastModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    full_name: "",
    role_id: "",
    position: "",
    department: "",
    is_active: true,
  })
  // console.log("data yg dinput", userForm.username)
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",  
    priority: "medium",
    recipient_role_id: "",
    due_date: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, rolesRes, statsRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
        api.get("/stats"),
      ])
      setUsers(usersRes.data.users || [])
      setRoles(rolesRes.data.roles || [])
      setStats(statsRes.data || {})
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
      toast.error("Failed to fetch admin data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
     const response = await api.post("/users", userForm)
     console.log("ddddd", response.data)
    if(response.data && response.data.success) {
 toast.success("User created successfully!")
      setUserModal(false)
      resetUserForm()
      fetchData()
    }
     
    } catch (error) {
      const message = error.response?.data?.error || "Failed to create user"
      toast.error(message)
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/users/${selectedUser.id}`, userForm)
      toast.success("User updated successfully!")
      setUserModal(false)
      resetUserForm()
      fetchData()
    } catch (error) {
      const message = error.response?.data?.error || "Failed to update user"
      toast.error(message)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }
    try {
      await api.delete(`/users/${userId}`)
      toast.success("User deleted successfully!")
      fetchData()
    } catch (error) {
      const message = error.response?.data?.error || "Failed to delete user"
      toast.error(message)
    }
  }

  const handleResetPassword = async (userId) => {
    const newPassword = prompt("Enter new password for this user:")
    if (!newPassword) return
    try {
      await api.post(`/users/${userId}/reset-password`, {
        new_password: newPassword,
      })
      toast.success("Password reset successfully!")
    } catch (error) {
      const message = error.response?.data?.error || "Failed to reset password"
      toast.error(message)
    }
  }

  const handleBroadcastReminder = async (e) => {
    e.preventDefault()
    try {
      await api.post("/broadcast-reminder", broadcastForm)
      toast.success("Reminder broadcast successfully!")
      setBroadcastModal(false)
      setBroadcastForm({
        title: "",
        message: "",
        priority: "medium",
        recipient_role_id: "",
        due_date: "",
      })
    } catch (error) {
      const message = error.response?.data?.error || "Failed to broadcast reminder"
      toast.error(message)
    }
  }

  const openUserModal = (user = null) => {
    if (user) {
      setSelectedUser(user)
      setUserForm({
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        password: "",
        full_name: user.full_name,
        role_id: user.role_id || "",
        position: user.position || "",
        department: user.department || "",
        is_active: user.is_active,
      })
    } else {
      setSelectedUser(null)
      resetUserForm()
    }
    setUserModal(true)
  }

  const resetUserForm = () => {
    setUserForm({
      username: "",
      email: "",
      phone_number: "",
      password: "",
      full_name: "",
      role_id: "",
      position: "",
      department: "",
      is_active: true,
    })
    setSelectedUser(null)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || user.role_id === filterRole
    return matchesSearch && matchesRole
  })

  const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 group">
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        }}
      ></div>
      <div className="relative p-4 lg:p-8">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className={`p-2 lg:p-4 rounded-xl lg:rounded-2xl shadow-lg`} style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-6 w-6 lg:h-8 lg:w-8" style={{ color }} />
          </div>
          {trend && (
            <div
              className={`flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-bold ${
                trend.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-1 lg:mr-2 ${trend.positive ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              {trend.value}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xs lg:text-sm font-semibold text-gray-600 mb-1 lg:mb-2">{title}</h3>
          <p className="text-2xl lg:text-4xl font-bold text-gray-900 mb-1 lg:mb-2">{value}</p>
          {description && <p className="text-xs lg:text-sm text-gray-500">{description}</p>}
        </div>
      </div>
    </div>
  )

  const UserRow = ({ user }) => (
    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm lg:text-lg">
                {user.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 rounded-full border-2 border-white shadow-sm ${
                user.is_active ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
          </div>
          <div className="ml-2 lg:ml-4">
            <div className="text-xs lg:text-sm font-semibold text-gray-900 truncate max-w-[120px] lg:max-w-none">
              {user.full_name}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[120px] lg:max-w-none">@{user.username}</div>
          </div>
        </div>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <div className="text-xs lg:text-sm text-gray-900 truncate max-w-[150px] lg:max-w-none">{user.email}</div>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Shield className="w-3 h-3 mr-1" />
          <span className="hidden lg:inline">{user.role_name}</span>
          <span className="lg:hidden">{user.role_name?.substring(0, 3)}</span>
        </span>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 hidden lg:table-cell">
        {user.position || "-"}
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${
            user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {user.is_active ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              <span className="hidden lg:inline">Active</span>
              <span className="lg:hidden">✓</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 mr-1" />
              <span className="hidden lg:inline">Inactive</span>
              <span className="lg:hidden">✗</span>
            </>
          )}
        </span>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 hidden lg:table-cell">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {user.last_login ? format(new Date(user.last_login), "MMM dd, yyyy") : "Never"}
        </div>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-1 lg:space-x-2">
          <button
            onClick={() => openUserModal(user)}
            className="p-1 lg:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg lg:rounded-xl transition-all duration-300 hover:scale-110"
            title="Edit user"
          >
            <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
          </button>
          <button
            onClick={() => handleResetPassword(user.id)}
            className="p-1 lg:p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-lg lg:rounded-xl transition-all duration-300 hover:scale-110"
            title="Reset password"
          >
            <Key className="h-3 w-3 lg:h-4 lg:w-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(user.id)}
            className="p-1 lg:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg lg:rounded-xl transition-all duration-300 hover:scale-110"
            title="Delete user"
          >
            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
          </button>
        </div>
      </td>
    </tr>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 lg:h-16 lg:w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-semibold text-sm lg:text-base">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-8 space-y-4 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
            <div className="h-12 w-12 lg:h-16 lg:w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-2xl">
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-sm lg:text-lg text-gray-600">Manage users, roles, and system settings</p>
            </div>
          </div>
        </div>
        {/* <div className="flex items-center justify-center lg:justify-end">
          <button
            onClick={() => setBroadcastModal(true)}
            className="flex items-center px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl lg:rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold text-sm lg:text-base"
          >
            <Send className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
            Broadcast Reminder
          </button>
        </div> */}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          title="Total Users"
          value={stats.users?.total_users || 0}
          icon={Users}
          color="#3B82F6"
          trend={{ positive: true, value: "+12%" }}
          description="All registered users"
        />
        <StatCard
          title="Active Users"
          value={stats.users?.active_users || 0}
          icon={CheckCircle}
          color="#10B981"
          trend={{ positive: true, value: "+8%" }}
          description="Currently active users"
        />
        <StatCard
          title="Total Reminders"
          value={stats.reminders?.total_reminders || 0}
          icon={BarChart3}
          color="#8B5CF6"
          trend={{ positive: true, value: "+23%" }}
          description="All time reminders"
        />
        <StatCard
          title="System Health"
          value="98.5%"
          icon={Settings}
          color="#F59E0B"
          trend={{ positive: true, value: "+2%" }}
          description="Uptime percentage"
        />
      </div>

      {/* Main Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <nav className="flex space-x-4 lg:space-x-8 px-4 lg:px-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 lg:py-6 px-2 border-b-4 font-semibold text-xs lg:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-xl lg:rounded-t-2xl"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4 lg:w-5 lg:h-5 inline mr-2" />
              Users Management
            </button>
            {/* <button
              onClick={() => setActiveTab("roles")}
              className={`py-4 lg:py-6 px-2 border-b-4 font-semibold text-xs lg:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === "roles"
                  ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-xl lg:rounded-t-2xl"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 inline mr-2" />
              Roles & Permissions
            </button> */}
          </nav>
        </div>
        <div className="p-4 lg:p-8">
          {activeTab === "users" && (
            <div>
              {/* Users Header */}
              <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6 mb-6 lg:mb-8">
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Users Management</h3>
                  <p className="text-sm lg:text-base text-gray-600">Manage user accounts and permissions</p>
                </div>
                <button
                  onClick={() => openUserModal()}
                  className="flex items-center justify-center px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl lg:rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold text-sm lg:text-base"
                >
                  <UserPlus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  Add User
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6 lg:mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="pl-10 lg:pl-12 pr-8 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                  >
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-hidden rounded-xl lg:rounded-2xl border-2 border-gray-200 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                          Position
                        </th>
                        <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                          Last Login
                        </th>
                        <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <UserRow key={user.id} user={user} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 lg:py-16">
                  <Users className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-4" />
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-sm lg:text-base text-gray-500">
                    {searchTerm || filterRole
                      ? "Try adjusting your search or filter criteria."
                      : "Get started by creating a new user."}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "roles" && (
            <div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 lg:mb-8">Roles & Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 border-2 border-gray-200 hover:shadow-2xl transition-all duration-500 hover:scale-105"
                  >
                    <div className="flex items-center mb-4 lg:mb-6">
                      <div className="p-3 lg:p-4 bg-blue-100 rounded-xl lg:rounded-2xl shadow-lg">
                        <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                      </div>
                      <div className="ml-3 lg:ml-4">
                        <h4 className="text-lg lg:text-xl font-bold text-gray-900">{role.name}</h4>
                        <p className="text-xs lg:text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(role.permissions || "[]").map((permission, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            {permission.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced User Modal */}
     {userModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div
        className="fixed inset-0 transition-opacity from-blue-900/20 via-purple-900/20 to-pink-900/20 backdrop-blur-sm"
        onClick={() => setUserModal(false)}
      ></div>
      <div className="inline-block w-full max-w-sm lg:max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl lg:rounded-3xl border border-white/50">
        <div className="relative">
          <div className="absolute inset-0"></div>
          <div className="relative px-4 lg:px-8 py-4 lg:py-6 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="p-2 lg:p-3 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                  <UserPlus className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg lg:text-2xl font-bold text-white">
                    {selectedUser ? "Edit User" : "Create New User"}
                  </h3>
                  <p className="text-xs lg:text-base text-blue-100">
                    {selectedUser ? "Update user information and settings" : "Add a new user to the system"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl lg:rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <X className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
        <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser} className="p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Username *</label>
              <input
                type="text"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Email *</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                required
              />
            </div>

            {/* Phone Number field - hanya muncul saat edit */}
            {selectedUser && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={userForm.phone_number}
                  onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                  placeholder="Contoh: +62812345678"
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                />
              </div>
            )}

            <div className="lg:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-gray-700">Full Name *</label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Password {selectedUser ? "(leave blank to keep current)" : "*"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 pr-10 lg:pr-12 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                  required={!selectedUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 lg:pr-4 flex items-center hover:scale-110 transition-transform duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Role *</label>
              <select
                value={userForm.role_id}
                onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Position</label>
              <input
                type="text"
                value={userForm.position}
                onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Department</label>
              <input
                type="text"
                value={userForm.department}
                onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Status</label>
              <select
                value={userForm.is_active}
                onChange={(e) => setUserForm({ ...userForm, is_active: e.target.value === "true" })}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row justify-end space-y-3 lg:space-y-0 lg:space-x-4 pt-6 lg:pt-8 mt-6 lg:mt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setUserModal(false)}
              className="px-6 lg:px-8 py-2 lg:py-3 border-2 border-gray-300 text-gray-700 rounded-xl lg:rounded-2xl hover:bg-gray-50 transition-all duration-300 font-semibold text-sm lg:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 lg:px-8 py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl lg:rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold text-sm lg:text-base"
            >
              {selectedUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}  

      {/* Enhanced Broadcast Modal */}
      {broadcastModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity  from-purple-900/20 via-pink-900/20 to-orange-900/20 backdrop-blur-sm"
              onClick={() => setBroadcastModal(false)}
            ></div>
            <div className="inline-block w-full max-w-sm lg:max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl lg:rounded-3xl border border-white/50">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>
                <div className="relative px-4 lg:px-8 py-4 lg:py-6 bg-gradient-to-r from-purple-500 to-pink-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <div className="p-2 lg:p-3 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                        <Send className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg lg:text-2xl font-bold text-white">Broadcast Reminder</h3>
                        <p className="text-xs lg:text-base text-purple-100">Send a reminder to multiple users</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setBroadcastModal(false)}
                      className="p-2 hover:bg-white/20 rounded-xl lg:rounded-2xl transition-all duration-300 hover:scale-110"
                    >
                      <X className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <form onSubmit={handleBroadcastReminder} className="p-4 lg:p-8 space-y-4 lg:space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Title *</label>
                  <input
                    type="text"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-sm lg:text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Message *</label>
                  <textarea
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 resize-none text-sm lg:text-base"
                    rows="4"
                    required
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Priority</label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-sm lg:text-base"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Recipient Role *</label>
                  <select
                    value={broadcastForm.recipient_role_id}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, recipient_role_id: e.target.value })}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-sm lg:text-base"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Due Date</label>
                  <input
                    type="datetime-local"
                    value={broadcastForm.due_date}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, due_date: e.target.value })}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-sm lg:text-base"
                  />
                </div>
                <div className="flex flex-col lg:flex-row justify-end space-y-3 lg:space-y-0 lg:space-x-4 pt-6 lg:pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setBroadcastModal(false)}
                    className="px-6 lg:px-8 py-2 lg:py-3 border-2 border-gray-300 text-gray-700 rounded-xl lg:rounded-2xl hover:bg-gray-50 transition-all duration-300 font-semibold text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 lg:px-8 py-2 lg:py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl lg:rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold text-sm lg:text-base"
                  >
                    Broadcast
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
