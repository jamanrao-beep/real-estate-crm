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
  Table as TableIcon
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

  const processFile = (uploadedFile: File) => {
    setError(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          setError("The uploaded file has no data rows. Please ensure it has a header row and data.");
          setParsedData([]);
          return;
        }

        const headers = (rawJson[0] || []).map((h: any) => String(h || "").trim());
        setPreviewHeaders(headers);

        const lowerHeaders = headers.map(h => h.toLowerCase());

        // Helper to find column index
        const getColIdx = (keywords: string[]) => {
          for (const kw of keywords) {
            const idx = lowerHeaders.findIndex(h => h.includes(kw));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const nameIdx = getColIdx(["name", "full name", "client", "customer", "lead name"]);
        const phoneIdx = getColIdx(["phone", "mobile", "contact", "number", "tel", "cell"]);
        const emailIdx = getColIdx(["email", "mail"]);
        const sourceIdx = getColIdx(["source", "campaign", "platform", "channel"]);
        const notesIdx = getColIdx(["note", "comment", "remark", "detail", "query", "requirement"]);

        const leads: ParsedLead[] = [];

        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          let rawName = nameIdx !== -1 ? String(row[nameIdx] || "").trim() : "";
          let rawPhone = phoneIdx !== -1 ? String(row[phoneIdx] || "").trim() : "";
          let rawEmail = emailIdx !== -1 ? String(row[emailIdx] || "").trim() : "";
          let rawSource = sourceIdx !== -1 ? String(row[sourceIdx] || "").trim() : "";
          let rawNotes = notesIdx !== -1 ? String(row[notesIdx] || "").trim() : "";

          // If phone wasn't found at designated column, try to find any column with digits
          if (!rawPhone) {
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || "").trim();
              if (val.replace(/[^\d]/g, "").length >= 7) {
                rawPhone = val;
                break;
              }
            }
          }

          // Clean phone
          const cleanPhone = rawPhone.replace(/^p:/i, "").trim();

          if (!cleanPhone && !rawName && !rawEmail) {
            continue; // Skip empty row
          }

          leads.push({
            name: rawName || (cleanPhone ? `Lead (${cleanPhone})` : `Lead #${r}`),
            phone: cleanPhone,
            email: rawEmail,
            source: rawSource || defaultSource,
            notes: rawNotes,
          });
        }

        if (leads.length === 0) {
          setError("Could not detect valid lead records. Please ensure phone numbers or names are present.");
        } else {
          setParsedData(leads);
        }
      } catch (err: any) {
        console.error("Failed to parse sheet:", err);
        setError("Failed to read Excel file. Make sure it is a valid .xlsx, .xls, or .csv file.");
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/leads/import-bulk", {
        leads: parsedData,
        defaultSource: defaultSource || "Excel Bulk Import"
      });

      const { importedCount, duplicateCount } = res.data;
      onSuccess(`Successfully imported ${importedCount} leads${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ""}!`);
      handleClose();
    } catch (err: any) {
      console.error("Import failed:", err);
      setError(err.response?.data?.error || "Failed to import leads. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
                Expected Columns: Name, Phone Number, Email, Source/Notes
              </span>
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
                  <TableIcon size={14} /> Preview (First 4 rows):
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
                      {parsedData.slice(0, 4).map((row, idx) => (
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
                {parsedData.length > 4 && (
                  <p className="text-[11px] text-ink-soft mt-1.5 text-right">
                    + {parsedData.length - 4} more leads will be imported
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-bg/50 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importing {parsedData.length} Leads...
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
  );
}
