const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { testConnection } = require("./config/db")
const Router = require("./router/index.js")
const bodyParser = require("body-parser")
const path = require("path")
const { fileDir } = require("./utils/file_handler.cjs")

dotenv.config()
require("./services/cron") // Import cron job scheduler

const app = express()

// Enhanced CORS for production with better error handling
app.use(
  cors({
    origin: [
      "https://kpppelh.com",
      "https://www.kpppelh.com",
      "https://api.kpppelh.com",
      "http://148.230.96.19:5173", // untuk development
      "http://localhost:5173", // untuk local development
      "http://127.0.0.1:5173", // alternative localhost
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token", "Accept", "Origin", "X-Requested-With"],
    exposedHeaders: ["Content-Disposition", "Content-Length", "Content-Type"],
    optionsSuccessStatus: 200 // untuk legacy browsers
  })
)

// Handle preflight OPTIONS requests - FIXED: Use named parameter
app.options('/{*path}', cors())

// Enhanced middleware untuk production
app.use((req, res, next) => {
  // Add additional CORS headers for stubborn browsers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  // Set proper MIME types untuk PDF files
  if (req.path.endsWith(".pdf")) {
    res.setHeader("Content-Type", "application/pdf")
  }
  if (req.path.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript")
  }
  
  // Log untuk debugging (hanya di development)
  if (process.env.NODE_ENV !== "production") {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`)
  }
  
  next()
})

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(bodyParser.json({ limit: '10mb' }))

// Serve static files dengan proper headers
app.use(
  "/files",
  express.static(fileDir(), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", "inline")
        res.setHeader("Access-Control-Allow-Origin", "*")
      }
    },
  })
)

// Health check endpoint - harus sebelum Router
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: process.env.APP_PORT || 4000,
    environment: process.env.NODE_ENV || "development",
    filesDir: fileDir(),
  })
})

// Main router - pastikan ini tidak conflict dengan health check
app.use(Router)

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack)
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: "CORS Error",
      message: "Cross-origin request blocked"
    })
  }
  
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler - FIXED: Use named parameter for wildcard
app.use("/{*path}", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method
  })
})

// Start server with better error handling
const startServer = async () => {
  try {
    const dbConnection = await testConnection()
    
    app.listen(process.env.APP_PORT || 4000, () => {
      console.log(`🔍 Database:`, dbConnection)
      console.log(`⚡️ Server: Running at http://localhost:${process.env.APP_PORT || 4000}`)
      console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`📂 Files directory: ${fileDir()}`)
      
      // Show available endpoints
      console.log(`🌐 Available endpoints:`)
      console.log(`   GET  /health`)
      console.log(`   ALL  /api/* (via Router)`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')  
  process.exit(0)
})