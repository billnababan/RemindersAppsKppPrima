"use client"
import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import api from "../../services/api"
import {
  Bell,
  Clock,
  CheckCircle,
  Filter,
  Search,
  Eye,
  MoreHorizontal,
  Plus,
  MessageSquare,
  Edit3,
  Save,
  X,
  Trash2,
  Check,
} from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"

// Modal untuk Mark as Read dengan Notes
const MarkAsReadModal = ({
  isOpen,
  onClose,
  selectedReminder,
  notesText,
  setNotesText,
  savingNotes,
  markAsReadWithNotes,
}) => {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  if (!isOpen || !selectedReminder) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Mark as Read</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">{selectedReminder.title}</h3>
            <p className="text-sm text-gray-600">{selectedReminder.message}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Notes (Optional - add your acknowledgment or comments)
            </label>
            <textarea
              ref={textareaRef}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Enter your reading notes (optional)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={markAsReadWithNotes}
              disabled={savingNotes}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {savingNotes ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Marking...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Read
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal untuk Add Notes (terpisah dari complete)
const AddNotesModal = ({ isOpen, onClose, selectedReminder, notesText, setNotesText, savingNotes, saveNotes }) => {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  if (!isOpen || !selectedReminder) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Add Notes</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">{selectedReminder.title}</h3>
            <p className="text-sm text-gray-600">{selectedReminder.message}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Add your comments, observations, or explanations)
            </label>
            <textarea
              ref={textareaRef}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Enter your notes here (e.g., reasons for delay, additional information, etc.)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveNotes}
              disabled={savingNotes || !notesText.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {savingNotes ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notes Detail Modal untuk KPHO melihat notes lengkap
const NotesDetailModal = ({ isOpen, onClose, reminder }) => {
  if (!isOpen || !reminder) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Notes Detail</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{reminder.title}</h3>
            <p className="text-gray-600 mb-4">{reminder.message}</p>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
            <div className="flex items-center text-purple-700 mb-3">
              <MessageSquare className="h-5 w-5 mr-2" />
              <span className="font-semibold">User Notes</span>
            </div>
            {reminder.notes ? (
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{reminder.notes}</p>
              </div>
            ) : (
              <p className="text-purple-600 italic">No notes provided</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">From:</span>
              <p className="text-gray-600">{reminder.sender_name || "System"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Priority:</span>
              <p className="text-gray-600 capitalize">{reminder.priority}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <p className="text-gray-600">{format(new Date(reminder.created_at), "dd MMM yyyy, HH:mm")}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <p className="text-gray-600">
                {reminder.is_completed ? "Completed" : reminder.is_read ? "Read" : "Unread"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Reminders = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "all",
    priority: searchParams.get("priority") || "all",
    type: searchParams.get("type") || "all",
    search: "",
  })

  // Modal states
  const [showMarkAsReadModal, setShowMarkAsReadModal] = useState(false)
  const [showAddNotesModal, setShowAddNotesModal] = useState(false)
  const [showNotesDetailModal, setShowNotesDetailModal] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState(null)
  const [notesText, setNotesText] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    fetchReminders()
  }, [filters])

  const fetchReminders = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...filters,
      })
      console.log("Fetching reminders with params:", params.toString())
      const response = await api.get(`/reminders?${params}`)
      console.log("Reminders response:", response.data)
      if (response.data.success) {
        setReminders(response.data.reminders || [])
        setPagination(response.data.pagination || {})
      } else {
        console.error("Failed to fetch reminders:", response.data.error)
        toast.error(response.data.error || "Failed to fetch reminders")
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error)
      toast.error("Failed to fetch reminders")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    // Update URL params
    const newSearchParams = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== "all") {
        newSearchParams.set(k, v)
      }
    })
    setSearchParams(newSearchParams)
  }

  // Mark as Read dengan Notes
  const handleMarkAsRead = (reminder) => {
    setSelectedReminder(reminder)
    setNotesText("")
    setShowMarkAsReadModal(true)
  }

  const markAsReadWithNotes = async () => {
    if (!selectedReminder) return
    try {
      setSavingNotes(true)
      const response = await api.patch(`/reminders/${selectedReminder.id}/read`, {
        notes: notesText.trim(),
      })
      if (response.data.success) {
        toast.success("Marked as read")
        setShowMarkAsReadModal(false)
        setNotesText("")
        fetchReminders(pagination.current_page)
      }
    } catch (error) {
      console.error("Failed to mark as read:", error)
      toast.error("Failed to mark as read")
    } finally {
      setSavingNotes(false)
    }
  }

  // Mark as Completed (langsung tanpa notes)
  const markAsCompleted = async (id) => {
    try {
      const response = await api.patch(`/reminders/${id}/complete`)
      if (response.data.success) {
        toast.success("Marked as completed")
        fetchReminders(pagination.current_page)
      }
    } catch (error) {
      console.error("Failed to mark as completed:", error)
      toast.error("Failed to mark as completed")
    }
  }

  // Add Notes (terpisah dari complete)
  const handleAddNotes = (reminder) => {
    setSelectedReminder(reminder)
    setNotesText(reminder.notes || "")
    setShowAddNotesModal(true)
  }

  const saveNotes = async () => {
    if (!selectedReminder || !notesText.trim()) {
      toast.error("Please enter some notes")
      return
    }
    try {
      setSavingNotes(true)
      const response = await api.patch(`/reminders/${selectedReminder.id}/notes`, {
        notes: notesText.trim(),
      })
      if (response.data.success) {
        toast.success("Notes saved successfully")
        setShowAddNotesModal(false)
        setNotesText("")
        fetchReminders(pagination.current_page)
      }
    } catch (error) {
      console.error("Failed to save notes:", error)
      toast.error("Failed to save notes")
    } finally {
      setSavingNotes(false)
    }
  }

  const handleViewNotesDetail = (reminder) => {
    setSelectedReminder(reminder)
    setShowNotesDetailModal(true)
  }

  const deleteReminder = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the reminder: "${title}"? This action cannot be undone.`)) {
      return
    }
    try {
      const response = await api.delete(`/reminders/${id}`)
      if (response.data.success) {
        toast.success("Reminder deleted successfully")
        fetchReminders(pagination.current_page)
      }
    } catch (error) {
      console.error("Failed to delete reminder:", error)
      toast.error("Failed to delete reminder")
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

  const getStatusIcon = (reminder) => {
    if (reminder.is_completed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    if (!reminder.is_read) {
      return <Bell className="h-5 w-5 text-blue-500" />
    }
    return <Clock className="h-5 w-5 text-gray-400" />
  }

  const ReminderCard = ({ reminder }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon(reminder)}
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{reminder.title}</h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(reminder.priority)}`}
            >
              {reminder.priority.toUpperCase()}
            </span>
            {!reminder.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
          </div>
          <p className="text-gray-600 mb-4 leading-relaxed text-sm lg:text-base line-clamp-3">{reminder.message}</p>
          {reminder.notes && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="flex items-center justify-between text-purple-700 mb-2">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="font-medium text-sm">Notes:</span>
                </div>
                <button
                  onClick={() => handleViewNotesDetail(reminder)}
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  View Full
                </button>
              </div>
              <p className="text-sm text-purple-800 line-clamp-2">{reminder.notes}</p>
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-sm text-gray-500 space-y-2 lg:space-y-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-1 lg:space-y-0">
              <span>From: {reminder.sender_name}</span>
              <span>{format(new Date(reminder.created_at), "MMM dd, yyyy HH:mm")}</span>
              {reminder.due_date && (
                <span className="text-orange-600 font-medium">
                  Due: {format(new Date(reminder.due_date), "MMM dd, yyyy")}
                </span>
              )}
              <div className="text-xs text-slate-500">
                <span className={`mr-2 ${reminder.is_read ? "text-green-600" : "text-red-500"}`}>
                  {reminder.is_read ? "📖 Read" : "📬 Unread"}
                </span>
                <span className={`${reminder.is_completed ? "text-green-600" : "text-yellow-600"}`}>
                  {reminder.is_completed ? "✅ Completed" : "⌛ Pending"}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {reminder.document_title && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  📄 {reminder.document_title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {!reminder.is_read && (
            <button
              onClick={() => handleMarkAsRead(reminder)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Mark as read (with notes)"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {!reminder.is_completed && (
            <button
              onClick={() => markAsCompleted(reminder.id)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Mark as completed"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleAddNotes(reminder)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
            title="Add notes"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteReminder(reminder.id, reminder.title)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete reminder"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  if (loading && reminders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 mb-4 shadow-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-8 lg:ml-64 lg:pl-4">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reminders</h1>
            <p className="text-gray-600 mt-1">Manage your reminders and notifications</p>
          </div>
          <button
            onClick={() => navigate("/reminders/send")}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Send Reminder
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 lg:p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search reminders..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reminders List */}
        <div className="space-y-4">
          {reminders.length > 0 ? (
            reminders.map((reminder) => <ReminderCard key={reminder.id} reminder={reminder} />)
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No reminders found</h3>
              <p className="text-gray-500 mb-6">
                {Object.values(filters).some((f) => f && f !== "all")
                  ? "Try adjusting your filters to see more reminders."
                  : "You don't have any reminders yet."}
              </p>
              <button
                onClick={() => navigate("/reminders/send")}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Send Your First Reminder
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 px-6 py-4 space-y-4 lg:space-y-0">
            <div className="text-sm text-gray-700 text-center lg:text-left">
              Showing {(pagination.current_page - 1) * pagination.items_per_page + 1} to{" "}
              {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of{" "}
              {pagination.total_items} results
            </div>
            <div className="flex justify-center lg:justify-end space-x-2">
              <button
                onClick={() => fetchReminders(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg font-medium">
                {pagination.current_page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => fetchReminders(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <MarkAsReadModal
          isOpen={showMarkAsReadModal}
          onClose={() => setShowMarkAsReadModal(false)}
          selectedReminder={selectedReminder}
          notesText={notesText}
          setNotesText={setNotesText}
          savingNotes={savingNotes}
          markAsReadWithNotes={markAsReadWithNotes}
        />

        <AddNotesModal
          isOpen={showAddNotesModal}
          onClose={() => setShowAddNotesModal(false)}
          selectedReminder={selectedReminder}
          notesText={notesText}
          setNotesText={setNotesText}
          savingNotes={savingNotes}
          saveNotes={saveNotes}
        />

        <NotesDetailModal
          isOpen={showNotesDetailModal}
          onClose={() => setShowNotesDetailModal(false)}
          reminder={selectedReminder}
        />
      </div>
    </div>
  )
}

export default Reminders
