const { query } = require("../utils/query")
const path = require("path")
const { PDFDocument, rgb } = require("pdf-lib")
const { fileDir } = require("../utils/file_handler.cjs") // Assuming file_handler.cjs exists and provides fileDir()
const fs = require("fs")

// Get documents for e-signing
const getEsignDocuments = async (req, res) => {
  try {
    const documents = await query(`
      SELECT d.*,
             u.full_name as uploaded_by_name,
             u.position as uploader_position,
             COUNT(s.id) as signature_count
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN signatures s ON d.id = s.document_id AND s.status = 'signed'
      WHERE d.status IN ('draft', 'pending_signature')
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `)
    res.json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error("Get esign documents error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch documents",
    })
  }
}

// Get single document for e-signing
const getEsignDocumentsById = async (req, res) => {
  try {
    const { id } = req.params
    const [document] = await query(
      `SELECT d.*, u.full_name as uploaded_by_name, u.position as uploader_position
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = ? AND d.status IN ('draft', 'pending_signature')`,
      [id],
    )
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not available for signing",
      })
    }
    const signatures = await query(
      `SELECT s.*,
        u.full_name as signer_name,
        u.position as signer_position
      FROM signatures s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.document_id = ?
      ORDER BY s.signed_at DESC`,
      [id],
    )
    res.json({
      success: true,
      document: {
        ...document,
        signatures: signatures, // Ensure signatures is an array
      },
    })
  } catch (error) {
    console.error("Get esign document error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch document",
    })
  }
}

