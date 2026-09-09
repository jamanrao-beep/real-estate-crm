"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  Table as TableIcon,
  Download
} from "lucide-react";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface ParsedLead {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  notes?: string;
  [key: string]: any;
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedLead[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [defaultSource, setDefaultSource] = useState("Excel Bulk Import");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        "Full Name": "Rahul Sharma",
        "Phone Number": "9876543210",
        "Email": "rahul.sharma@example.com",
        "Source": "Property Expo 2026",
        "Notes": "Interested in 3 BHK near Dwarka Expressway"
      },
      {
        "Full Name": "Pooja Verma",
        "Phone Number": "9812345678",
        "Email": "pooja.v@example.com",
        "Source": "Meta Campaign",
        "Notes": "Looking for residential plots in Sector 82"
      },
      {
        "Full Name": "Amit Kumar",
        "Phone Number": "9900112233",
        "Email": "amit.k@example.com",
        "Source": "Walk-in Lead",
        "Notes": "Budget 75L, immediate booking planned"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads_Template");
    XLSX.writeFile(wb, "crm_leads_sample_template.xlsx");
  };

  const processFile = (uploadedFile: File) => {
    setError(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) {
          setError("Could not read file content. Please try again.");
          return;
        }

        const data = new Uint8Array(buffer);
        const wb = XLSX.read(data, { type: "array" });

        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          setError("The uploaded workbook contains no sheets.");
          setParsedData([]);
          return;
        }

        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // raw: false ensures cell text formatting is preserved (no scientific notation for phone numbers)
        const rawJson: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });

        if (!rawJson || rawJson.length < 1) {
          setError("The uploaded file has no data rows. Please ensure it has a header row and data.");
          setParsedData([]);
          return;
        }

        // Smart Header Row Detection (scans first 10 rows for known header keywords)
        const headerKeywords = [
          "name", "phone", "mobile", "contact", "email", "mail", "lead", "client", "customer", "number", "tel", "cell"
        ];

        let headerRowIdx = 0;
        let bestHeaderScore = -1;

        for (let r = 0; r < Math.min(rawJson.length, 10); r++) {
          const row = rawJson[r] || [];
          const rowText = row.map((c: any) => String(c || "").toLowerCase().trim()).join(" ");
          let score = 0;
          for (const kw of headerKeywords) {
            if (rowText.includes(kw)) score++;
          }
          if (score > bestHeaderScore && score >= 1) {
            bestHeaderScore = score;
            headerRowIdx = r;
          }
        }

        const headers = (rawJson[headerRowIdx] || []).map((h: any) => String(h || "").trim());
        setPreviewHeaders(headers.filter(Boolean));

        const lowerHeaders = headers.map(h => h.toLowerCase());

        // Helper to find column index with multiple potential aliases
        const getColIdx = (keywords: string[]) => {
          for (const kw of keywords) {
            const idx = lowerHeaders.findIndex(h => h.includes(kw));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const firstNameIdx = getColIdx(["first name", "firstname"]);
        const lastNameIdx = getColIdx(["last name", "lastname"]);
        const nameIdx = getColIdx([
          "full name", "fullname", "client name", "customer name", "lead name", 
          "party name", "prospect", "contact person", "name", "client", "customer"
        ]);
        const phoneIdx = getColIdx([
          "mobile number", "mobile no", "mobile_no", "phone number", "phone no", "phone_no", 
          "contact number", "contact no", "contact_no", "whatsapp no", "whatsapp number", 
          "mobile", "phone", "contact", "whatsapp", "number", "tel", "cell"
        ]);
        const emailIdx = getColIdx(["email address", "email id", "email_id", "email", "mail", "e-mail"]);
        const sourceIdx = getColIdx(["lead source", "source", "campaign", "platform", "channel", "medium"]);
        const notesIdx = getColIdx([
          "notes", "note", "remark", "remarks", "comment", "comments", "detail", "details", 
          "query", "requirement", "budget", "property", "project", "location", "city"
        ]);

        const leads: ParsedLead[] = [];

        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          // 1. Extract Name
          let rawName = "";
          if (firstNameIdx !== -1 || lastNameIdx !== -1) {
            const fn = firstNameIdx !== -1 ? String(row[firstNameIdx] || "").trim() : "";
            const ln = lastNameIdx !== -1 ? String(row[lastNameIdx] || "").trim() : "";
            rawName = `${fn} ${ln}`.trim();
          }
          if (!rawName && nameIdx !== -1) {
            rawName = String(row[nameIdx] || "").trim();
          }

          // 2. Extract Phone
          let rawPhone = phoneIdx !== -1 ? String(row[phoneIdx] || "").trim() : "";
          let rawEmail = emailIdx !== -1 ? String(row[emailIdx] || "").trim() : "";
          let rawSource = sourceIdx !== -1 ? String(row[sourceIdx] || "").trim() : "";
          let rawNotes = notesIdx !== -1 ? String(row[notesIdx] || "").trim() : "";

          // Fallback phone detection: scan cells for any 10-13 digit sequence
          if (!rawPhone) {
            for (let c = 0; c < row.length; c++) {
              if (c === nameIdx || c === firstNameIdx || c === lastNameIdx || c === emailIdx) continue;
              const cellVal = String(row[c] || "").trim();
              const digitsOnly = cellVal.replace(/[^\d]/g, "");
              if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
                rawPhone = cellVal;
                break;
              }
            }
          }

          // Fallback name detection: scan cells for a plausible name
          if (!rawName) {
            for (let c = 0; c < row.length; c++) {
              if (c === phoneIdx || c === emailIdx) continue;
              const cellVal = String(row[c] || "").trim();
              if (cellVal && !cellVal.includes("@") && cellVal.replace(/[^\d]/g, "").length < 4 && cellVal.length >= 2 && cellVal.length <= 40) {
                rawName = cellVal;
                break;
              }
            }
          }

          // Clean phone number (strip 'p:', spaces, dashes)
          const cleanPhone = rawPhone.replace(/^p:/i, "").replace(/[^\d+]/g, "").trim();

          if (!cleanPhone && !rawName && !rawEmail) {
            continue; // Skip entirely empty row
          }

          leads.push({
            name: rawName || (cleanPhone ? `Lead (${cleanPhone})` : `Lead #${leads.length + 1}`),
            phone: cleanPhone || "N/A",
            email: rawEmail || "",
            source: rawSource || defaultSource,
            notes: rawNotes,
          });
        }

        if (leads.length === 0) {
          setError("Could not detect valid lead records. Please ensure your sheet has names or phone numbers.");
          setParsedData([]);
        } else {
          setParsedData(leads);
        }
      } catch (err: any) {
        console.error("Failed to parse sheet:", err);
        setError("Failed to read Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.");
        setParsedData([]);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const [importProgress, setImportProgress] = useState<string | null>(null);

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return;

    setIsLoading(true);
    setError(null);
    setImportProgress("Starting import...");

    try {
      const CHUNK_SIZE = 200;
      const totalLeads = parsedData.length;
      let totalImported = 0;
      let totalDuplicates = 0;
      let totalSkipped = 0;

      const totalBatches = Math.ceil(totalLeads / CHUNK_SIZE);

      for (let b = 0; b < totalBatches; b++) {
        const start = b * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalLeads);
        const chunk = parsedData.slice(start, end);

        setImportProgress(`Importing batch ${b + 1} of ${totalBatches} (${end} / ${totalLeads} leads)...`);

        const res = await api.post("/leads/import-bulk", {
          leads: chunk,
          defaultSource: defaultSource || "Excel Bulk Import"
        });

        totalImported += res.data?.importedCount || 0;
        totalDuplicates += res.data?.duplicateCount || 0;
        totalSkipped += res.data?.skippedCount || 0;
      }

      if (totalImported === 0 && totalDuplicates > 0) {
        setError(`All ${totalDuplicates} leads in this file already exist in your CRM database (no duplicates added).`);
        setIsLoading(false);
        setImportProgress(null);
        return;
      }

      onSuccess(`Successfully imported ${totalImported} leads${totalDuplicates > 0 ? ` (${totalDuplicates} existing duplicates skipped)` : ""}!`);
      handleClose();
    } catch (err: any) {
      console.error("Import failed:", err);
      let msg = "Failed to import leads. Please check your file or try again.";
      if (err.response?.status === 413) {
        msg = "The file payload was too large for the server. Try uploading in smaller parts.";
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (typeof err.response?.data === "string" && err.response.data.length < 150) {
        msg = err.response.data;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
      setImportProgress(null);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setImportProgress(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif text-ink font-bold">Import Leads from Excel / CSV</h2>
              <p className="text-xs text-ink-soft mt-0.5">Upload 500 – 1,000+ leads directly into your CRM inbox</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-ink-soft hover:text-ink p-1.5 rounded-lg hover:bg-border/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {error && (
            <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area */}
          {!parsedData.length ? (
            <div className="space-y-3">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-accent/60 bg-bg/30 hover:bg-accent/5 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <div className="p-4 rounded-full bg-surface shadow-sm border border-border group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm sm:text-base">
                    Click to browse or drag and drop your sheet
                  </p>
                  <p className="text-xs text-ink-soft mt-1">
                    Supports Excel (.xlsx, .xls) and CSV (.csv) with up to thousands of leads
                  </p>
                </div>
                <span className="inline-block px-3 py-1 bg-surface border border-border text-[11px] font-mono text-ink-soft rounded-full mt-2">
                  Recognized columns: Name, Mobile / Phone, Email, Source, Notes / Query
                </span>
              </div>

              {/* Sample Template Download */}
              <div className="flex items-center justify-between p-3 bg-bg/40 border border-border rounded-xl text-xs">
                <span className="text-ink-soft">Need an example template to get started?</span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadSampleTemplate}
                  className="h-8 text-xs flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Download Sample Excel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl gap-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-ink text-sm block">{file?.name}</span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {parsedData.length} leads detected ready for import
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setFile(null); setParsedData([]); }}
                  className="h-8 text-xs self-start sm:self-auto"
                >
                  Choose Another File
                </Button>
              </div>

              {/* Source Tag input */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Default Lead Source / Campaign Tag
                </label>
                <Input 
                  type="text" 
                  value={defaultSource} 
                  onChange={(e) => setDefaultSource(e.target.value)}
                  placeholder="e.g. Meta Offline Campaign, Property Expo Leads, Excel Import"
                  className="h-10 text-sm"
                />
              </div>

              {/* Preview Table */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
                  <TableIcon size={14} /> Preview (First 5 rows):
                </div>
                <div className="border border-border rounded-xl overflow-x-auto bg-bg/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface">
                        <th className="p-2.5 font-semibold text-ink-soft">#</th>
                        <th className="p-2.5 font-semibold text-ink-soft">Name</th>
                        <th className="p-2.5 font-semibold text-ink-soft">Phone</th>
                        <th className="p-2.5 font-semibold text-ink-soft">Email</th>
                        <th className="p-2.5 font-semibold text-ink-soft">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-ink-soft font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-ink">{row.name}</td>
                          <td className="p-2.5 font-mono text-ink-soft">{row.phone || "—"}</td>
                          <td className="p-2.5 text-ink-soft">{row.email || "—"}</td>
                          <td className="p-2.5 text-ink-soft truncate max-w-[140px]">{row.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 5 && (
                  <p className="text-[11px] text-ink-soft mt-1.5 text-right">
                    + {parsedData.length - 5} more leads will be imported
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-bg/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-ink-soft w-full sm:w-auto text-left">
            {isLoading && importProgress && (
              <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                <Loader2 size={14} className="animate-spin shrink-0" />
                {importProgress}
              </span>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isLoading}
              className="w-full sm:w-auto text-xs sm:text-sm h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImportSubmit} 
              disabled={parsedData.length === 0 || isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {importProgress || `Importing ${parsedData.length} Leads...`}
                </>
              ) : (
                <>
                  <FileSpreadsheet size={16} />
                  Import {parsedData.length > 0 ? `${parsedData.length} Leads` : "Leads"}
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
