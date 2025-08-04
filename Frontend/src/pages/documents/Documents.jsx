"use client"
import { useState, useEffect } from "react"
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  FileIcon,
  Plus,
  Grid3X3,
  List,
  MoreVertical,
  X,
  Eye,
} from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import api from "../../services/api"
import { useAuthStore } from "../../stores/authStore"
import * as XLSX from "xlsx"

export default function Documents() {
  const { user, token } = useAuthStore()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [uploadModal, setUploadModal] = useState(false)
  const [previewModal, setPreviewModal] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)
  const [viewMode, setViewMode] = useState("grid")
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    file: null,
  })
  const [uploading, setUploading] = useState(false)
  const [filePreviewUrl, setFilePreviewUrl] = useState(null)
  const [excelData, setExcelData] = useState([])

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    const extension = uploadForm.file?.name?.split(".").pop()?.toLowerCase()
    if (uploadForm.file && ["xls", "xlsx"].includes(extension)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        setExcelData(json)
      }
      reader.readAsArrayBuffer(uploadForm.file)
    } else {
      setExcelData([])
    }
  }, [uploadForm.file])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get("/documents")
      console.log("data", response.data)
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      toast.error("Failed to fetch documents")
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (document) => {
    try {
      setPreviewDocument(document)
      setPreviewModal(true)
    } catch (error) {
      console.error("Preview error:", error)
      toast.error("Failed to preview document")
    }
  }

  const getStatusIcon = (status) => {
    const icons = {
      draft: <Clock className="h-4 w-4" />,
      pending_signature: <AlertCircle className="h-4 w-4" />,
      signed: <CheckCircle className="h-4 w-4" />,
      rejected: <AlertCircle className="h-4 w-4" />,
    }
    return icons[status] || icons.draft
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-amber-50 text-amber-700 border-amber-200",
      pending_signature: "bg-blue-50 text-blue-700 border-blue-200",
      signed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
    }
    return colors[status] || colors.draft
  }

  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return (
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
        )
      case "doc":
      case "docx":
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        )
      case "xls":
      case "xlsx":
        return (
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileIcon className="h-6 w-6 text-gray-600" />
          </div>
        )
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.title) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("title", uploadForm.title)
      formData.append("description", uploadForm.description)

      const response = await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success || response.data.document) {
        toast.success("Document uploaded successfully!")
        setUploadModal(false)
        setUploadForm({ title: "", description: "", file: null })
        await fetchDocuments()
        setFilePreviewUrl(null)
      }
    } catch (error) {
      const message = error.response?.data?.error || "Failed to upload document"
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (id, filename) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Document downloaded successfully!")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download document")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await api.delete(`/documents/${id}`)
      if (response.data.success) {
        toast.success("Document deleted successfully!")
        fetchDocuments()
      }
    } catch (error) {
      toast.error("Failed to delete document")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/60 rounded-2xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/60 rounded-2xl p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Document Center
              </h1>
              <p className="text-slate-600 text-lg">Manage, organize, and collaborate on your documents</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {documents.length} Documents
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {documents.filter((d) => d.status === "signed").length} Signed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-blue-500 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list" ? "bg-blue-500 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setUploadModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Upload Document
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-8 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700 min-w-[200px]"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_signature">Pending Signature</option>
                <option value="signed">Signed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        {filteredDocuments.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className={`group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-blue-200 transform hover:-translate-y-1 ${
                  viewMode === "list" ? "p-6" : "p-6"
                }`}
              >
                {viewMode === "grid" ? (
                  // Grid View
                  <>
                    <div className="flex items-start justify-between mb-4">
                      {getFileIcon(document.file_name)}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(document.status)}`}
                        >
                          {getStatusIcon(document.status)}
                          <span className="ml-1 capitalize">{document.status.replace("_", " ")}</span>
                        </span>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {document.title}
                      </h3>
                      {document.description && (
                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">{document.description}</p>
                      )}
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-xs text-slate-500 gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {document.uploaded_by_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(document.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{document.signature_count || 0} signature(s)</span>
                        <span className="truncate max-w-[120px]">{document.file_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(document)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(document.id, document.file_name)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                      {user?.role_name === "admin" && (
                        <button
                          onClick={() => handleDelete(document.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="flex items-center gap-4">
                    {getFileIcon(document.file_name)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{document.title}</h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}
                        >
                          {getStatusIcon(document.status)}
                          <span className="ml-1 capitalize">{document.status.replace("_", " ")}</span>
                        </span>
                      </div>
                      {document.description && (
                        <p className="text-slate-600 text-sm mb-2 line-clamp-1">{document.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>By {document.uploaded_by_name}</span>
                        <span>{format(new Date(document.created_at), "MMM dd, yyyy")}</span>
                        <span>{document.signature_count || 0} signature(s)</span>
                        <span className="truncate">{document.file_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(document)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(document.id, document.file_name)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {user?.role_name === "admin" && (
                        <button
                          onClick={() => handleDelete(document.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 text-center shadow-lg border border-white/20">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No documents found</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {filterStatus !== "all"
                ? "Try adjusting your filters to see more documents."
                : "Start by uploading your first document to get organized."}
            </p>
            {user?.role_name === "admin" && (
              <button
                onClick={() => setUploadModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Upload First Document
              </button>
            )}
          </div>
        )}

        {/* FIXED: Upload Modal - Better UX/UI */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col transform transition-all">
              {/* Header - Fixed */}
              <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
                      <p className="text-slate-600 text-sm">Add a new document to your collection</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadModal(false)
                      setUploadForm({ title: "", description: "", file: null })
                      setFilePreviewUrl(null)
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Form Fields */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Document Title *</label>
                        <input
                          type="text"
                          value={uploadForm.title}
                          onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Enter document title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Description</label>
                        <textarea
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                          placeholder="Brief description of the document"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Choose File *</label>
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            setUploadForm({ ...uploadForm, file })
                            if (file) {
                              const previewUrl = URL.createObjectURL(file)
                              setFilePreviewUrl(previewUrl)
                            } else {
                              setFilePreviewUrl(null)
                            }
                          }}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                          required
                        />
                      </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-4">
                      {filePreviewUrl && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Preview</label>
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-96 overflow-hidden">
                            {/* PDF Preview */}
                            {uploadForm.file?.type === "application/pdf" ? (
                              <div className="w-full h-full">
                                <iframe
                                  src={filePreviewUrl}
                                  className="w-full h-full rounded-lg border border-slate-300"
                                  title="PDF Preview"
                                  onError={(e) => {
                                    console.error("PDF preview error:", e)
                                    e.target.style.display = "none"
                                    const fallback = document.createElement("div")
                                    fallback.innerHTML = `
                                      <div class="flex flex-col items-center justify-center h-full text-center">
                                        <div class="text-slate-500 mb-4">
                                          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                          </svg>
                                        </div>
                                        <h3 class="text-lg font-semibold text-slate-900 mb-2">Preview not available</h3>
                                        <p class="text-slate-600 mb-4">File will be uploaded successfully</p>
                                        <p class="text-sm text-slate-500">${uploadForm.file?.name}</p>
                                      </div>
                                    `
                                    e.target.parentNode.appendChild(fallback)
                                  }}
                                />
                              </div>
                            ) : uploadForm.file?.type?.startsWith("image/") ? (
                              // Image Preview
                              <img
                                src={filePreviewUrl || "/placeholder.svg"}
                                alt="Preview"
                                className="w-full h-full rounded-lg object-contain border border-slate-300"
                              />
                            ) : ["xls", "xlsx"].includes(uploadForm.file?.name.split(".").pop()?.toLowerCase()) ? (
                              // Excel Preview
                              <div className="overflow-auto h-full border border-slate-300 rounded">
                                <table className="table-auto w-full text-sm text-left border-collapse">
                                  <tbody>
                                    {excelData.slice(0, 20).map((row, rowIndex) => (
                                      <tr key={rowIndex}>
                                        {row.slice(0, 6).map((cell, i) => (
                                          <td key={i} className="border px-2 py-1 text-xs">
                                            {String(cell).substring(0, 20)}
                                            {String(cell).length > 20 ? "..." : ""}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {excelData.length > 20 && (
                                  <div className="text-center text-xs text-slate-500 p-2">
                                    ... and {excelData.length - 20} more rows
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Default file info
                              <div className="flex flex-col items-center justify-center h-full text-center">
                                <FileText className="w-16 h-16 text-slate-400 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">File Ready</h3>
                                <p className="text-slate-600 mb-2">{uploadForm.file?.name}</p>
                                <p className="text-sm text-slate-500">
                                  {(uploadForm.file?.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer - Fixed */}
              <div className="flex-shrink-0 p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModal(false)
                      setUploadForm({ title: "", description: "", file: null })
                      setFilePreviewUrl(null)
                    }}
                    className="px-6 py-3 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold transition-colors"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadForm.file || !uploadForm.title}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIXED: Preview Modal */}
        {previewModal && previewDocument && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{previewDocument.title}</h3>
                    <p className="text-slate-600 text-sm">{previewDocument.file_name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewModal(false)
                      setPreviewDocument(null)
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden p-6">
                <div className="w-full h-full border border-slate-200 rounded-xl overflow-hidden">
                  <iframe
                    src={`/api/documents/${previewDocument.id}/view`}
                    className="w-full h-full"
                    title="Document Preview"
                    onError={(e) => {
                      console.error("Preview error:", e)
                      e.target.style.display = "none"
                      const fallback = document.createElement("div")
                      fallback.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-center p-8">
                          <div class="text-slate-500 mb-4">
                            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                          </div>
                          <h3 class="text-lg font-semibold text-slate-900 mb-2">Preview not available</h3>
                          <p class="text-slate-600 mb-4">Unable to preview this document in browser</p>
                          <button onclick="window.open('/api/documents/${previewDocument.id}/view', '_blank')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Open in New Tab
                          </button>
                        </div>
                      `
                      e.target.parentNode.appendChild(fallback)
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => handleDownload(previewDocument.id, previewDocument.file_name)}
                    className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
