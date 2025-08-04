"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import api from "../../services/api"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit3,
  Trash2,
  Power,
  PowerOff,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap,
  Target,
} from "lucide-react"
import { format, addDays } from "date-fns"
import toast from "react-hot-toast"

const ReminderScheduleManager = () => {
  const [schedules, setSchedules] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  // ✅ Fixed: Separate form state management with new fields
 const [formData, setFormData] = useState({
  name: "",
  description: "",
  role_id: "",
  reminder_template: "",
  schedule_type: "daily",
  schedule_day: "",
  schedule_time: "",
  priority: "medium",
  due_date: "", // ✅ CHANGED: Ganti dari due_date_days ke due_date
  due_date_time: "",
  is_active: true,
})

  useEffect(() => {
    fetchSchedules()
    fetchRoles()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await api.get("/reminder-schedules")
      console.log("Schedules API response:", response.data)

      if (response.data.success) {
        setSchedules(response.data.schedules || [])
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
      toast.error("Failed to fetch schedules")
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles")
      console.log("Fetched roles:", response.data.roles)
      if (response.data && response.data.roles) {
        setRoles(Array.isArray(response.data.roles) ? response.data.roles : [])
      } else {
        setRoles([])
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
      setRoles([])
    }
  }

  // ✅ Fixed: Direct form field update function
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

 const resetForm = useCallback(() => {
  setFormData({
    name: "",
    description: "",
    role_id: "",
    reminder_template: "",
    schedule_type: "daily",
    schedule_day: "",
    schedule_time: "",
    priority: "medium",
    due_date: "", // ✅ CHANGED: Ganti dari due_date_days ke due_date
    due_date_time: "",
    is_active: true,
  })
}, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingSchedule ? `/reminder-schedules/${editingSchedule.id}` : "/reminder-schedules"
      const method = editingSchedule ? "put" : "post"

      const response = await api[method](url, formData)

      if (response.data.success) {
        toast.success(editingSchedule ? "Schedule updated successfully" : "Schedule created successfully")
        setShowModal(false)
        setEditingSchedule(null)
        resetForm()
        fetchSchedules()
      }
    } catch (error) {
      console.error("Failed to save schedule:", error)
      toast.error(error.response?.data?.error || "Failed to save schedule")
    }
  }

 const handleEdit = (schedule) => {
  setEditingSchedule(schedule)
  setFormData({
    name: schedule.name || "",
    description: schedule.description || "",
    role_id: schedule.role_id || "",
    reminder_template: schedule.reminder_template || "",
    schedule_type: schedule.schedule_type || "daily",
    schedule_day: schedule.schedule_day || "",
    schedule_time: schedule.schedule_time || "",
    priority: schedule.priority || "medium",
    due_date: schedule.due_date || "", // ✅ CHANGED: Ganti dari due_date_days ke due_date
    due_date_time: schedule.due_date_time || "",
    is_active: schedule.is_active !== undefined ? schedule.is_active : true,
  })
  setShowModal(true)
}

const getTodayDate = () => {
  const today = new Date()
  return format(today, 'yyyy-MM-dd')
}

// 6. ✅ NEW: Helper function untuk preview due date
const getDueDatePreview = () => {
  if (!formData.due_date) return null
  
  const dueDate = new Date(formData.due_date)
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let preview = format(dueDate, 'dd MMM yyyy')
  if (diffDays === 0) {
    preview += " (Today)"
  } else if (diffDays === 1) {
    preview += " (Tomorrow)"
  } else if (diffDays > 1) {
    preview += ` (in ${diffDays} days)`
  } else {
    preview += ` (${Math.abs(diffDays)} days ago)`
  }
  
  if (formData.due_date_time) {
    preview += ` at ${formData.due_date_time}`
  }
  
  return preview
}

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    try {
      const response = await api.delete(`/reminder-schedules/${id}`)
      if (response.data.success) {
        toast.success("Schedule deleted successfully")
        fetchSchedules()
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error)
      toast.error("Failed to delete schedule")
    }
  }

  const handleToggle = async (id) => {
    try {
      const response = await api.patch(`/reminder-schedules/${id}/toggle`)
      if (response.data.success) {
        toast.success(response.data.message)
        fetchSchedules()
      }
    } catch (error) {
      console.error("Failed to toggle schedule:", error)
      toast.error("Failed to toggle schedule")
    }
  }

  const getScheduleTypeText = (type, day, time) => {
    const timeText = time ? ` at ${time}` : ""

    switch (type) {
      case "daily":
        return `Daily${timeText}`
      case "weekly":
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        return `Weekly on ${days[day] || "Unknown"}${timeText}`
      case "monthly":
        return `Monthly on day ${day}${timeText}`
      default:
        return type
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[priority] || colors.medium
  }

  const handleModalClose = useCallback(() => {
    setShowModal(false)
    setEditingSchedule(null)
    resetForm()
  }, [resetForm])

  // ✅ Fixed: Memoized modal component to prevent re-renders
  const ScheduleModal = useMemo(() => {
    if (!showModal) return null

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSchedule ? "Edit Schedule" : "Create New Schedule"}
              </h2>
              <button
                onClick={handleModalClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Daily Report Reminder"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Role *</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => handleInputChange("role_id", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a role</option>
                  {Array.isArray(roles) && roles.length > 0 ? (
                    roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description || "No description"}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No roles available
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="Optional description of this schedule"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Message Template *</label>
              <textarea
                value={formData.reminder_template}
                onChange={(e) => handleInputChange("reminder_template", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Enter the message that will be sent to users..."
                required
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type *</label>
                <select
                  value={formData.schedule_type}
                  onChange={(e) => {
                    handleInputChange("schedule_type", e.target.value)
                    handleInputChange("schedule_day", "")
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {(formData.schedule_type === "weekly" || formData.schedule_type === "monthly") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.schedule_type === "weekly" ? "Day of Week" : "Day of Month"}
                  </label>
                  {formData.schedule_type === "weekly" ? (
                    <select
                      value={formData.schedule_day}
                      onChange={(e) => handleInputChange("schedule_day", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select day</option>
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.schedule_day}
                      onChange={(e) => handleInputChange("schedule_day", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1-31"
                      autoComplete="off"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time (Optional)</label>
                <input
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => handleInputChange("schedule_time", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* ✅ NEW: Due Date Configuration */}
           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-center mb-3">
    <Target className="h-5 w-5 text-blue-600 mr-2" />
    <h3 className="text-sm font-semibold text-blue-800">Due Date Configuration (Optional)</h3>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
      <input
        type="date"
        value={formData.due_date}
        onChange={(e) => handleInputChange("due_date", e.target.value)}
        min={getTodayDate()} // ✅ NEW: Minimum tanggal adalah hari ini
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoComplete="off"
      />
      <p className="text-xs text-gray-500 mt-1">Select the deadline date for this task</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
      <input
        type="time"
        value={formData.due_date_time}
        onChange={(e) => handleInputChange("due_date_time", e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoComplete="off"
      />
      <p className="text-xs text-gray-500 mt-1">Time when the task is due (optional)</p>
    </div>
  </div>
           {formData.due_date && (
    <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm text-blue-800">
            <strong>Due Date:</strong> {getDueDatePreview()}
          </p>
        </div>
        {/* ✅ NEW: Visual indicator untuk due date status */}
        <div className="ml-2">
          {(() => {
            if (!formData.due_date) return null
            const dueDate = new Date(formData.due_date)
            const today = new Date()
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            
            if (diffDays < 0) {
              return <span className="text-red-600 text-xs">⚠️ Past date</span>
            } else if (diffDays === 0) {
              return <span className="text-orange-600 text-xs">📅 Today</span>
            } else if (diffDays === 1) {
              return <span className="text-blue-600 text-xs">⏰ Tomorrow</span>
            } else {
              return <span className="text-green-600 text-xs">✅ Future</span>
            }
          })()}
        </div>
      </div>
    </div>
  )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange("is_active", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active (schedule will run automatically)
              </label>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleModalClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingSchedule ? "Update Schedule" : "Create Schedule"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }, [showModal, editingSchedule, formData, roles, handleInputChange, handleModalClose])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8 lg:ml-64 lg:pl-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8 lg:ml-64 lg:pl-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl text-white p-6 lg:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full opacity-50"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Settings className="h-6 w-6" />
                  </div>
                  <h1 className="text-3xl font-bold">Reminder Schedule Manager</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Manage automated WhatsApp reminder schedules for different roles
                </p>
                <div className="flex items-center text-sm text-blue-200 mt-4">
                  <Zap className="h-4 w-4 mr-2" />
                  <span>Automated scheduling with WhatsApp integration & configurable due dates</span>
                </div>
              </div>
              <button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="mt-4 lg:mt-0 flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Schedules List */}
        <div className="space-y-4">
          {Array.isArray(schedules) && schedules.length > 0 ? (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${schedule.is_active ? "bg-green-100" : "bg-gray-100"}`}>
                        {schedule.is_active ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{schedule.name || "Untitled Schedule"}</h3>
                        <p className="text-sm text-gray-500">
                          {schedule.role_name || "Unknown Role"} •{" "}
                          {getScheduleTypeText(schedule.schedule_type, schedule.schedule_day, schedule.schedule_time)}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {schedule.is_active ? "Active" : "Inactive"}
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(schedule.priority)}`}
                      >
                        {(schedule.priority || "medium").toUpperCase()}
                      </div>
                    </div>

                    {schedule.description && <p className="text-gray-600 mb-3">{schedule.description}</p>}

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium text-sm">Message Template:</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {schedule.reminder_template || "No template"}
                      </p>
                    </div>

                    {/* ✅ NEW: Due Date Display */}
                {schedule.due_date && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
    <div className="flex items-center text-blue-700 mb-1">
      <Target className="h-4 w-4 mr-2" />
      <span className="font-medium text-sm">Due Date:</span>
    </div>
    <p className="text-sm text-blue-800">
      {format(new Date(schedule.due_date), 'dd MMM yyyy')}
      {schedule.due_date_time && ` at ${schedule.due_date_time}`}
    </p>
  </div>
)}

                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>Role: {schedule.role_name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          Created:{" "}
                          {schedule.created_at ? format(new Date(schedule.created_at), "MMM dd, yyyy") : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggle(schedule.id)}
                      className={`p-2 rounded-full transition-colors ${
                        schedule.is_active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"
                      }`}
                      title={schedule.is_active ? "Deactivate" : "Activate"}
                    >
                      {schedule.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit schedule"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete schedule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-500 mb-6">Create your first automated reminder schedule to get started.</p>
              <button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Schedule
              </button>
            </div>
          )}
        </div>

        {/* Schedule Modal */}
        {ScheduleModal}
      </div>
    </div>
  )
}

export default ReminderScheduleManager
