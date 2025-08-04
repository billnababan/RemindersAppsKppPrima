const { query } = require("../utils/query")
const path = require("path")
const fs = require("fs")
const { PDFDocument } = require("pdf-lib")

// Fungsi bantu: Tambahkan tanda tangan ke PDF dan simpan
const applySignatureToPDF = async (originalPath, signatureBase64, outputPath) => {
  try {
    const existingPdfBytes = await fs.readFile(originalPath)
    const pdfDoc = await PDFDocument.load(existingPdfBytes)

    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "")
    const signatureBuffer = Buffer.from(base64Data, "base64")
    const signatureImage = await pdfDoc.embedPng(signatureBuffer)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    firstPage.drawImage(signatureImage, {
      x: 400,
      y: 100,
      width: 150,
      height: 50,
    })

    const pdfBytes = await pdfDoc.save()
    await fs.writeFile(outputPath, pdfBytes)

    return outputPath
  } catch (error) {
    console.error("Error applying signature:", error)
    throw error
  }
}

// Get all documents
const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all" } = req.query
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params = []

    if (status !== "all") {
      whereClause += " AND d.status = ?"
      params.push(status)
    }

    const documents = await query(
      `SELECT d.*, u.full_name as uploaded_by_name, u.position as uploader_position,
              COUNT(s.id) as signature_count
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       LEFT JOIN signatures s ON d.id = s.document_id AND s.status = 'signed'
       ${whereClause}
       GROUP BY d.id
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number.parseInt(limit), offset],
    )

    const totalResult = await query(`SELECT COUNT(*) as total FROM documents d ${whereClause}`, params)
    const total = totalResult[0].total

    res.json({
      success: true,
      documents,
      pagination: {
        current_page: Number.parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get documents error:", error)
    res.status(500).json({ success: false, error: "Failed to fetch documents" })
  }
}

const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params

    const [document] = await query(
      `SELECT d.*, u.full_name as uploaded_by_name, u.position as uploader_position
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = ?`,
      [id],
    )

    if (!document) {
      return res.status(404).json({ success: false, error: "Document not found" })
    }

    const signatures = await query(
      `SELECT s.*, u.full_name as signer_name, u.position as signer_position
       FROM signatures s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.document_id = ?
       ORDER BY s.signed_at DESC`,
      [id]
    )

    res.json({ success: true, document: { ...document, signatures } })
  } catch (error) {
    console.error("Get document error:", error)
    res.status(500).json({ success: false, error: "Failed to fetch document" })
  }
}

const uploadDocument = async (req, res) => {
  try {
    const { title, description } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" })
    }
    if (!title) {
      return res.status(400).json({ success: false, error: "Title is required" })
    }

    const result = await query(
      `INSERT INTO documents (title, description, file_path, file_name, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, file.path, file.originalname, file.size, file.mimetype, req.user.id],
    )

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document_id: result.insertId,
    })
  } catch (error) {
    console.error("Upload document error:", error)
    res.status(500).json({ success: false, error: "Failed to upload document" })
  }
}

const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ["draft", "pending_signature", "signed", "rejected"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" })
    }

    await query("UPDATE documents SET status = ?, updated_at = NOW() WHERE id = ?", [status, id])

    res.json({ success: true, message: "Document status updated successfully" })
  } catch (error) {
    console.error("Update document status error:", error)
    res.status(500).json({ success: false, error: "Failed to update document status" })
  }
}

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params

    const [document] = await query("SELECT file_path FROM documents WHERE id = ?", [id])
    if (!document) {
      return res.status(404).json({ success: false, error: "Document not found" })
    }

    try {
      await fs.unlink(document.file_path)
    } catch (fileError) {
      console.error("Error deleting file:", fileError)
    }

    await query("DELETE FROM documents WHERE id = ?", [id])

    res.json({ success: true, message: "Document deleted successfully" })
  } catch (error) {
    console.error("Delete document error:", error)
    res.status(500).json({ success: false, error: "Failed to delete document" })
  }
}

const downloadDocument = async (req, res) => {
  try {
    const id = req.params.id;

    // Get document from database
    const result = await query("SELECT * FROM documents WHERE id = ?", [id]);
    
    // Handle different query result formats
    const document = Array.isArray(result) ? 
      (result.length > 0 ? result[0] : null) : 
      (result && Object.keys(result).length > 0 ? result : null);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Determine which file to download based on status
    let fileToDownload;
    if (document.status === 'signed' && document.signed_file_path) {
      fileToDownload = document.signed_file_path;
    } else {
      fileToDownload = document.file_path;
    }

    if (!fileToDownload) {
      return res.status(404).json({ 
        success: false, 
        message: "File path not available for download" 
      });
    }

    // Resolve the full file path
    const fullPath = path.resolve(fileToDownload);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found",
        details: `Requested file not found at: ${fullPath}`,
        documentStatus: document.status
      });
    }

    // Determine download filename
    let downloadFilename;
    if (document.status === 'signed') {
      // For signed files, use the original filename but indicate it's signed
      const ext = path.extname(document.file_name || '');
      const basename = path.basename(document.file_name || 'signed_document', ext);
      downloadFilename = `${basename}_signed${ext}`;
    } else {
      // For draft/unsigned files, use the original filename
      downloadFilename = document.file_name || path.basename(fileToDownload);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(fullPath);
    
    fileStream.on('open', () => {
      fileStream.pipe(res);
    });

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: "Error streaming file",
          error: err.message 
        });
      }
    });

  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: "Error downloading document",
        error: err.message 
      });
    }
  }
};


const signDocument = async (req, res) => {
  try {
    const { id } = req.params
    const { signature_template_id, notes } = req.body

    if (!signature_template_id) {
      return res.status(400).json({ success: false, error: "Signature template is required" })
    }

    const [document] = await query("SELECT * FROM documents WHERE id = ?", [id])
    if (!document) {
      return res.status(404).json({ success: false, error: "Document not found" })
    }

    const [template] = await query(
      "SELECT * FROM signature_templates WHERE id = ? AND user_id = ?",
      [signature_template_id, req.user.id]
    )
    if (!template) {
      return res.status(404).json({ success: false, error: "Signature template not found" })
    }

    const signedFilePath = path.join(
      path.dirname(document.file_path),
      `signed-${Date.now()}-${document.file_name}`
    )

    await applySignatureToPDF(document.file_path, template.signature_data, signedFilePath)

    await query(
      `INSERT INTO signatures (document_id, user_id, signature_template_id, signature_data, notes, status, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, 'signed', ?, ?)`,
      [id, req.user.id, signature_template_id, template.signature_data, notes || null, req.ip, req.get("User-Agent")]
    )

    await query(
      `UPDATE documents SET status = 'signed', updated_at = NOW(), signed_file_path = ? WHERE id = ?`,
      [signedFilePath, id]
    )

    res.json({ success: true, message: "Document signed and saved successfully" })
  } catch (error) {
    console.error("Sign document error:", error)
    res.status(500).json({ success: false, error: "Failed to sign document" })
  }
}

module.exports = {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocumentStatus,
  deleteDocument,
  downloadDocument,
  signDocument,
}
