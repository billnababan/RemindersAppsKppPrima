const express = require("express")
const {
  getEsignDocuments,
  getSignatureTemplates,
  createSignatureTemplate,
  deleteSignatureTemplate,
  signDocument,
  rejectDocument,
  getEsignDocumentsById,
  getDocumentView,
} = require("../../controller/esignController")
const { authMiddleware } = require("../../middleware/auth")

const esignRouter = express.Router()

// Get documents for e-signing
esignRouter.get("/documents", authMiddleware, getEsignDocuments)
esignRouter.get("/documents/:id", authMiddleware, getEsignDocumentsById)
esignRouter.get("/documents/:id/view", authMiddleware, getDocumentView)

// Get signature templates
esignRouter.get("/templates", authMiddleware, getSignatureTemplates)

// Create signature template
esignRouter.post("/templates", authMiddleware, createSignatureTemplate)

// Delete signature template
esignRouter.delete("/templates/:id", authMiddleware, deleteSignatureTemplate)

// Sign document
esignRouter.post("/sign/:id", authMiddleware, signDocument)

// Reject document
esignRouter.post("/reject/:id", authMiddleware, rejectDocument)

module.exports = esignRouter
