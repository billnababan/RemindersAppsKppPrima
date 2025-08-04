"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Rnd } from "react-rnd"

// FIXED: Improved PDF.js loading
const loadPDFJS = async () => {
  if (typeof window !== "undefined" && !window.pdfjsLib) {
    try {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
      script.async = true

      const loadPromise = new Promise((resolve, reject) => {
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
          resolve(window.pdfjsLib)
        }
        script.onerror = () => reject(new Error("Failed to load PDF.js"))
        setTimeout(() => reject(new Error("PDF.js loading timeout")), 15000)
      })

      document.head.appendChild(script)
      return await loadPromise
    } catch (error) {
      console.error("PDF.js loading error:", error)
      throw error
    }
  }
  return window.pdfjsLib
}

export default function DocumentViewer({ pdfUrl, signatureData, onPlacementChange, initialPlacement }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [pdfLib, setPdfLib] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(initialPlacement?.page || 1)
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signaturePos, setSignaturePos] = useState({
    x: initialPlacement?.x || 50,
    y: initialPlacement?.y || 50,
    width: initialPlacement?.width || 150,
    height: initialPlacement?.height || 50,
  })

  // Load PDF.js library
  useEffect(() => {
    const initPDFJS = async () => {
      try {
        setLoading(true)
        setError(null)
        const lib = await loadPDFJS()
        setPdfLib(lib)
      } catch (error) {
        console.error("Failed to load PDF.js:", error)
        setError("Failed to load PDF viewer. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }
    initPDFJS()
  }, [])

  // Load PDF document
  useEffect(() => {
    if (!pdfLib || !pdfUrl) return

    const loadPDF = async () => {
      try {
        setLoading(true)
        setError(null)

        const loadingTask = pdfLib.getDocument({
          url: pdfUrl,
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
          httpHeaders: {
            Accept: "application/pdf,*/*",
          },
          maxImageSize: 1024 * 1024,
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
        })

        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setNumPages(pdf.numPages)

        if (pageNumber > pdf.numPages) {
          setPageNumber(1)
        }

        console.log(`PDF loaded successfully: ${pdf.numPages} pages`)
      } catch (error) {
        console.error("Error loading PDF:", error)
        setError(`Failed to load PDF document: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadPDF()
  }, [pdfLib, pdfUrl])

  // FIXED: Improved page rendering without flickering
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    const renderPage = async () => {
      try {
        setError(null)
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (!context) {
          throw new Error("Cannot get canvas context")
        }

        // Get page
        const page = await pdfDoc.getPage(pageNumber)
        const viewport = page.getViewport({ scale })

        // FIXED: Proper canvas sizing for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1
        const scaledViewport = page.getViewport({ scale: scale * devicePixelRatio })

        // Set actual canvas size
        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        // Set display size
        canvas.style.width = viewport.width + "px"
        canvas.style.height = viewport.height + "px"

        // Scale context for device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio)

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)

        setPageDimensions({ width: viewport.width, height: viewport.height })

        // Render page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise
        console.log(`Page ${pageNumber} rendered successfully`)
      } catch (error) {
        console.error("Error rendering page:", error)
        setError(`Failed to render page ${pageNumber}: ${error.message}`)
      }
    }

    renderPage()
  }, [pdfDoc, pageNumber, scale])

  // Report placement changes
  useEffect(() => {
    if (onPlacementChange) {
      onPlacementChange({
        x: signaturePos.x,
        y: signaturePos.y,
        page: pageNumber,
        width: signaturePos.width,
        height: signaturePos.height,
      })
    }
  }, [signaturePos, pageNumber, onPlacementChange])

  const handleDragStop = useCallback((e, d) => {
    setSignaturePos((prev) => ({ ...prev, x: d.x, y: d.y }))
  }, [])

  const handleResizeStop = useCallback((e, direction, ref, delta, position) => {
    setSignaturePos({
      x: position.x,
      y: position.y,
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    })
  }, [])

  const changePage = (offset) => {
    const newPage = pageNumber + offset
    const targetPage = Math.max(1, Math.min(newPage, numPages || 1))
    if (targetPage !== pageNumber) {
      setPageNumber(targetPage)
    }
  }

  const previousPage = () => changePage(-1)
  const nextPage = () => changePage(1)
  const zoomIn = () => setScale((prevScale) => Math.min(prevScale * 1.2, 3))
  const zoomOut = () => setScale((prevScale) => Math.max(prevScale / 1.2, 0.5))

  if (loading) {
    return (
      <div className="relative w-full h-[600px] border border-slate-300 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading PDF viewer...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full h-[600px] border border-slate-300 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">PDF Loading Error</h3>
          <p className="text-slate-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Reload Page
            </button>
            <p className="text-xs text-slate-500">If the problem persists, try opening the document in a new tab</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[600px] border border-slate-300 rounded-xl overflow-hidden bg-slate-100 flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-md">
            <span className="text-sm font-medium">
              Page {pageNumber || 1} of {numPages || "--"}
            </span>
          </div>

          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 rounded-md hover:bg-slate-100 transition-colors" title="Zoom out">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm font-medium px-2">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-2 rounded-md hover:bg-slate-100 transition-colors" title="Zoom in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-50">
        <div className="relative shadow-lg border border-slate-200 bg-white rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block max-w-full h-auto"
            style={{
              backgroundColor: "white",
              imageRendering: "crisp-edges",
            }}
          />

          {/* Signature Overlay */}
          {signatureData && pageDimensions.width > 0 && pageDimensions.height > 0 && (
            <Rnd
              size={{ width: signaturePos.width, height: signaturePos.height }}
              position={{ x: signaturePos.x, y: signaturePos.y }}
              onDragStop={handleDragStop}
              onResizeStop={handleResizeStop}
              bounds="parent"
              minWidth={50}
              minHeight={20}
              lockAspectRatio={false}
              className="border-2 border-blue-500 border-dashed bg-blue-50/50 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <img
                src={signatureData || "/placeholder.svg"}
                alt="Signature to place"
                className="w-full h-full object-contain p-1"
                draggable={false}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
                Drag & Resize Signature
              </div>
            </Rnd>
          )}
        </div>
      </div>

      {/* Page info footer */}
      {numPages > 1 && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">Use the navigation buttons above to view all {numPages} pages</p>
        </div>
      )}
    </div>
  )
}
