"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Lock, Unlock, FileDown, Search } from "lucide-react";

interface Transaction {
  id: string;
  amountPaid: number;
  paymentMode: string;
  referenceNumber: string | null;
  isLocked: boolean;
  createdAt: string;
  unlockedAt: string | null;
  loggedBy: {
    name: string;
  };
  unlockedBy: {
    name: string;
  } | null;
  deal: {
    dealAmount: number;
    lead: {
      name: string;
    };
  };
}

export default function TransactionsLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/transactions");
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

  const handleUnlock = async (id: string) => {
    try {
      await api.patch(`/transactions/${id}/unlock`);
      // Update local state to reflect unlock
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isLocked: false, unlockedAt: new Date().toISOString() } : t
        )
      );
    } catch (err) {
      console.error("Failed to unlock transaction", err);
      alert("Failed to unlock transaction");
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await api.get("/reports/transactions/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions.csv");
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
          <h1 className="text-2xl font-serif text-ink">Transactions Ledger</h1>
          <p className="text-sm text-ink-soft mt-1">
            Master record of all payments across all deals.
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
        <div className="overflow-x-auto">
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
                    <Search size={16} /> No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-mono text-sm text-ink whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-ink-soft mt-1">
                        By: {tx.loggedBy?.name}
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
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="warning" className="flex items-center gap-1 w-fit">
                            <Unlock size={12} /> Unlocked
                          </Badge>
                          {tx.unlockedBy && (
                            <span className="text-[10px] text-ink-soft">
                              by {tx.unlockedBy.name}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="font-mono font-medium text-success">
                        {formatCurrency(tx.amountPaid)}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      {tx.isLocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlock(tx.id)}
                          className="text-warning hover:text-warning hover:bg-warning/10"
                        >
                          <Unlock size={14} className="mr-1" />
                          Unlock
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
