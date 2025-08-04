"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  PenTool,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  X,
  Save,
  RotateCcw,
  User,
  Calendar,
  FileIcon,
  KeyIcon as SignatureIcon,
  Send,
  ChevronDown,
} from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import api from "../../services/api"
import { useAuthStore } from "../../stores/authStore"
import DocumentViewer from "../../components/DocumentViewer"

// --- Helper Functions ---
const formatDate = (date, formatStr) => {
  try {
    const parsed = new Date(date)
    if (isNaN(parsed)) return "-"
    return format(parsed, formatStr)
  } catch {
    return "-"
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case "signed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "pending_signature":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200"
    case "draft":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-slate-50 text-slate-700 border-slate-200"
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case "signed":
      return <CheckCircle className="w-4 h-4" />
    case "pending_signature":
      return <Clock className="w-4 h-4" />
    case "rejected":
      return <AlertTriangle className="w-4 h-4" />
    case "draft":
      return <FileText className="w-4 h-4" />
    default:
      return <FileText className="w-4 h-4" />
  }
}

const getFileIcon = (fileName) => {
  if (!fileName)
    return (
      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
        <FileIcon className="h-8 w-8 text-slate-600" />
      </div>
    )
  const extension = fileName.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "pdf":
      return (
        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
          <FileText className="h-8 w-8 text-red-600" />
        </div>
      )
    case "doc":
    case "docx":
      return (
        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
      )
    case "xls":
    case "xlsx":
      return (
        <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
          <FileText className="h-8 w-8 text-green-600" />
        </div>
      )
    default:
      return (
        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
          <FileIcon className="h-8 w-8 text-slate-600" />
        </div>
      )
  }
}

// --- Signature Pad Component ---
const SignaturePad = ({ onSignatureChange, className = "" }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState(null)

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.strokeStyle = "#1e40af"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onSignatureChange("")
  }, [onSignatureChange])

  useEffect(() => {
    initializeCanvas()
    window.addEventListener("resize", initializeCanvas)
    return () => window.removeEventListener("resize", initializeCanvas)
  }, [initializeCanvas])

  const getEventPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const pos = getEventPos(e)
    setLastPoint(pos)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing || !lastPoint) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const currentPoint = getEventPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()
    setLastPoint(currentPoint)

    const signatureData = canvas.toDataURL()
    onSignatureChange(signatureData)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPoint(null)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onSignatureChange("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-48 border-2 border-dashed border-blue-300 rounded-xl cursor-crosshair touch-none bg-white hover:border-blue-400 transition-colors"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-600">Draw your signature above</label>
        <button
          type="button"
          onClick={clearCanvas}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-600 px-4 py-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear
        </button>
      </div>
    </div>
  )
}

