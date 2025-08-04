"use client"
import React from "react"
import { createContext, useContext, useState } from "react"
import Toast from "../components/Toast"

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = "info", duration = 5000) => {
    const id = Date.now()
    const newToast = { id, message, type, duration }
    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showSuccess = (message) => addToast(message, "success")
  const showWarning = (message) => addToast(message, "warning")
  const showInfo = (message) => addToast(message, "info")
  const showWhatsApp = (message) => addToast(message, "whatsapp")

  return (
    <ToastContext.Provider value={{ addToast, showSuccess, showWarning, showInfo, showWhatsApp }}>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
