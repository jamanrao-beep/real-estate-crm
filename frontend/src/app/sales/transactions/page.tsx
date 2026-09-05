"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Lock, Unlock, FileDown, Search, Edit2 } from "lucide-react";

interface Transaction {
  id: string;
  amountPaid: number;
  paymentMode: string;
  referenceNumber: string | null;
  isLocked: boolean;
  createdAt: string;
  unlockedAt: string | null;
  deal: {
    dealAmount: number;
    lead: {
      name: string;
    };
  };
}

export default function MyTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMode, setEditMode] = useState("UPI");
  const [editRef, setEditRef] = useState("");

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/transactions/mine");
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amountPaid.toString());
    setEditMode(tx.paymentMode);
    setEditRef(tx.referenceNumber || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    try {
      await api.patch(`/transactions/${editingTx.id}`, {
        amountPaid: Number(editAmount),
        paymentMode: editMode,
        referenceNumber: editRef || undefined,
      });
      setEditingTx(null);
      fetchTransactions(); // Refresh to get the newly locked status
    } catch (err: any) {
      console.error("Failed to edit transaction", err);
      alert(err.response?.data?.error || "Failed to edit transaction");
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await api.get("/reports/transactions/mine/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "my_transactions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download CSV", err);
      alert("Failed to download CSV");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-ink">My Transactions</h1>
          <p className="text-sm text-ink-soft mt-1">
            History of all payments you have logged.
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={handleDownloadCSV}>
            <FileDown size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Date
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Client & Deal
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Amount
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-soft">
                    Loading ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-soft flex items-center justify-center gap-2">
                    <Search size={16} /> No transactions logged yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-mono text-sm text-ink whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-ink">
                        {tx.deal?.lead?.name}
                      </div>
                      <div className="text-xs text-ink-soft mt-1">
                        Total Deal: {tx.deal ? formatCurrency(tx.deal.dealAmount) : "-"}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <Badge variant="outline" className="mb-1">
                        {tx.paymentMode}
                      </Badge>
                      {tx.referenceNumber && (
                        <div className="font-mono text-xs text-ink-soft">
                          Ref: {tx.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      {tx.isLocked ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit bg-bg border border-border">
                          <Lock size={12} /> Locked
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="flex items-center gap-1 w-fit">
                          <Unlock size={12} /> Unlocked
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="font-mono font-medium text-success">
                        {formatCurrency(tx.amountPaid)}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      {!tx.isLocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(tx)}
                          className="text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <Edit2 size={14} className="mr-1" />
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-ink-soft">Loading ledger...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-ink-soft flex items-center justify-center gap-2">
              <Search size={16} /> No transactions logged yet.
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-ink text-base">{tx.deal?.lead?.name || "Unknown Lead"}</h3>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Total Deal: {tx.deal ? formatCurrency(tx.deal.dealAmount) : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-success text-base">
                      {formatCurrency(tx.amountPaid)}
                    </div>
                    <span className="text-[11px] text-ink-soft block mt-0.5 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{tx.paymentMode}</Badge>
                    {tx.referenceNumber && (
                      <span className="font-mono text-ink-soft text-[11px] truncate max-w-[120px]">
                        Ref: {tx.referenceNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.isLocked ? (
                      <Badge variant="default" className="flex items-center gap-1 bg-bg border border-border text-[11px]">
                        <Lock size={10} /> Locked
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="flex items-center gap-1 text-[11px]">
                        <Unlock size={10} /> Unlocked
                      </Badge>
                    )}
                    {!tx.isLocked && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(tx)}
                        className="h-7 px-2 text-xs"
                      >
                        <Edit2 size={12} className="mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-serif text-ink mb-1">Edit Transaction</h3>
            <p className="text-sm text-ink-soft mb-6">
              Correct the details for this unlocked payment. It will automatically lock upon save.
            </p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Amount Paid (₹)</label>
                <Input 
                  type="number" 
                  min="1"
                  required 
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Payment Mode</label>
                <Select
                  required
                  value={editMode}
                  onChange={(e) => setEditMode(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CASH">Cash</option>
                </Select>
              </div>
              {editMode !== "CASH" && (
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Reference Number</label>
                  <Input 
                    type="text" 
                    required 
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    placeholder="Transaction ID / Cheque No."
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setEditingTx(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
