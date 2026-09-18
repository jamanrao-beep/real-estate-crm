"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileDown, Search, Image as ImageIcon, MapPin, Printer, Filter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DealTemplateModal from "@/components/DealTemplateModal";
import { SourceBadge } from "@/components/SourceBadge";

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
    phone?: string;
    source?: string;
    formAnswers?: any;
  };
  transactions: Transaction[];
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

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

  const filteredDeals = deals.filter((deal) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      deal.lead?.name?.toLowerCase().includes(q) ||
      (deal.plotNumber && deal.plotNumber.toLowerCase().includes(q)) ||
      (deal.lead?.source && deal.lead.source.toLowerCase().includes(q));

    let matchesProject = true;
    if (projectFilter) {
      const source = (deal.lead?.source || "").toLowerCase();
      const projFromForm = (deal.lead?.formAnswers?.project || "").toLowerCase();
      const p = projectFilter.toLowerCase();
      if (p.includes("fun")) {
        matchesProject = source.includes("fun valley") || source.includes("funvalley") || projFromForm.includes("fun");
      } else if (p.includes("sahastra")) {
        matchesProject = source.includes("sahastradhara") || source.includes("sahastra dhara") || projFromForm.includes("sahastra");
      } else if (p.includes("rani")) {
        matchesProject = source.includes("rani pokhari") || source.includes("ranipokhari") || source.includes("rani") || projFromForm.includes("rani");
      } else if (p.includes("thano")) {
        matchesProject = source.includes("thano") || projFromForm.includes("thano");
      } else {
        matchesProject = source.includes(p) || projFromForm.includes(p);
      }
    }
    return matchesSearch && matchesProject;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">Finalized Deals</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            Manage closed deals, assign plot markers, and generate final PDF templates.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-surface border border-border p-3 sm:p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              type="text"
              placeholder="Search deals by client name, plot number, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-bg w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-ink-soft shrink-0" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 sm:h-10 text-xs sm:text-sm bg-bg border border-border rounded-lg px-3 min-w-[170px] text-ink focus:outline-none"
            >
              <option value="">All Projects ({deals.length})</option>
              <option value="Fun Valley">Fun Valley</option>
              <option value="Sahastradhara">Sahastradhara</option>
              <option value="Rani Pokhari">Rani Pokhari</option>
              <option value="Thano">Thano</option>
            </select>
          </div>
        </div>

        {/* Quick Project Filter Chips */}
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mr-1">
            Projects:
          </span>
          <button
            type="button"
            onClick={() => setProjectFilter("")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              !projectFilter
                ? "bg-ink text-surface shadow-xs"
                : "bg-bg text-ink-soft hover:text-ink hover:bg-border/60"
            }`}
          >
            All
          </button>
          {[
            { name: "Fun Valley", color: "border-cyan-500/30 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20" },
            { name: "Sahastradhara", color: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" },
            { name: "Rani Pokhari", color: "border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20" },
            { name: "Thano", color: "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" },
          ].map((proj) => {
            const isSelected = projectFilter === proj.name;
            return (
              <button
                key={proj.name}
                type="button"
                onClick={() => setProjectFilter(isSelected ? "" : proj.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-ink text-surface border-ink shadow-xs"
                    : `${proj.color}`
                }`}
              >
                {proj.name}
              </button>
            );
          })}
        </div>
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
              ) : filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft">No finalized deals match the selected criteria.</td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 align-top text-ink-soft">
                      {new Date(deal.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink">{deal.lead?.name}</span>
                        {deal.lead?.source && (
                          <SourceBadge source={deal.lead.source} />
                        )}
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
        ) : filteredDeals.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-ink-soft">
            No finalized deals match the selected criteria.
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <div key={deal.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-ink text-base">{deal.lead?.name}</h3>
                    {deal.lead?.source && (
                      <SourceBadge source={deal.lead.source} />
                    )}
                  </div>
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