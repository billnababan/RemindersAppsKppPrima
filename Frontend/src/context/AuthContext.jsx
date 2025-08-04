"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get("/users")
        if (response.data && response.data.success) {
          // Handle array response from backend
          const userData = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(checkAuthStatus, 100)
    return () => clearTimeout(timeoutId)
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await api.post("/login", { email, password })

      if (response.data && response.data.success) {
        // Handle the response data structure
        const userData = response.data.data
        setUser(userData)

        if (response.data.token) {
          localStorage.setItem("token", response.data.token)
        }

        navigate("/dashboard")
        return true
      } else {
        await Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: response.data.message || "Please check your credentials and try again.",
        })
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error.response?.data?.message || "Login failed"
      await Swal.fire({
        icon: "error",
        title: "Login Error",
        text: errorMessage,
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(false)
      await api.post("/logout")
      setUser(null)
      localStorage.removeItem("token")
      navigate("/")
    } catch (error) {
      console.error("Logout error:", error)
      setUser(null)
      localStorage.removeItem("token")
      navigate("/")
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (levels) => {
    if (!user) return false
    if (Array.isArray(levels)) {
      return levels.includes(user.level)
    }
    return user.level === levels
  }

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
