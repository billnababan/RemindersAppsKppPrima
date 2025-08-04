"use client"

import { useState, useEffect } from "react"
import api from "../../services/api"
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  CheckCircle,
  Activity,
  Zap,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"

const Analytics = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7days")
  const [analytics, setAnalytics] = useState({
    overview: {
      totalReminders: 0,
      sentToday: 0,
      completionRate: 0,
      activeUsers: 0,
    },
    trends: [],
    priorities: [],
    departments: [],
    recentActivity: [],
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/analytics?range=${dateRange}`)
      setAnalytics(
        response.data || {
          overview: {
            totalReminders: 156,
            sentToday: 23,
            completionRate: 87.5,
            activeUsers: 45,
          },
          trends: [
            { date: "2024-01-01", sent: 12, completed: 10 },
            { date: "2024-01-02", sent: 18, completed: 15 },
            { date: "2024-01-03", sent: 25, completed: 22 },
            { date: "2024-01-04", sent: 15, completed: 13 },
            { date: "2024-01-05", sent: 30, completed: 26 },
            { date: "2024-01-06", sent: 22, completed: 19 },
            { date: "2024-01-07", sent: 28, completed: 25 },
          ],
          priorities: [
            { name: "Low", count: 45, color: "bg-green-500" },
            { name: "Medium", count: 67, color: "bg-yellow-500" },
            { name: "High", count: 32, color: "bg-orange-500" },
            { name: "Urgent", count: 12, color: "bg-red-500" },
          ],
          departments: [
            { name: "IT Department", count: 45, completion: 92 },
            { name: "HR Department", count: 38, completion: 85 },
            { name: "Finance", count: 29, completion: 78 },
            { name: "Operations", count: 44, completion: 88 },
          ],
          recentActivity: [
            { type: "sent", user: "John Doe", action: "sent reminder", time: "2 minutes ago", priority: "high" },
            {
              type: "completed",
              user: "Jane Smith",
              action: "completed task",
              time: "5 minutes ago",
              priority: "medium",
            },
            { type: "sent", user: "Admin", action: "broadcast reminder", time: "10 minutes ago", priority: "urgent" },
            {
              type: "completed",
              user: "Bob Wilson",
              action: "completed task",
              time: "15 minutes ago",
              priority: "low",
            },
          ],
        },
      )
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 group">
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        }}
      ></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl shadow-lg`} style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-8 w-8" style={{ color }} />
          </div>
          {trend && (
            <div
              className={`flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                trend.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              <TrendingUp className={`h-3 w-3 mr-1 ${trend.positive ? "" : "rotate-180"}`} />
              {trend.value}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{title}</h3>
          <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  const PriorityChart = ({ data }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Priority Distribution</h3>
          <p className="text-gray-600">Breakdown by priority levels</p>
        </div>
        <Target className="h-8 w-8 text-purple-600" />
      </div>
      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${item.color} shadow-lg`}></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{item.name}</span>
                <span className="text-sm font-bold text-gray-600">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${item.color} shadow-sm transition-all duration-1000`}
                  style={{ width: `${(item.count / Math.max(...data.map((d) => d.count))) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const ActivityFeed = ({ activities }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Live Activity</h3>
          <p className="text-gray-600">Real-time system updates</p>
        </div>
        <Activity className="h-8 w-8 text-green-600" />
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors duration-200"
          >
            <div className={`p-2 rounded-xl ${activity.type === "sent" ? "bg-blue-100" : "bg-green-100"}`}>
              {activity.type === "sent" ? (
                <MessageSquare className={`h-5 w-5 ${activity.type === "sent" ? "text-blue-600" : "text-green-600"}`} />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{activity.user}</p>
              <p className="text-sm text-gray-600">{activity.action}</p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  activity.priority === "urgent"
                    ? "bg-red-100 text-red-800"
                    : activity.priority === "high"
                      ? "bg-orange-100 text-orange-800"
                      : activity.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                }`}
              >
                {activity.priority}
              </span>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
          <p className="text-gray-600 font-semibold">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600">Comprehensive insights and performance metrics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
            <button
              onClick={fetchAnalytics}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300">
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Reminders"
            value={analytics.overview.totalReminders}
            subtitle="All time reminders sent"
            icon={MessageSquare}
            color="#8B5CF6"
            trend={{ positive: true, value: "+12%" }}
          />
          <StatCard
            title="Sent Today"
            value={analytics.overview.sentToday}
            subtitle="Reminders sent today"
            icon={Zap}
            color="#06B6D4"
            trend={{ positive: true, value: "+8%" }}
          />
          <StatCard
            title="Completion Rate"
            value={`${analytics.overview.completionRate}%`}
            subtitle="Average completion rate"
            icon={Target}
            color="#10B981"
            trend={{ positive: true, value: "+5%" }}
          />
          <StatCard
            title="Active Users"
            value={analytics.overview.activeUsers}
            subtitle="Users active this week"
            icon={Users}
            color="#F59E0B"
            trend={{ positive: false, value: "-2%" }}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PriorityChart data={analytics.priorities} />

          {/* Department Performance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Department Performance</h3>
                <p className="text-gray-600">Completion rates by department</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-6">
              {analytics.departments.map((dept, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{dept.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-600">{dept.count} reminders</span>
                      <p className="text-xs text-gray-500">{dept.completion}% completed</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm transition-all duration-1000"
                      style={{ width: `${dept.completion}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={analytics.recentActivity} />

        {/* Trends Chart Placeholder */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Reminder Trends</h3>
              <p className="text-gray-600">Daily reminder activity over time</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Interactive Chart Coming Soon</p>
              <p className="text-sm text-gray-500">Advanced visualization will be available in the next update</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
