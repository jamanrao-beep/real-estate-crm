"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileDown, Search, Image as ImageIcon, MapPin, Printer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DealTemplateModal from "@/components/DealTemplateModal";

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
  };

  const handleModalSave = () => {
    fetchDeals(); // Refresh
  };

  const handleModalClose = () => {
    setActiveTemplateDeal(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">Finalized Deals</h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
          Manage closed deals, assign plot markers, and generate final PDF templates.
        </p>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg uppercase text-xs font-semibold text-ink-soft tracking-wider border-b border-border">
              <tr>
                <th className="p-4 rounded-tl-xl">Date Closed</th>
                <th className="p-4">Client Name</th>
                <th className="p-4 text-right">Deal Amount</th>
                <th className="p-4 text-right">Running Balance</th>
                <th className="p-4 text-right rounded-tr-xl">Plot Template</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft">Loading deals...</td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft">No finalized deals found.</td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 align-top text-ink-soft">
                      {new Date(deal.createdAt).toLocaleDateString('en-GB')}
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
                        variant={deal.plotNumber ? "primary" : "outline"}
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

      {/* MOBILE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-ink-soft">
            Loading deals...
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-ink-soft">
            No finalized deals found.
          </div>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                <div>
                  <h3 className="font-bold text-ink text-base">{deal.lead?.name}</h3>
                  <span className="text-[10px] font-mono text-ink-soft">
                    Closed: {new Date(deal.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <Badge variant={deal.plotNumber ? "outline" : "default"} className="text-[10px]">
                  {deal.plotNumber ? `Plot: ${deal.plotNumber}` : "No Plot"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-bg p-2.5 rounded-lg border border-border/60">
                  <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Agreed Value</span>
                  <span className="font-bold font-serif text-ink text-sm">{formatCurrency(deal.dealAmount)}</span>
                </div>
                <div className="bg-warning/10 p-2.5 rounded-lg border border-warning/30">
                  <span className="text-[10px] text-warning uppercase tracking-wider block font-semibold">Balance Due</span>
                  <span className="font-bold font-mono text-warning text-sm">{formatCurrency(deal.runningBalance)}</span>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  variant={deal.plotNumber ? "primary" : "outline"}
                  size="sm"
                  className="w-full justify-center h-10 text-xs font-semibold"
                  onClick={() => openTemplateModal(deal)}
                >
                  {deal.plotNumber ? (
                    <>
                      <Printer size={14} className="mr-1.5" />
                      View / Print Receipt Template
                    </>
                  ) : (
                    <>
                      <MapPin size={14} className="mr-1.5 text-accent" />
                      Fill Template Details
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {activeTemplateDeal && (
        <DealTemplateModal 
          deal={activeTemplateDeal}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}