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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink tracking-tight mb-2">Finalized Deals</h1>
          <p className="text-ink-soft">Manage closed deals, assign plot markers, and generate final PDF templates.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
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