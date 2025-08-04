"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, LogIn, Shield, FileText, PenTool } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import LogoApp from "../../assets/BgWeb.png"

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData)
      if (result.success) {
        navigate("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header with Logo */}
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <LogIn className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
              <Shield className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Logo Image */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 inline-block">
            <img
              src={LogoApp}
              alt="KPP Si PRIMA Logo"
              className="h-32 w-auto mx-auto"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">KPP Si PRIMA</h1>
            <p className="text-blue-600 font-medium">Priamanaya Reminder Assistant</p>
            <p className="text-sm text-gray-600">Sign in to your account to continue</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
          <div className="space-y-1 pb-6">
            <h2 className="text-xl text-center text-gray-900 font-semibold">Welcome Back</h2>
            <p className="text-center text-gray-600 text-sm">Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email or Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="Enter your email or username"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-12 px-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-4">System Features</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Document Management</p>
              </div>
              <div className="text-center">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <PenTool className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">E-Signature</p>
              </div>
              <div className="text-center">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">Secure System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">© 2024 PT. Kalimantan Prima Persada</p>
          <p className="text-xs text-gray-400">KPP Si PRIMA - Reminder Assistant System</p>
        </div>
      </div>
    </div>
  )
}

export default Login
