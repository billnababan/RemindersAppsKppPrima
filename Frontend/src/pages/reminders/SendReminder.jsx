"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import api from "../../services/api"
import toast from "react-hot-toast"
import {
  Send,
  Users,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Clock,
  Target,
  CheckCircle,
  Info,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react"

const SendReminder = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [recipientType, setRecipientType] = useState("user")
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      message: "",
      priority: "medium",
      recipient_id: "",
      recipient_role_id: "",
      due_date: "",
    },
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users")
      setUsers(response.data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles")
      setRoles(response.data.roles || [])
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const reminderData = {
        title: data.title,
        message: data.message,
        priority: data.priority,
        due_date: data.due_date || null,
      }

      if (recipientType === "user") {
        reminderData.recipient_id = data.recipient_id
      } else {
        reminderData.recipient_role_id = data.recipient_role_id
      }

      await api.post("/reminders", reminderData)
      toast.success("Reminder sent successfully!")
      navigate("/reminders")
    } catch (error) {
      const message = error.response?.data?.error || "Failed to send reminder"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityConfig = (priority) => {
    const configs = {
      low: {
        color: "text-green-600 bg-green-50 border-green-200",
        icon: CheckCircle,
        gradient: "from-green-500 to-emerald-600",
      },
      medium: {
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        icon: Info,
        gradient: "from-yellow-500 to-orange-600",
      },
      high: {
        color: "text-orange-600 bg-orange-50 border-orange-200",
        icon: AlertTriangle,
        gradient: "from-orange-500 to-red-600",
      },
      urgent: {
        color: "text-red-600 bg-red-50 border-red-200",
        icon: Target,
        gradient: "from-red-500 to-pink-600",
      },
    }
    return configs[priority] || configs.medium
  }

  const formData = watch()
  const priorityConfig = getPriorityConfig(formData.priority)
  const PriorityIcon = priorityConfig.icon

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-8 space-y-4 lg:space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Sparkles className="h-24 w-24 lg:h-32 lg:w-32 text-blue-600" />
        </div>
        <div className="relative">
          <div className="mx-auto h-16 w-16 lg:h-20 lg:w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-4 lg:mb-6 shadow-2xl shadow-blue-500/25 transform hover:scale-110 transition-transform duration-300">
            <Send className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Send Reminder
          </h1>
          <p className="text-sm lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Create and send a new reminder to users or roles. Your message will be delivered via WhatsApp for instant
            notification with beautiful formatting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-8">
        {/* Form */}
        <div className="xl:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-4 lg:px-8 py-4 lg:py-6 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                <h2 className="text-lg lg:text-xl font-semibold text-white">Reminder Details</h2>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 lg:p-8 space-y-4 lg:space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  {...register("title", { required: "Title is required" })}
                  className="w-full px-4 lg:px-6 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400 text-sm lg:text-base"
                  placeholder="Enter a clear and specific title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center mt-2">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                  Message *
                </label>
                <textarea
                  id="message"
                  rows={5}
                  {...register("message", { required: "Message is required" })}
                  className="w-full px-4 lg:px-6 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400 resize-none text-sm lg:text-base"
                  placeholder="Write your reminder message with actionable information"
                />
                {errors.message && (
                  <p className="text-sm text-red-600 flex items-center mt-2">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-4">
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700">
                  Priority Level
                </label>
                <select
                  id="priority"
                  {...register("priority")}
                  className="w-full px-4 lg:px-6 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 text-sm lg:text-base"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
                <div
                  className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 ${priorityConfig.color} transition-all duration-300`}
                >
                  <div className="flex items-center">
                    <PriorityIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-3" />
                    <span className="font-semibold text-sm lg:text-base">
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority Selected
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipient Type */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Send To</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <label
                    className={`relative flex items-center p-4 lg:p-6 border-2 rounded-xl lg:rounded-2xl cursor-pointer transition-all duration-300 ${
                      recipientType === "user"
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      value="user"
                      checked={recipientType === "user"}
                      onChange={(e) => setRecipientType(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`p-2 lg:p-3 rounded-lg lg:rounded-xl mr-3 lg:mr-4 ${recipientType === "user" ? "bg-blue-500" : "bg-gray-200"}`}
                    >
                      <User
                        className={`h-5 w-5 lg:h-6 lg:w-6 ${recipientType === "user" ? "text-white" : "text-gray-500"}`}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-sm lg:text-base">Specific User</span>
                      <p className="text-xs lg:text-sm text-gray-500">Send to individual user</p>
                    </div>
                    {recipientType === "user" && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                      </div>
                    )}
                  </label>
                  <label
                    className={`relative flex items-center p-4 lg:p-6 border-2 rounded-xl lg:rounded-2xl cursor-pointer transition-all duration-300 ${
                      recipientType === "role"
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      value="role"
                      checked={recipientType === "role"}
                      onChange={(e) => setRecipientType(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`p-2 lg:p-3 rounded-lg lg:rounded-xl mr-3 lg:mr-4 ${recipientType === "role" ? "bg-blue-500" : "bg-gray-200"}`}
                    >
                      <Users
                        className={`h-5 w-5 lg:h-6 lg:w-6 ${recipientType === "role" ? "text-white" : "text-gray-500"}`}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-sm lg:text-base">All Users in Role</span>
                      <p className="text-xs lg:text-sm text-gray-500">Send to entire role</p>
                    </div>
                    {recipientType === "role" && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                      </div>
                    )}
                  </label>
                </div>
                {recipientType === "user" ? (
                  <div className="space-y-2">
                    <select
                      {...register("recipient_id", { required: "Please select a user" })}
                      className="w-full px-4 lg:px-6 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 text-sm lg:text-base"
                    >
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.position}) - {user.role_name}
                        </option>
                      ))}
                    </select>
                    {errors.recipient_id && (
                      <p className="text-sm text-red-600 flex items-center mt-2">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.recipient_id.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      {...register("recipient_role_id", { required: "Please select a role" })}
                      className="w-full px-4 lg:px-6 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 text-sm lg:text-base"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                    {errors.recipient_role_id && (
                      <p className="text-sm text-red-600 flex items-center mt-2">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.recipient_role_id.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label htmlFor="due_date" className="block text-sm font-semibold text-gray-700">
                  Due Date (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 lg:pl-6 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    id="due_date"
                    {...register("due_date")}
                    className="w-full pl-12 lg:pl-14 pr-4 lg:pr-6 py-3 lg:py-4 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 text-sm lg:text-base"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pt-6 lg:pt-8 border-t border-gray-200 space-y-4 lg:space-y-0">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center justify-center px-4 lg:px-6 py-2 lg:py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl lg:rounded-2xl hover:bg-gray-200 transition-all duration-300 hover:scale-105"
                >
                  <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  {showPreview ? "Hide Preview" : "Preview WhatsApp"}
                </button>
                <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate("/reminders")}
                    className="px-6 lg:px-8 py-2 lg:py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl lg:rounded-2xl hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 lg:px-8 py-2 lg:py-3 bg-gradient-to-r ${priorityConfig.gradient} text-white rounded-xl lg:rounded-2xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg flex items-center justify-center font-semibold text-sm lg:text-base`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                        Send Reminder
                        <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:space-y-6">
          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-lg">
            <h3 className="text-base lg:text-lg font-bold text-blue-800 mb-3 lg:mb-4 flex items-center">
              <div className="p-2 bg-blue-500 rounded-xl mr-3">
                <Info className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              💡 Pro Tips
            </h3>
            <ul className="space-y-2 lg:space-y-3">
              {[
                "Use clear and specific titles",
                "Include actionable information",
                "Set appropriate priority levels",
                "Add due dates for urgency",
              ].map((tip, index) => (
                <li key={index} className="flex items-start text-xs lg:text-sm text-blue-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="font-medium">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* WhatsApp Preview */}
          {showPreview && (formData.title || formData.message) && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-white/50 overflow-hidden">
              <div className="px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-green-500 to-emerald-600">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm lg:text-base">WhatsApp Preview</h3>
                    <p className="text-xs lg:text-sm text-green-100">Live preview of your message</p>
                  </div>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3 lg:mb-4">
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 lg:px-3 py-1 rounded-full">
                        KPP SI PRIMA
                      </span>
                      <span className={`px-2 lg:px-3 py-1 text-xs font-bold rounded-full ${priorityConfig.color}`}>
                        {formData.priority?.toUpperCase()}
                      </span>
                    </div>
                    {formData.title && (
                      <h4 className="font-bold text-gray-900 mb-2 lg:mb-3 flex items-center text-sm lg:text-lg">
                        📋 {formData.title}
                      </h4>
                    )}
                    {formData.message && (
                      <p className="text-gray-700 mb-3 lg:mb-4 leading-relaxed text-sm lg:text-base">
                        {formData.message}
                      </p>
                    )}
                    {formData.due_date && (
                      <div className="flex items-center text-xs lg:text-sm text-orange-600 mb-3 lg:mb-4 p-2 lg:p-3 bg-orange-50 rounded-lg lg:rounded-xl border border-orange-200">
                        <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                        <span className="font-semibold">
                          Due: {new Date(formData.due_date).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 border-t pt-2 lg:pt-3 font-medium">
                      Sent via KPP SI PRIMA Reminder System
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SendReminder
