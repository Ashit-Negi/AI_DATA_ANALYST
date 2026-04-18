const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const pdfParse = require("pdf-parse");

// 🔥 STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("file");

// 🔥 DELETE HELPER
function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Delete Error:", err);
  });
}

// 🔥 MAIN CONTROLLER
exports.uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    try {
      // ================= CSV =================
      if (ext === ".csv") {
        const results = [];

        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => results.push(data))
          .on("end", () => {
            res.json({
              message: "CSV uploaded successfully",
              rows: results.length,
              data: results,
            });

            deleteFile(filePath);
          });
      }

      // ================= EXCEL =================
      else if (ext === ".xlsx" || ext === ".xls") {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        res.json({
          message: "Excel uploaded successfully",
          rows: jsonData.length,
          data: jsonData,
        });

        deleteFile(filePath);
      }

      // ================= PDF =================
      else if (ext === ".pdf") {
        try {
          const buffer = fs.readFileSync(filePath);

          let pdfData;

          // 🔥 SAFE PARSE
          try {
            pdfData = await pdfParse(buffer);
          } catch (err) {
            console.error("PDF Parse Error:", err.message);

            res.json({
              message:
                "⚠️ Unsupported PDF format. Please upload CSV or Excel for best results.",
              rows: 0,
              data: [],
            });

            deleteFile(filePath);
            return;
          }

          const text = pdfData.text || "";

          // 🔥 DETECT SCANNED / EMPTY PDF
          if (!text || text.trim().length < 20) {
            res.json({
              message:
                "⚠️ This looks like a scanned or empty PDF. Cannot extract data.",
              rows: 0,
              data: [],
            });

            deleteFile(filePath);
            return;
          }

          // 🔥 BASIC TEXT EXTRACTION
          const lines = text
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 5)
            .slice(0, 40);

          const rows = lines.map((line) => ({ content: line }));

          res.json({
            message: "PDF uploaded (limited support)",
            rows: rows.length,
            data: rows,
          });

          deleteFile(filePath);
        } catch (err) {
          console.error("PDF Fatal Error:", err.message);

          res.json({
            message: "⚠️ PDF processing failed",
            rows: 0,
            data: [],
          });

          deleteFile(filePath);
        }
      }

      // ================= INVALID =================
      else {
        res.status(400).json({
          error: "Unsupported file type. Use CSV, Excel or PDF.",
        });

        deleteFile(filePath);
      }
    } catch (error) {
      console.error("Server Error:", error.message);

      res.status(500).json({
        error: "File processing failed",
      });

      deleteFile(filePath);
    }
  });
};