// Get signature templates
const getSignatureTemplates = async (req, res) => {
  try {
    const templates = await query(
      `
      SELECT * FROM signature_templates
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
      [req.user.id],
    )
    res.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error("Get signature templates error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch signature templates",
    })
  }
}

// Create signature template
const createSignatureTemplate = async (req, res) => {
  try {
    const { name, signature_data } = req.body
    if (!name || !signature_data) {
      return res.status(400).json({
        success: false,
        error: "Name and signature data are required",
      })
    }
    const result = await query(
      `
      INSERT INTO signature_templates (user_id, name, signature_data)
      VALUES (?, ?, ?)
    `,
      [req.user.id, name, signature_data],
    )
    res.status(201).json({
      success: true,
      message: "Signature template created successfully",
      template_id: result.insertId,
    })
  } catch (error) {
    console.error("Create signature template error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create signature template",
    })
  }
}

// Delete signature template
const deleteSignatureTemplate = async (req, res) => {
  try {
    const { id } = req.params
    const [usedCheck] = await query(
      `
      SELECT COUNT(*) as total FROM signatures WHERE signature_template_id = ?
      `,
      [id],
    )
    if (usedCheck.total > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: this template is used in a signature history",
      })
    }
    // Jika tidak dipakai, hapus
    const result = await query(`DELETE FROM signature_templates WHERE id = ? AND user_id = ?`, [id, req.user.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Template not found or does not belong to you.",
      })
    }
    res.json({
      success: true,
      message: "Template deleted successfully",
    })
  } catch (error) {
    console.error("Delete signature template error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to delete template",
    })
  }
}

// Sign document
const signDocument = async (req, res) => {
  const username = req.user.username
  console.log("User signing document:", username)
  try {
    const { documentId, user_id, signature_template_id, notes, signaturePlacement } = req.body
    console.log("REQ BODY:", req.body)

    // Validate required fields including signaturePlacement
    if (!documentId || !user_id || !signature_template_id || !signaturePlacement) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or signature placement data",
      })
    }

    const { x, y, page, width, height } = signaturePlacement

    // Removed the check for existing signature to allow multiple signatures per document per user.
    // const existingSignature = await query("SELECT id FROM signatures WHERE document_id = ? AND user_id = ?", [
    //   documentId,
    //   user_id,
    // ])
    // const signatureExists = Array.isArray(existingSignature)
    //   ? existingSignature.length > 0
    //   : existingSignature && Object.keys(existingSignature).length > 0
    // if (signatureExists) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "You have already signed this document",
    //   })
    // }

    // Get signature template
    const templateResult = await query("SELECT signature_data FROM signature_templates WHERE id = ?", [
      signature_template_id,
    ])
    const template = Array.isArray(templateResult) ? templateResult[0] : templateResult
    if (!template || !template.signature_data) {
      return res.status(404).json({
        success: false,
        message: "Signature template not found",
      })
    }

    // Get original document
    const documentResult = await query("SELECT * FROM documents WHERE id = ?", [documentId])
    const doc = Array.isArray(documentResult) ? documentResult[0] : documentResult
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Verify file exists
    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({
        success: false,
        message: "Original document file not found",
      })
    }

    // Create signed directory if needed
    const signedDir = path.join(fileDir(), "signed")
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true })
    }
    const originalPath = path.resolve(doc.file_path)
    const signedFileName = `signed_${Date.now()}_${path.basename(doc.file_name)}`
    const signedPath = path.join(signedDir, signedFileName)

    // Process PDF
    const pdfBytes = fs.readFileSync(originalPath)
    const pdfDoc = await PDFDocument.load(pdfBytes)

    // Embed signature image
    let signatureImage
    try {
      const signatureData = template.signature_data
      const base64Data = signatureData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
      const signatureBytes = Buffer.from(base64Data, "base64")

      if (signatureData.includes("image/png")) {
        signatureImage = await pdfDoc.embedPng(signatureBytes)
      } else if (signatureData.includes("image/jpeg") || signatureData.includes("image/jpg")) {
        signatureImage = await pdfDoc.embedJpg(signatureBytes)
      } else {
        return res.status(400).json({
          success: false,
          message: "Unsupported image format. Please use PNG or JPG.",
        })
      }
    } catch (e) {
      console.error("Error embedding signature:", e)
      return res.status(500).json({
        success: false,
        message: "Error processing signature",
        error: e.message,
      })
    }

    const pages = pdfDoc.getPages()
    const targetPage = pages[page - 1] // Adjust for 0-indexed array if page is 1-indexed from frontend
    if (!targetPage) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number for signature placement.",
      })
    }

    const { width: pageWidth, height: pageHeight } = targetPage.getSize()

    // Convert frontend top-left Y to PDF-lib bottom-left Y
    // Assuming frontend x, y, width, height are in pixels relative to the viewer,
    // and we need to scale them to PDF points (72 points per inch).
    // For simplicity, let's assume the frontend provides coordinates that are
    // directly proportional to the PDF's internal coordinate system, or
    // that the frontend viewer has a known scaling factor.
    // For now, we'll use the provided x, y, width, height directly,
    // assuming they are already scaled or represent the desired dimensions in PDF points.
    // PDF-lib uses a bottom-left origin. If frontend sends top-left, convert Y.
    const signaturePdfX = x
    const signaturePdfY = pageHeight - (y + height) // Convert top-left Y to bottom-left Y

    // Add signature image
    targetPage.drawImage(signatureImage, {
      x: signaturePdfX,
      y: signaturePdfY,
      width: width,
      height: height,
    })

    // Add signature metadata (text) below the signature image
    const textLineHeight = 10 // Smaller line height for text
    const textOffsetFromSignature = 5 // Space between image and first line of text
    const textX = signaturePdfX
    let currentTextY = signaturePdfY - textOffsetFromSignature // Start below the image

    // Add "Signed by" text
    targetPage.drawText(`Signed by: ${username}`, {
      x: textX,
      y: currentTextY,
      size: 8, // Smaller font size for metadata
      color: rgb(0, 0, 0),
    })
    currentTextY -= textLineHeight // Move down for next line

    // Add "Date" text
    const formattedDate = new Date()
      .toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\//g, "/")
    targetPage.drawText(`Date: ${formattedDate}`, {
      x: textX,
      y: currentTextY,
      size: 8,
      color: rgb(0, 0, 0),
    })

    // Save signed PDF
    const signedPdfBytes = await pdfDoc.save()
    fs.writeFileSync(signedPath, signedPdfBytes)

    // Update database records
    // The columns x_coord, y_coord, page_number, width, height are now expected to exist in the signatures table.
    await query(
      "INSERT INTO signatures (document_id, user_id, signature_template_id, notes, signed_at, status, x_coord, y_coord, page_number, width, height) VALUES (?, ?, ?, ?, NOW(), 'signed', ?, ?, ?, ?, ?)",
      [documentId, user_id, signature_template_id, notes || "", x, y, page, width, height], // Store placement
    )
    // Update the document's signed_file_path and status. This will update with the latest signed version.
    await query("UPDATE documents SET signed_file_path = ?, status = 'signed', updated_at = NOW() WHERE id = ?", [
      signedPath,
      documentId,
    ])

    return res.status(200).json({
      success: true,
      message: "Document signed successfully",
      signedPath: signedPath,
    })
  } catch (err) {
    console.error("Error in signDocument:", err)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    })
  }
}

// New endpoint to serve document files for viewing
const getDocumentView = async (req, res) => {
  try {
    const { id } = req.params
    const [document] = await query(`SELECT file_path, file_name FROM documents WHERE id = ?`, [id])

    if (!document || !fs.existsSync(document.file_path)) {
      return res.status(404).json({
        success: false,
        error: "Document file not found.",
      })
    }

    // Set appropriate headers for file viewing
    res.setHeader("Content-Type", "application/pdf") // Assuming PDF for now
    res.setHeader("Content-Disposition", `inline; filename="${document.file_name}"`) // inline to view in browser
    fs.createReadStream(document.file_path).pipe(res)
  } catch (error) {
    console.error("Get document view error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to retrieve document for viewing.",
    })
  }
}

// Reject document
const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params
    const { notes } = req.body
    // Check if document exists
    const document = await query(
      `
      SELECT * FROM documents WHERE id = ?
    `,
      [id],
    )
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      })
    }
    // Create signature record with rejected status
    await query(
      `
      INSERT INTO signatures (document_id, user_id, notes, status, ip_address, user_agent)
      VALUES (?, ?, ?, 'rejected', ?, ?)
    `,
      [id, req.user.id, notes || null, req.ip, req.get("User-Agent")],
    )
    // Update document status
    await query(
      `
      UPDATE documents
      SET status = 'rejected', updated_at = NOW()
      WHERE id = ?
    `,
      [id],
    )
    res.json({
      success: true,
      message: "Document rejected successfully",
    })
  } catch (error) {
    console.error("Reject document error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to reject document",
    })
  }
}

module.exports = {
  getEsignDocuments,
  getEsignDocumentsById,
  getSignatureTemplates,
  createSignatureTemplate,
  deleteSignatureTemplate,
  signDocument,
  rejectDocument,
  getDocumentView, // Export the new function
}
