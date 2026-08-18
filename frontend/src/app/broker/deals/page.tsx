"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, ReceiptIndianRupee, Search } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  funnelStage: string;
}

interface Deal {
  id: string;
  dealAmount: number;
  totalPaid: number;
  runningBalance: number;
  createdAt: string;
  lead: {
    id: string;
    name: string;
  };
  transactions: {
    id: string;
    amountPaid: number;
    paymentMode: string;
    createdAt: string;
  }[];
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [closedLeads, setClosedLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [activePaymentDeal, setActivePaymentDeal] = useState<Deal | null>(null);

  // Deal Form
  const [newDealLeadId, setNewDealLeadId] = useState("");
  const [newDealAmount, setNewDealAmount] = useState("");

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [payRef, setPayRef] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dealsRes, leadsRes] = await Promise.all([
        api.get("/deals/mine"),
        api.get("/leads/mine")
      ]);
      setDeals(dealsRes.data);
      setClosedLeads(leadsRes.data.filter((l: Lead) => l.funnelStage === "DEAL_CLOSED"));
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealLeadId || !newDealAmount) return;

    try {
      await api.post("/deals", {
        leadId: newDealLeadId,
        dealAmount: Number(newDealAmount)
      });
      setIsDealModalOpen(false);
      setNewDealLeadId("");
      setNewDealAmount("");
      fetchData(); // Refresh to show new deal
    } catch (err) {
      console.error("Failed to create deal", err);
      alert("Failed to create deal");
    }
  };

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentDeal || !payAmount) return;

    try {
      await api.post(`/deals/${activePaymentDeal.id}/transactions`, {
        amountPaid: Number(payAmount),
        paymentMode: payMode,
        referenceNumber: payRef || undefined
      });
      setActivePaymentDeal(null);
      setPayAmount("");
      setPayMode("UPI");
      setPayRef("");
      fetchData(); // Refresh running balance
    } catch (err: any) {
      console.error("Failed to log payment", err);
      alert(err.response?.data?.error || "Failed to log payment");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-ink">Deals & Payments</h1>
          <p className="text-sm text-ink-soft mt-1">
            Manage your closed deals and log installment payments.
          </p>
        </div>
        <Button onClick={() => setIsDealModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Create New Deal
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Client Name
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Deal Amount
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Total Paid
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Running Balance
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Action
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
                    <Search size={16} /> No deals created yet.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-medium text-ink">{deal.lead.name}</div>
                      <div className="text-xs text-ink-soft mt-1">
                        Created {new Date(deal.createdAt).toLocaleDateString()}
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
                      <div className="font-mono font-medium text-success">
                        {formatCurrency(deal.totalPaid)}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="font-mono font-medium text-warning">
                        {formatCurrency(deal.runningBalance)}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePaymentDeal(deal)}
                        disabled={deal.runningBalance <= 0}
                      >
                        <ReceiptIndianRupee size={14} className="mr-1.5" />
                        Log Payment
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Deal Modal */}
      {isDealModalOpen && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-serif text-ink mb-1">Create New Deal</h3>
            <p className="text-sm text-ink-soft mb-6">Lock in the final amount for a closed lead.</p>
            
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Select Client</label>
                <Select
                  required
                  value={newDealLeadId}
                  onChange={(e) => setNewDealLeadId(e.target.value)}
                >
                  <option value="" disabled>Choose a lead (DEAL CLOSED)</option>
                  {closedLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>
                {closedLeads.length === 0 && (
                  <p className="text-xs text-warning mt-1">You have no leads marked as DEAL CLOSED.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Total Deal Amount (₹)</label>
                <Input 
                  type="number" 
                  min="0"
                  required 
                  value={newDealAmount}
                  onChange={(e) => setNewDealAmount(e.target.value)}
                  placeholder="e.g. 15000000"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsDealModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!newDealLeadId || !newDealAmount}>Save Deal</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {activePaymentDeal && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-serif text-ink mb-1">Log Installment</h3>
            <p className="text-sm text-ink-soft mb-6">
              For {activePaymentDeal.lead.name} (Bal: {formatCurrency(activePaymentDeal.runningBalance)})
            </p>
            
            <form onSubmit={handleLogPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Amount Paid (₹)</label>
                <Input 
                  type="number" 
                  min="1"
                  max={activePaymentDeal.runningBalance}
                  required 
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 500000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Payment Mode</label>
                <Select
                  required
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CASH">Cash</option>
                </Select>
              </div>
              {payMode !== "CASH" && (
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Reference Number</label>
                  <Input 
                    type="text" 
                    required 
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Transaction ID / Cheque No."
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setActivePaymentDeal(null)}>Cancel</Button>
                <Button type="submit">Log Payment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
