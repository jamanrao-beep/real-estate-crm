"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileDown, Search, Image as ImageIcon, MapPin, Printer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Transaction {
  amountPaid: number;
}

interface Deal {
  id: string;
  dealAmount: number;
  totalPaid: number;
  runningBalance: number;
  createdAt: string;
  plotNumber?: string;
  plotImage?: string;
  templateDetails?: any;
  lead: {
    id: string;
    name: string;
  };
  transactions: Transaction[];
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Template Modal
  const [activeTemplateDeal, setActiveTemplateDeal] = useState<Deal | null>(null);
  const [plotNumber, setPlotNumber] = useState("");
  const [plotImage, setPlotImage] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/deals");
      setDeals(res.data);
    } catch (err) {
      console.error("Failed to fetch deals", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const openTemplateModal = (deal: Deal) => {
    setActiveTemplateDeal(deal);
    setPlotNumber(deal.plotNumber || "");
    setPlotImage(deal.plotImage || "");
    setAdditionalNotes(deal.templateDetails?.notes || "");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPlotImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplateDeal) return;

    try {
      await api.patch(`/deals/${activeTemplateDeal.id}/template`, {
        plotNumber,
        plotImage,
        templateDetails: { notes: additionalNotes }
      });
      setActiveTemplateDeal(null);
      fetchDeals(); // Refresh
    } catch (err) {
      console.error("Failed to save template", err);
      alert("Failed to save template");
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-serif text-ink">Finalized Deals</h1>
          <p className="text-sm text-ink-soft mt-1">
            Manage closed deals, assign plot markers, and generate final PDF templates.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Date Closed
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Client Name
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Deal Amount
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Running Balance
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Plot Template
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft">
                    Loading deals...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft flex items-center justify-center gap-2">
                    <Search size={16} /> No deals found.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-mono text-sm text-ink whitespace-nowrap">
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-ink">
                        {deal.lead?.name}
                      </div>
                      <div className="text-xs text-ink-soft mt-1">
                        {deal.transactions.length} payment(s) logged
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="font-serif text-lg text-ink">
                        {formatCurrency(deal.dealAmount)}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="font-mono font-medium text-warning">
                        {formatCurrency(deal.runningBalance)}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <Button
                        variant={deal.plotNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => openTemplateModal(deal)}
                      >
                        {deal.plotNumber ? (
                          <>
                            <Printer size={14} className="mr-1.5" />
                            View / Print Template
                          </>
                        ) : (
                          <>
                            <MapPin size={14} className="mr-1.5" />
                            Fill Template
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template View / Modal for Admin */}
      {activeTemplateDeal && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 print:relative print:inset-auto print:bg-white print:p-0 print:z-auto">
          {/* Print specific styling for the actual document */}
          <div className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-3xl flex flex-col max-h-screen print:border-none print:shadow-none print:max-h-full print:w-full print:bg-white print:text-black">
            
            {/* Header (Hidden when printing) */}
            <div className="p-4 border-b border-border flex justify-between items-center print:hidden">
              <h3 className="text-lg font-serif text-ink">Final Deal Template</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTemplateDeal(null)}>Close</Button>
                <Button size="sm" onClick={handlePrintPdf}>
                  <Printer size={16} className="mr-2" />
                  Print / Save PDF
                </Button>
              </div>
            </div>

            {/* Template Content (Scrollable in UI, full height in Print) */}
            <div className="p-8 overflow-y-auto print:overflow-visible print:p-4">
              
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold mb-2">Deal Finalization Certificate</h1>
                <p className="text-ink-soft">Official Record of Real Estate Transaction</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 border border-border rounded-lg p-6 print:border-black">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-4 print:text-black">Client Information</h4>
                  <div className="font-serif text-xl">{activeTemplateDeal.lead.name}</div>
                  <div className="text-sm mt-1 text-ink-soft print:text-black">Lead ID: {activeTemplateDeal.lead.id}</div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-4 print:text-black">Deal Information</h4>
                  <div className="font-serif text-xl text-success">{formatCurrency(activeTemplateDeal.dealAmount)}</div>
                  <div className="text-sm mt-1 text-ink-soft print:text-black">
                    Date: {new Date(activeTemplateDeal.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 print:block">
                  <div>
                    <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider print:text-black">
                      Plot Number / Identification
                    </label>
                    <Input 
                      required 
                      value={plotNumber}
                      onChange={(e) => setPlotNumber(e.target.value)}
                      placeholder="e.g. Plot A-12"
                      className="print:border-none print:px-0 print:text-xl print:font-semibold"
                    />
                  </div>

                  <div className="print:mt-6">
                    <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider print:text-black">
                      Plot Marker / Image
                    </label>
                    
                    {plotImage ? (
                      <div className="relative group rounded-lg overflow-hidden border border-border print:border-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={plotImage} alt="Plot Marker" className="w-full h-auto max-h-[400px] object-contain bg-bg" />
                        <label className="absolute inset-0 bg-ink/50 hidden group-hover:flex items-center justify-center cursor-pointer print:hidden text-white transition-opacity">
                          <ImageIcon size={24} className="mr-2" /> Change Image
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors print:hidden">
                        <ImageIcon size={32} className="text-ink-soft mb-2" />
                        <span className="text-sm text-ink font-medium">Click to upload plot image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>

                  <div className="print:mt-6">
                    <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider print:text-black">
                      Additional Notes
                    </label>
                    <textarea 
                      className="flex min-h-[100px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent print:border-none print:px-0 print:resize-none"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Any specific legal or closing notes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-border print:hidden">
                  <Button type="submit">Save Template Details</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
