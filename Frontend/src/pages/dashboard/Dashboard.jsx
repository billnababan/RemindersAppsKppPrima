"use client"
import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import api from "../../services/api"
import {
  Bell,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUp,
  ArrowDown,
  BarChart2,
  Activity,
  FileText,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  X,
  User,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Edit3,
  Save,
} from "lucide-react"
import { format, subWeeks, subMonths, startOfDay } from "date-fns"
import toast from "react-hot-toast"

// Move NotesModal outside to prevent re-creation
const NotesModal = ({ isOpen, onClose, selectedReminder, notesText, setNotesText, savingNotes, saveNotes }) => {
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
              Notes (Reason for delay, explanation, etc.)
            </label>
            <textarea
              ref={textareaRef}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Enter your notes here..."
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
              onClick={saveNotes}
              disabled={savingNotes || !notesText.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

// Notes Detail Modal for viewing full notes
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

const Dashboard = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pending: 0,
    completed: 0,
    urgent: 0,
    with_notes: 0,
  })
  const [recentReminders, setRecentReminders] = useState([])
  const [allReminders, setAllReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showNotesDetailModal, setShowNotesDetailModal] = useState(false)
  const [notesText, setNotesText] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Ref untuk menyimpan filter state saat live monitoring
  const filtersRef = useRef({
    searchTerm: "",
    statusFilter: "all",
    priorityFilter: "all",
    dateFilter: "all",
  })

  // Flag untuk mencegah override filter saat live monitoring
  const isLiveMonitoringRef = useRef(false)

  useEffect(() => {
    fetchDashboardData()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    // Live monitoring setiap 30 detik dengan mempertahankan filter
    const liveMonitoringTimer = setInterval(() => {
      isLiveMonitoringRef.current = true
      fetchDashboardDataWithFilters()
    }, 30000)

    return () => {
      clearInterval(timer)
      clearInterval(liveMonitoringTimer)
    }
  }, [])

  // Update refs ketika filter berubah - hanya jika bukan dari live monitoring
  useEffect(() => {
    if (!isLiveMonitoringRef.current) {
      filtersRef.current = {
        searchTerm,
        statusFilter,
        priorityFilter,
        dateFilter,
      }
    }
  }, [searchTerm, statusFilter, priorityFilter, dateFilter])

  // Reset to first page when filters change
  useEffect(() => {
    if (!isLiveMonitoringRef.current) {
      setCurrentPage(1)
    }
  }, [searchTerm, statusFilter, priorityFilter, dateFilter])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      console.log("🔄 Fetching dashboard stats...")
      const statsResponse = await api.get("/reminders/stats")
      console.log("📊 Stats response:", statsResponse.data)

      if (statsResponse.data.success) {
        setStats(statsResponse.data)
        console.log("✅ Stats updated:", statsResponse.data)
      } else {
        console.error("❌ Stats fetch failed:", statsResponse.data.error)
        toast.error("Failed to fetch statistics")
      }

      const remindersResponse = await api.get("/reminders?limit=5")
      setRecentReminders(remindersResponse.data.reminders)

      // Fetch all reminders for monitoring table
      const allRemindersResponse = await api.get("/reminders?limit=1000")
      // Sort by created_at descending (newest first)
      const sortedReminders = allRemindersResponse.data.reminders.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      )
      setAllReminders(sortedReminders)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast.error("Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardDataWithFilters = async () => {
    try {
      // Fetch data tanpa mengubah loading state untuk live monitoring
      console.log("🔄 Live monitoring - fetching stats...")
      const statsResponse = await api.get("/reminders/stats")
      console.log("📊 Live stats response:", statsResponse.data)

      if (statsResponse.data.success) {
        setStats(statsResponse.data)
        console.log("✅ Live stats updated:", statsResponse.data)
      }

      const remindersResponse = await api.get("/reminders?limit=5")
      setRecentReminders(remindersResponse.data.reminders)

      const allRemindersResponse = await api.get("/reminders?limit=1000")
      // Sort by created_at descending (newest first)
      const sortedReminders = allRemindersResponse.data.reminders.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      )
      setAllReminders(sortedReminders)

      // JANGAN override filter state saat live monitoring
      // Filter state akan tetap sesuai dengan yang dipilih user
      isLiveMonitoringRef.current = false
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      isLiveMonitoringRef.current = false
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleViewDetails = (reminder) => {
    setSelectedReminder(reminder)
    setShowDetailModal(true)
  }

  const handleAddNotes = (reminder) => {
    setSelectedReminder(reminder)
    setNotesText(reminder.notes || "")
    setShowNotesModal(true)
  }

  const handleViewNotesDetail = (reminder) => {
    setSelectedReminder(reminder)
    setShowNotesDetailModal(true)
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
        setShowNotesModal(false)
        setNotesText("")
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error("Failed to save notes:", error)
      toast.error("Failed to save notes")
    } finally {
      setSavingNotes(false)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Selamat Pagi"
    if (hour < 15) return "Selamat Siang"
    if (hour < 18) return "Selamat Sore"
    return "Selamat Malam"
  }

  const StatCard = ({ title, value, icon: Icon, color, change, changeType, description }) => (
    <div className="relative p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 transform hover:-translate-y-1 transition-all duration-300 ease-in-out hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        <div className={`p-3 sm:p-4 rounded-full bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
      {change && (
        <div className="flex items-center mt-3 sm:mt-4 text-xs text-gray-500">
          <div className={`flex items-center mr-2 ${changeType === "increase" ? "text-green-500" : "text-red-500"}`}>
            {changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            <span>{change}</span>
          </div>
          <span>dari minggu lalu</span>
        </div>
      )}
    </div>
  )

  const ReminderCard = ({ reminder }) => {
    const priorityColors = {
      low: "border-green-500 bg-green-50",
      medium: "border-yellow-500 bg-yellow-50",
      high: "border-orange-500 bg-orange-50",
      urgent: "border-red-500 bg-red-50",
    }
    return (
      <div
        className={`p-3 sm:p-4 rounded-xl border-l-4 ${priorityColors[reminder.priority]} shadow-md hover:shadow-xl transition-all duration-300`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{reminder.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{reminder.message}</p>
            {reminder.notes && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-2 border-blue-300">
                <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span className="font-medium">Notes:</span>
                  </div>
                  <button
                    onClick={() => handleViewNotesDetail(reminder)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    View Full
                  </button>
                </div>
                <p className="text-xs text-blue-700 line-clamp-2">{reminder.notes}</p>
              </div>
            )}
            <div className="flex items-center mt-2 sm:mt-3 text-xs text-gray-400">
              <span>From: {reminder.sender_name}</span>
              <span className="mx-2">•</span>
              <span>{format(new Date(reminder.created_at), "MMM dd, HH:mm")}</span>
            </div>
          </div>
          <div className="flex flex-col items-center ml-4 space-y-2">
            {!reminder.is_read && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>}
            {reminder.is_completed && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
            {reminder.notes && <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
          </div>
        </div>
      </div>
    )
  }

  // Filter data berdasarkan tanggal
  const filterByDate = (reminders) => {
    if (dateFilter === "all") return reminders
    const now = new Date()
    let startDate
    switch (dateFilter) {
      case "today":
        startDate = startOfDay(now)
        break
      case "week":
        startDate = subWeeks(now, 1)
        break
      case "month":
        startDate = subMonths(now, 1)
        break
      case "3months":
        startDate = subMonths(now, 3)
        break
      default:
        return reminders
    }
    return reminders.filter((reminder) => {
      const reminderDate = new Date(reminder.created_at)
      return reminderDate >= startDate
    })
  }

  // Modal Detail Reminder
  const DetailModal = ({ reminder, isOpen, onClose }) => {
    if (!isOpen || !reminder) return null
    const getStatusColor = (reminder) => {
      if (reminder.is_completed) {
        return "bg-green-100 text-green-800 border-green-200"
      } else if (!reminder.is_read) {
        return "bg-blue-100 text-blue-800 border-blue-200"
      } else {
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      }
    }
    const getStatusText = (reminder) => {
      if (reminder.is_completed) {
        return "Completed"
      } else if (!reminder.is_read) {
        return "Unread"
      } else {
        return "Pending"
      }
    }
    const getPriorityColor = (priority) => {
      switch (priority?.toLowerCase()) {
        case "urgent":
          return "bg-red-100 text-red-800 border-red-200"
        case "high":
          return "bg-orange-100 text-orange-800 border-orange-200"
        case "medium":
          return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "low":
          return "bg-green-100 text-green-800 border-green-200"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200"
      }
    }
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Reminder Details</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{reminder.title}</h3>
              <p className="text-gray-600">{reminder.message}</p>
            </div>
            {reminder.notes && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <div className="flex items-center text-blue-700 mb-2">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="font-medium">Notes</span>
                </div>
                <p className="text-blue-800">{reminder.notes}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sender</p>
                    <p className="text-sm text-gray-600">{reminder.sender_name || "System"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Created</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(reminder.created_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>
                {reminder.due_date && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Due Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(reminder.due_date), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">Priority</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}
                  >
                    {reminder.priority?.toUpperCase() || "MEDIUM"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(reminder)}`}
                  >
                    {getStatusText(reminder)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">Type</p>
                  <p className="text-sm text-gray-600 capitalize">{reminder.reminder_type}</p>
                </div>
              </div>
            </div>
            {reminder.document_title && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Related Document</h4>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{reminder.document_title}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const MonitoringDashboard = () => {
    // Filter data
    let filteredData = allReminders.filter((reminder) => {
      const matchesSearch =
        reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reminder.notes && reminder.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      let matchesStatus = true
      if (statusFilter === "completed") {
        matchesStatus = reminder.is_completed === 1
      } else if (statusFilter === "pending") {
        matchesStatus = reminder.is_completed === 0
      } else if (statusFilter === "unread") {
        matchesStatus = reminder.is_read === 0
      }
      const matchesPriority = priorityFilter === "all" || reminder.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })

    // Apply date filter
    filteredData = filterByDate(filteredData)

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filteredData.slice(startIndex, endIndex)

    const getStatusColor = (reminder) => {
      if (reminder.is_completed) {
        return "bg-green-100 text-green-800 border-green-200"
      } else if (!reminder.is_read) {
        return "bg-blue-100 text-blue-800 border-blue-200"
      } else {
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      }
    }

    const getStatusText = (reminder) => {
      if (reminder.is_completed) {
        return "Completed"
      } else if (!reminder.is_read) {
        return "Unread"
      } else {
        return "Pending"
      }
    }

    const getPriorityColor = (priority) => {
      switch (priority?.toLowerCase()) {
        case "urgent":
          return "bg-red-100 text-red-800 border-red-200"
        case "high":
          return "bg-orange-100 text-orange-800 border-orange-200"
        case "medium":
          return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "low":
          return "bg-green-100 text-green-800 border-green-200"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200"
      }
    }

    const calculateDuration = (startDate, endDate) => {
      if (!endDate || endDate === startDate) return "-"
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffMs = end - start
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}min`
      } else {
        return `${diffMinutes}min`
      }
    }

    const getProgress = (reminder) => {
      if (reminder.is_completed) return 100
      if (reminder.is_read) return 50
      return 25
    }

    // Generate sequential number based on position in filtered data (newest first)
    const getSequentialNumber = (index) => {
      return startIndex + index + 1
    }

    const Pagination = () => {
      const pageNumbers = []
      const maxVisiblePages = 5
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> of{" "}
                <span className="font-medium">{filteredData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === number
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ">
        <div className="max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-2xl text-white p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full opacity-50"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-24 h-24 sm:w-48 sm:h-48 bg-white/10 rounded-full opacity-30"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Monitoring Dashboard</h1>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                    Real-time monitoring of all reminder activities
                  </p>
                  <div className="flex items-center text-xs sm:text-sm text-blue-200 mt-3 sm:mt-4">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">{format(currentTime, "EEEE, dd MMMM yyyy")}</span>
                    <span className="sm:hidden">{format(currentTime, "dd MMM yyyy")}</span>
                    <span className="mx-2 sm:mx-3">•</span>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span>{currentTime.toLocaleTimeString("id-ID")}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4 mt-4 sm:mt-0">
                  <button
                    onClick={handleRefresh}
                    className={`p-2 sm:p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors ${refreshing ? "animate-spin" : ""}`}
                  >
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button className="p-2 sm:p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Reminders"
              value={stats.total}
              icon={Activity}
              color="from-blue-500 to-blue-600"
              change="+8%"
              changeType="increase"
              description="All system reminders"
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={CheckCircle}
              color="from-green-500 to-green-600"
              change="+15%"
              changeType="increase"
              description="Successfully finished"
            />
            <StatCard
              title="Unread"
              value={stats.unread}
              icon={Bell}
              color="from-blue-500 to-blue-600"
              change="+5%"
              changeType="increase"
              description="Not yet opened"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={AlertTriangle}
              color="from-yellow-500 to-yellow-600"
              change="-3%"
              changeType="decrease"
              description="Awaiting completion"
            />
            <StatCard
              title="Urgent"
              value={stats.urgent}
              icon={TrendingUp}
              color="from-red-500 to-red-600"
              change="+2%"
              changeType="increase"
              description="High priority items"
            />
            <StatCard
              title="With Notes"
              value={stats.with_notes}
              icon={MessageSquare}
              color="from-purple-500 to-purple-600"
              change="+12%"
              changeType="increase"
              description="Contains explanations"
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 mb-6 sm:mb-8">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search reminders, senders, messages, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="unread">Unread</option>
                  </select>
                </div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span>
                    Showing {filteredData.length} of {allReminders.length}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="hidden sm:inline">Live monitoring</span>
                    <span className="sm:hidden">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Reminder Table */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Reminder Activity Monitoring</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Real-time tracking of all reminder activities and their completion status
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Unread</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>With Notes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden">
              {paginatedData.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {paginatedData.map((reminder, index) => (
                    <div key={reminder.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            {getSequentialNumber(index)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{reminder.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{reminder.message}</p>
                            {reminder.notes && (
                              <div className="mt-2 p-2 bg-purple-50 rounded-lg border-l-2 border-purple-300">
                                <div className="flex items-center justify-between text-xs text-purple-600 mb-1">
                                  <div className="flex items-center">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    <span className="font-medium">Notes:</span>
                                  </div>
                                  <button
                                    onClick={() => handleViewNotesDetail(reminder)}
                                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                                  >
                                    View Full
                                  </button>
                                </div>
                                <p className="text-xs text-purple-700 line-clamp-2">{reminder.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleViewDetails(reminder)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          {!reminder.is_completed && (
                            <button
                              onClick={() => handleAddNotes(reminder)}
                              className="p-1 text-gray-400 hover:text-purple-600"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reminder)}`}
                          >
                            {getStatusText(reminder)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}
                          >
                            {reminder.priority?.toUpperCase() || "MEDIUM"}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>From: {reminder.sender_name || "System"}</div>
                        <div>Created: {format(new Date(reminder.created_at), "MMM dd, yyyy HH:mm")}</div>
                        {reminder.updated_at && reminder.updated_at !== reminder.created_at && (
                          <div>
                            {reminder.is_completed ? "Completed" : "Updated"}:{" "}
                            {format(new Date(reminder.updated_at), "MMM dd, yyyy HH:mm")}
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{getProgress(reminder)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              reminder.is_completed
                                ? "bg-green-500"
                                : reminder.is_read
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                            }`}
                            style={{ width: `${getProgress(reminder)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reminders found matching your criteria.</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search or filter settings.</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reminder Details
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sender
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status & Priority
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((reminder, index) => (
                    <tr key={reminder.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs lg:text-sm">
                            {getSequentialNumber(index)}
                          </div>
                          <div className="ml-3 lg:ml-4">
                            <div className="text-sm font-semibold text-gray-900">{reminder.title}</div>
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{reminder.message}</div>
                            <div className="text-xs text-gray-400 mt-1">Type: {reminder.reminder_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{reminder.sender_name || "System"}</div>
                          <div className="text-xs text-gray-500">{reminder.sender_position || "Automated"}</div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(reminder)}`}
                          >
                            {getStatusText(reminder)}
                          </span>
                          <br />
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}
                          >
                            {reminder.priority?.toUpperCase() || "MEDIUM"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Created:</span>{" "}
                            {format(new Date(reminder.created_at), "MMM dd, yyyy HH:mm")}
                          </div>
                          <div>
                            <span className="font-medium">
                              {reminder.is_completed ? "Completed:" : "Last Updated:"}
                            </span>{" "}
                            {reminder.updated_at && reminder.updated_at !== reminder.created_at
                              ? format(new Date(reminder.updated_at), "MMM dd, yyyy HH:mm")
                              : "-"}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>{" "}
                            {calculateDuration(reminder.created_at, reminder.updated_at)}
                          </div>
                          {reminder.due_date && (
                            <div>
                              <span className="font-medium">Due:</span>{" "}
                              {format(new Date(reminder.due_date), "MMM dd, yyyy HH:mm")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="w-full">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{getProgress(reminder)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                reminder.is_completed
                                  ? "bg-green-500"
                                  : reminder.is_read
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                              }`}
                              style={{ width: `${getProgress(reminder)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 min-w-[220px] lg:min-w-[280px]">
                        <div className="max-w-sm sm:max-w-md lg:max-w-lg">
                          {reminder.notes ? (
                            <div className="bg-purple-50 border-l-2 border-purple-300 p-2 rounded">
                              <div className="flex items-center justify-between text-xs text-purple-600 mb-1">
                                <div className="flex items-center">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  <span className="font-medium">Notes:</span>
                                </div>
                                <button
                                  onClick={() => handleViewNotesDetail(reminder)}
                                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                                >
                                  View Full
                                </button>
                              </div>
                              <p className="text-xs text-purple-700 line-clamp-3">{reminder.notes}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No notes</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedData.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No reminders found matching your criteria.</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search or filter settings.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && <Pagination />}
          </div>

          {/* Summary Cards - Hidden on mobile to save space */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-semibold text-green-600">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-semibold text-blue-600">
                    {stats.total > 0 ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">With Notes</span>
                  <span className="font-semibold text-purple-600">{stats.with_notes}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Manual Reminders</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                    <span className="text-xs font-medium">85%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Automatic Reminders</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                    <span className="text-xs font-medium">15%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Response Time</span>
                  <span className="text-xs font-medium text-purple-600">2.5 hours</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-sm font-medium text-gray-800">{currentTime.toLocaleTimeString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="text-sm font-medium text-blue-600">{stats.total > 0 ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Modal */}
          <DetailModal reminder={selectedReminder} isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} />

          {/* Notes Modal */}
          <NotesModal
            isOpen={showNotesModal}
            onClose={() => setShowNotesModal(false)}
            selectedReminder={selectedReminder}
            notesText={notesText}
            setNotesText={setNotesText}
            savingNotes={savingNotes}
            saveNotes={saveNotes}
          />

          {/* Notes Detail Modal */}
          <NotesDetailModal
            isOpen={showNotesDetailModal}
            onClose={() => setShowNotesDetailModal(false)}
            reminder={selectedReminder}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (user?.role_name === "kpho_monitoring") {
    return <MonitoringDashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-xl text-white p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 sm:w-64 sm:h-64 bg-white/20 rounded-full opacity-50"></div>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {getGreeting()}, {user?.full_name || "User"}!
            </h1>
            <p className="text-blue-100 mt-2 text-sm sm:text-base">
              {user?.position || "Position"} • {user?.department || "Department"}
            </p>
            <div className="flex items-center text-xs sm:text-sm text-blue-200 mt-3 sm:mt-4">
              <span className="hidden sm:inline">{format(currentTime, "EEEE, dd MMMM yyyy")}</span>
              <span className="sm:hidden">{format(currentTime, "dd MMM yyyy")}</span>
              <span className="mx-2">•</span>
              <span>{currentTime.toLocaleTimeString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Reminders"
            value={stats.total}
            icon={Bell}
            color="from-blue-400 to-blue-600"
            change="+12%"
            changeType="increase"
          />
          <StatCard
            title="Unread"
            value={stats.unread}
            icon={AlertTriangle}
            color="from-yellow-400 to-yellow-600"
            change="+8%"
            changeType="increase"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="from-purple-400 to-purple-600"
            change="+23%"
            changeType="increase"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="from-green-400 to-green-600"
            change="-5%"
            changeType="decrease"
          />
          <StatCard
            title="With Notes"
            value={stats.with_notes}
            icon={MessageSquare}
            color="from-indigo-400 to-indigo-600"
            change="+15%"
            changeType="increase"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Urgent Reminders */}
            {stats.urgent > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 mr-3" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">
                      {stats.urgent} Urgent Reminder{stats.urgent > 1 ? "s" : ""}
                    </h3>
                    <p className="text-xs sm:text-sm">Please address these items immediately.</p>
                  </div>
                  <Link
                    to="/reminders?status=pending&priority=urgent"
                    className="ml-auto bg-red-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    View All
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link
                  to="/reminders"
                  className="flex items-center p-3 sm:p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <div className="p-2 sm:p-3 bg-blue-500 text-white rounded-lg">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">View Reminders</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Access all reminders</p>
                  </div>
                </Link>
                <Link
                  to="/reminders/send"
                  className="flex items-center p-3 sm:p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <div className="p-2 sm:p-3 bg-green-500 text-white rounded-lg">
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Send Reminder</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Create a new reminder</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Reminders */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Reminders</h2>
                <Link to="/reminders" className="text-xs sm:text-sm text-blue-500 hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {recentReminders.length > 0 ? (
                  recentReminders.map((reminder) => <ReminderCard key={reminder.id} reminder={reminder} />)
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base">No recent reminders.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Hidden on mobile */}
          <div className="hidden lg:block space-y-8">
            {/* Reminder Stats */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Reminder Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="ml-auto font-semibold">{stats.pending}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="ml-auto font-semibold">{stats.completed}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-sm text-gray-600">Urgent</span>
                  <span className="ml-auto font-semibold">{stats.urgent}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                  <span className="text-sm text-gray-600">With Notes</span>
                  <span className="ml-auto font-semibold">{stats.with_notes}</span>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Activity Chart</h3>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BarChart2 className="h-12 w-12 text-gray-300" />
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">System Status</h2>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse mr-3"></div>
                <span className="text-sm font-medium text-green-600">All systems operational</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Last checked: {currentTime.toLocaleTimeString("id-ID")}</p>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        <DetailModal reminder={selectedReminder} isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} />

        {/* Notes Modal */}
        <NotesModal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          selectedReminder={selectedReminder}
          notesText={notesText}
          setNotesText={setNotesText}
          savingNotes={savingNotes}
          saveNotes={saveNotes}
        />

        {/* Notes Detail Modal */}
        <NotesDetailModal
          isOpen={showNotesDetailModal}
          onClose={() => setShowNotesDetailModal(false)}
          reminder={selectedReminder}
        />
      </div>
    </div>
  )
}

export default Dashboard
