const express = require("express")
const { authMiddleware } = require("../../middleware/auth")
const {
  uploadDocument,
  updateDocumentStatus,
  getDocuments,
  getDocumentId,
  deleteDocument,
  downloadDocument,
  getDocumentById,
} = require("../../controller/documentController")

const upload = require("../../middleware/multer") // pastikan ini merujuk ke file upload.js

const documentsRouter = express.Router()


documentsRouter.get("/documents", authMiddleware, getDocuments)


documentsRouter.get("/documents/:id", authMiddleware, getDocumentById)


documentsRouter.post(
  "/documents/upload",
  authMiddleware,
  upload.single("file"),
  (req, res, next) => {
    console.log("File field name:", req.file?.fieldname) // ini harus "file"
    console.log("Body:", req.body)
    next()
  },
  uploadDocument
)



documentsRouter.patch(
  "/documents/:id/status",
  authMiddleware,
  updateDocumentStatus
)


documentsRouter.delete("/documents/:id", authMiddleware, deleteDocument)

documentsRouter.get("/documents/:id/download", authMiddleware, downloadDocument)

module.exports = documentsRouter