// --- Document Card Component ---
const DocumentCard = ({ document, onView, onSign }) => {
  return (
    <div className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-blue-200 transform hover:-translate-y-1 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          {getFileIcon(document.file_name)}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(document.status)}`}
          >
            {getStatusIcon(document.status)}
            <span className="ml-1 capitalize">{document.status?.replace("_", " ") || "Unknown"}</span>
          </span>
        </div>
        <div className="space-y-3 mb-6">
          <h3 className="text-xl font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {document.title || "Untitled Document"}
          </h3>
          {document.description && (
            <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{document.description}</p>
          )}
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-slate-500 gap-4">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {document.uploaded_by_name || "Unknown"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(document.created_at, "MMM dd")}
            </span>
          </div>
          <div className="text-xs text-slate-400 truncate">{document.file_name || "No filename"}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            onClick={() => onView(document)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg hover:shadow-xl"
            onClick={() => onSign(document)}
          >
            <PenTool className="h-4 w-4" />
            Sign Now
          </button>
        </div>
      </div>
    </div>
  )
}

// --- View Document Modal ---
const ViewDocumentModal = ({ document, onClose, onSign }) => {
  const [documentDetails, setDocumentDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        setLoading(true)
        // FIXED: Correct API endpoint
        const response = await api.get(`/documents/${document.id}`)
        if (response.data.success) {
          setDocumentDetails(response.data.document)
        }
      } catch (error) {
        console.error("Failed to fetch document details:", error)
        toast.error("Failed to load document details")
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentDetails()
  }, [document.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-lg">
        <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Eye className="h-6 w-6" />
            Document Preview
          </h2>
          <p className="text-slate-600">Review document details and signatures</p>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading document details...</p>
            </div>
          ) : (
            <>
              {/* Document Info */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-slate-900 mb-3">
                  {documentDetails?.title || document.title || "Untitled Document"}
                </h4>
                <p className="text-slate-600 mb-4">
                  {documentDetails?.description || document.description || "No description available"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">Uploaded by:</span>
                    <br />
                    {documentDetails?.uploaded_by_name || document.uploaded_by_name || "Unknown"}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <br />
                    {formatDate(documentDetails?.created_at || document.created_at, "MMMM dd, yyyy")}
                  </div>
                  <div>
                    <span className="font-medium">File:</span>
                    <br />
                    <span className="truncate">
                      {documentDetails?.file_name || document.file_name || "No filename"}
                    </span>
                  </div>
                </div>
              </div>

              {/* PDF Preview */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Document Preview</h4>
                <div className="w-full h-[500px] border border-slate-200 rounded-xl overflow-hidden">
                  <iframe
                    src={`/api/documents/${document.id}/view`}
                    className="w-full h-full"
                    title="Document Preview"
                    onError={(e) => {
                      console.error("PDF preview error:", e)
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
                          <button onclick="window.open('/api/documents/${document.id}/view', '_blank')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Open in New Tab
                          </button>
                        </div>
                      `
                      e.target.parentNode.appendChild(fallback)
                    }}
                  />
                </div>
              </div>

              {/* Signatures */}
              {documentDetails?.signatures && documentDetails.signatures.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Signatures</h4>
                  <div className="space-y-3">
                    {documentDetails.signatures.map((signature, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{signature.signer_name || "Unknown Signer"}</p>
                            <p className="text-sm text-slate-600">{signature.signer_position || "No position"}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                signature.status === "signed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {signature.status === "signed" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <X className="w-3 h-3 mr-1" />
                              )}
                              {signature.status || "Unknown"}
                            </span>
                            {signature.signed_at && (
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDate(signature.signed_at, "MMM dd, yyyy HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                        {signature.notes && <p className="text-sm text-slate-600 mt-2 italic">"{signature.notes}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-8 py-6 border-t border-slate-200 flex justify-end gap-4 rounded-b-3xl bg-slate-50">
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 px-4 py-2"
            onClick={onClose}
          >
            Close
          </button>
          {(document.status === "draft" || document.status === "pending_signature") && (
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2"
              onClick={() => {
                onClose()
                onSign(document)
              }}
            >
              Sign Document
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Template Management Modal
const TemplateManagementModal = ({ templates, onClose, onRefreshTemplates }) => {
  const [templateName, setTemplateName] = useState("")
  const [newSignatureData, setNewSignatureData] = useState("")
  const [signatureImage, setSignatureImage] = useState(null)
  const [activeTab, setActiveTab] = useState("draw")
  const [saving, setSaving] = useState(false)

  const handleSaveTemplate = async () => {
    const signatureToSave = activeTab === "draw" ? newSignatureData : signatureImage
    if (!templateName || !signatureToSave) {
      toast.error("Please provide template name and signature")
      return
    }

    try {
      setSaving(true)
      // FIXED: Correct API endpoint
      const response = await api.post("/templates", {
        name: templateName,
        signature_data: signatureToSave,
      })

      if (response.data.success) {
        toast.success("Signature template saved successfully!")
        setTemplateName("")
        setNewSignatureData("")
        setSignatureImage(null)
        setActiveTab("draw")
        onRefreshTemplates()
        onClose()
      }
    } catch (error) {
      console.error("Failed to save template:", error)
      const message = error.response?.data?.error || "Failed to save template"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return

    try {
      // FIXED: Correct API endpoint
      const response = await api.delete(`/templates/${templateId}`)
      if (response.data.success) {
        toast.success("Template deleted successfully!")
        onRefreshTemplates()
      }
    } catch (error) {
      console.error("Failed to delete template:", error)
      const message = error.response?.data?.message || error.response?.data?.error || "Failed to delete template"
      toast.error(message)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setSignatureImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-lg">
        <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-slate-900">Signature Templates</h2>
          <p className="text-slate-600">Create and manage your digital signature templates</p>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="p-8 space-y-8">
          {/* Existing Templates */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Your Templates</h3>
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-6 rounded-2xl border-2 border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">{template.name || "Unnamed Template"}</h4>
                      <button
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-white hover:bg-red-600 h-8 w-8 p-0"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="bg-white rounded-xl p-4 h-20 flex items-center justify-center border border-slate-100">
                      {template.signature_data ? (
                        <img
                          src={template.signature_data || "/placeholder.svg"}
                          alt={template.name}
                          className="max-h-16 object-contain"
                        />
                      ) : (
                        <SignatureIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-4">
                      Created {formatDate(template.created_at, "MMM dd, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
                <SignatureIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No signature templates found. Create your first template below.</p>
              </div>
            )}
          </div>

          {/* Create New Template */}
          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-xl font-semibold mb-6">Create New Template</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium leading-none mb-3">
                  Template Name
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Toggle Signature Method */}
              <div>
                <label className="block text-sm font-medium leading-none mb-3">Choose Signature Method</label>
                <div className="w-full">
                  <div className="grid w-full grid-cols-2 bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setActiveTab("draw")}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                        activeTab === "draw" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      Draw Signature
                    </button>
                    <button
                      onClick={() => setActiveTab("upload")}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                        activeTab === "upload" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      Upload Image
                    </button>
                  </div>
                  <div className="mt-4">
                    {activeTab === "draw" && <SignaturePad onSignatureChange={setNewSignatureData} />}
                    {activeTab === "upload" && (
                      <div>
                        <label htmlFor="signature-image-upload" className="block text-sm font-medium leading-none mb-3">
                          Upload Signature Image
                        </label>
                        <input
                          id="signature-image-upload"
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {signatureImage && (
                          <div className="mt-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
                            <p className="text-sm text-slate-600 mb-2">Preview:</p>
                            <img
                              src={signatureImage || "/placeholder.svg"}
                              alt="Signature preview"
                              className="w-auto h-32 object-contain border border-slate-300 rounded-xl"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 px-4 py-2"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving || !templateName || (activeTab === "draw" ? !newSignatureData : !signatureImage)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sign Document Modal
const SignDocumentModal = ({ document, templates, user, onClose }) => {
  const [signatureNotes, setSignatureNotes] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [documentPdfUrl, setDocumentPdfUrl] = useState(null)
  const [signaturePlacement, setSignaturePlacement] = useState({
    x: 50,
    y: 50,
    page: 1,
    width: 150,
    height: 50,
  })

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true)
        // FIXED: Correct API endpoint
        const response = await api.get(`/documents/${document.id}/view`, {
          responseType: "blob",
          headers: {
            Accept: "application/pdf",
          },
        })
        const blob = new Blob([response.data], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        setDocumentPdfUrl(url)
      } catch (error) {
        console.error("Failed to fetch document for preview:", error)
        toast.error("Failed to load document preview. Please check your connection.")
        setDocumentPdfUrl(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPdf()

    return () => {
      if (documentPdfUrl) {
        URL.revokeObjectURL(documentPdfUrl)
      }
    }
  }, [document.id])

  const handleSign = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a signature template.")
      return
    }
    if (!selectedTemplate.signature_data) {
      toast.error("Selected template has no signature data.")
      return
    }
    if (!signaturePlacement) {
      toast.error("Please place your signature on the document.")
      return
    }

    try {
      setLoading(true)
      // FIXED: Correct API endpoint
      const response = await api.post(`/sign/${document.id}`, {
        documentId: document.id,
        user_id: user.id,
        signature_template_id: selectedTemplate.id,
        notes: signatureNotes,
        signaturePlacement: signaturePlacement,
      })

      if (response.data.success) {
        toast.success("Document signed successfully!")
        onClose()
      } else {
        toast.error(response.data.message || "Failed to sign document.")
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || "Failed to sign document."
      toast.error(message)
      console.error("Signing error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this document?")) return

    try {
      setLoading(true)
      // FIXED: Correct API endpoint
      const response = await api.post(`/reject/${document.id}`, {
        notes: signatureNotes,
      })

      if (response.data.success) {
        toast.success("Document rejected successfully!")
        onClose()
      }
    } catch (error) {
      const message = error.response?.data?.error || "Failed to reject document."
      toast.error(message)
      console.error("Rejecting error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-lg">
        <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <PenTool className="h-6 w-6" />
            Sign Document
          </h2>
          <p className="text-slate-600">Review and electronically sign the document</p>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="p-8 space-y-8">
          {/* Document Info */}
          <div className="bg-slate-50 p-6 rounded-2xl">
            <h4 className="text-xl font-bold text-slate-900 mb-3">{document.title || "Untitled Document"}</h4>
            <p className="text-slate-600 mb-4">{document.description || "No description available"}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
              <div>
                <span className="font-medium">Uploaded by:</span>
                <br />
                {document.uploaded_by_name || "Unknown"}
              </div>
              <div>
                <span className="font-medium">Date:</span>
                <br />
                {formatDate(document.created_at, "MMMM dd, yyyy")}
              </div>
              <div>
                <span className="font-medium">File:</span>
                <br />
                <span className="truncate">{document.file_name || "No filename"}</span>
              </div>
            </div>
          </div>

          {/* Document Preview Section */}
          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-xl font-semibold mb-6">Document Preview & Signature Placement</h3>
            {documentPdfUrl ? (
              <DocumentViewer
                pdfUrl={documentPdfUrl}
                signatureData={selectedTemplate?.signature_data || null}
                onPlacementChange={setSignaturePlacement}
                initialPlacement={signaturePlacement}
              />
            ) : (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Loading document preview...</p>
              </div>
            )}
          </div>

          {/* Signature Selection */}
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-4">Select Signature Template</label>
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-6 rounded-2xl cursor-pointer transition-all border-2 ${
                      selectedTemplate?.id === template.id
                        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                        : "border-slate-200 hover:shadow-lg hover:border-slate-300"
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">{template.name || "Unnamed Template"}</h4>
                      {selectedTemplate?.id === template.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div className="bg-white rounded-xl p-4 h-20 flex items-center justify-center border border-slate-100">
                      {template.signature_data ? (
                        <img
                          src={template.signature_data || "/placeholder.svg"}
                          alt="Signature"
                          className="max-h-16 object-contain"
                        />
                      ) : (
                        <SignatureIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-4">
                      Created {formatDate(template.created_at, "MMM dd, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
                <SignatureIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="mb-4">No signature templates available.</p>
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 px-4 py-2"
                  onClick={() => toast.error("Please create a template first via 'Manage Templates'.")}
                >
                  Create Template
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="signature-notes" className="block text-lg font-semibold text-slate-700 mb-3">
              Notes (Optional)
            </label>
            <textarea
              id="signature-notes"
              value={signatureNotes}
              onChange={(e) => setSignatureNotes(e.target.value)}
              placeholder="Add any notes about this signature..."
              rows={4}
              className="flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-200 flex justify-end gap-4 rounded-b-3xl bg-slate-50">
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-white hover:bg-red-600 px-4 py-2"
            onClick={handleReject}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </button>
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 px-4 py-2"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={loading || !selectedTemplate || !selectedTemplate.signature_data}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Sign Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main ESign Component ---
export default function ESignPage() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState([])
  const [signatureTemplates, setSignatureTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Modals state
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      // FIXED: Correct API endpoint
      const response = await api.get("/documents")
      if (response.data.success) {
        const signingDocuments =
          response.data.documents?.filter((doc) => doc.status === "draft" || doc.status === "pending_signature") || []
        setDocuments(signingDocuments)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      const message = error.response?.data?.error || "Failed to fetch documents"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSignatureTemplates = async () => {
    try {
      // FIXED: Correct API endpoint
      const response = await api.get("/templates")
      if (response.data.success) {
        setSignatureTemplates(response.data.templates || [])
      }
    } catch (error) {
      console.error("Failed to fetch signature templates:", error)
      const message = error.response?.data?.error || "Failed to fetch signature templates"
      toast.error(message)
    }
  }

  useEffect(() => {
    fetchDocuments()
    fetchSignatureTemplates()
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleOpenSignModal = (document) => {
    setSelectedDocument(document)
    setSignModalOpen(true)
  }

  const handleCloseSignModal = () => {
    setSignModalOpen(false)
    setSelectedDocument(null)
    fetchDocuments() // Refresh documents after signing/rejecting
  }

  const handleOpenViewModal = (document) => {
    setSelectedDocument(document)
    setViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setViewModalOpen(false)
    setSelectedDocument(null)
  }

  const handleOpenTemplateModal = () => {
    setTemplateModalOpen(true)
  }

  const handleCloseTemplateModal = () => {
    setTemplateModalOpen(false)
    fetchSignatureTemplates() // Refresh templates after saving/deleting
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-40 w-full rounded-3xl animate-pulse bg-gray-200" />
          <div className="h-24 w-full rounded-2xl animate-pulse bg-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 w-full rounded-2xl animate-pulse bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Electronic Signature
              </h1>
              <p className="text-slate-600 text-lg">
                Review and sign documents electronically with secure digital signatures
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {documents.length} Documents Pending
                </span>
                <span className="flex items-center gap-1">
                  <SignatureIcon className="h-4 w-4" />
                  {signatureTemplates.length} Templates
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleOpenTemplateModal}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-transparent hover:bg-gray-50 text-slate-700 px-6 py-3"
              >
                <PenTool className="h-5 w-5 mr-2" />
                Manage Templates
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-6 shadow-lg border border-white/20 bg-white/80 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents to sign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-12 pr-4 py-4"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-12 pr-8 py-4 min-w-[200px] appearance-none"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_signature">Pending Signature</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onView={handleOpenViewModal}
                onSign={handleOpenSignModal}
              />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center shadow-lg border border-white/20 bg-white/80 backdrop-blur-sm rounded-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PenTool className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No documents to sign</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "All documents have been signed or there are no documents available for signing."}
            </p>
          </div>
        )}

        {/* Modals */}
        {viewModalOpen && selectedDocument && (
          <ViewDocumentModal document={selectedDocument} onClose={handleCloseViewModal} onSign={handleOpenSignModal} />
        )}

        {templateModalOpen && (
          <TemplateManagementModal
            templates={signatureTemplates}
            onClose={handleCloseTemplateModal}
            onRefreshTemplates={fetchSignatureTemplates}
          />
        )}

        {signModalOpen && selectedDocument && (
          <SignDocumentModal
            document={selectedDocument}
            templates={signatureTemplates}
            user={user}
            onClose={handleCloseSignModal}
          />
        )}
      </div>
    </div>
  )
}
