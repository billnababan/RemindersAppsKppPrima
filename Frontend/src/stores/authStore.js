import { create } from "zustand"
import { persist } from "zustand/middleware"
import api from "../services/api"
import toast from "react-hot-toast"

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (credentials) => {
        try {
          const response = await api.post("/login", credentials)
          const { token, data } = response.data

          // Set token in API headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          set({
            user: data,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          toast.success(`Welcome back, ${data.full_name}!`)
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || "Login failed"
          toast.error(message)
          return { success: false, error: message }
        }
      },

      logout: async () => {
        try {
          await api.post("/logout")
        } catch (error) {
          console.error("Logout error:", error)
        } finally {
          // Clear token from API headers
          delete api.defaults.headers.common["Authorization"]

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })

          toast.success("Logged out successfully")
        }
      },

      initializeAuth: async () => {
        const { token } = get()

        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          // Set token in API headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          // Verify token and get user data
          const response = await api.get("/profile")
          const { user } = response.data

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error("Auth initialization error:", error)
          // Clear invalid token
          delete api.defaults.headers.common["Authorization"]
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateProfile: async (profileData) => {
        try {
          const response = await api.put("/profile", profileData)
          const { user } = response.data

          set({ user })
          toast.success("Profile updated successfully")
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || "Profile update failed"
          toast.error(message)
          return { success: false, error: message }
        }
      },

      changePassword: async (passwordData) => {
        try {
          const response = await api.put("/change-password", passwordData)
          toast.success("Password changed successfully")
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || "Password change failed"
          toast.error(message)
          return { success: false, error: message }
        }
      },
    }),
    {
      name: "kpp-auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
