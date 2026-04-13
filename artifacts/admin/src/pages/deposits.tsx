import React from "react";
import { useDeposits, useApproveDeposit, useRejectDeposit } from "@/hooks/use-transactions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, X, ArrowDownCircle, Hash, Copy, ShieldCheck } from "lucide-react";

export default function DepositsPage() {
  const { data, isLoading } = useDeposits();
  const approve = useApproveDeposit();
  const reject = useRejectDeposit();

  const deposits = data?.deposits || [];
  const pendingCount = deposits.filter((req) => req.status === "pending").length;

  const copyText = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Deposit Requests</h1>
          <p className="text-muted-foreground">User ke UTR/reference ko bank UPI payment se match karke approve karo.</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-semibold text-green-300">{pendingCount} pending payment match</p>
            <p className="text-xs text-muted-foreground">Approve karte hi wallet balance add ho jayega</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>UPI ID</TableHead>
              <TableHead>UTR / Reference ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : deposits.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No deposit requests</TableCell></TableRow>
            ) : (
              deposits.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <p className="font-semibold text-white">{req.userName}</p>
                    <p className="text-xs text-muted-foreground">{req.userPhone}</p>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-green-400 text-lg flex items-center gap-1">
                      <ArrowDownCircle className="w-4 h-4" />
                      {formatCurrency(req.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-primary">{req.upiId}</TableCell>
                  <TableCell>
                    {req.utrId ? (
                      <button
                        type="button"
                        onClick={() => copyText(req.utrId)}
                        className="flex items-center gap-1 font-mono text-sm font-bold text-yellow-400 hover:text-yellow-300"
                        title="Copy UTR / Reference ID"
                      >
                        <Hash className="w-3 h-3" />
                        {req.utrId}
                        <Copy className="w-3 h-3 opacity-70" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      req.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                          onClick={() => {
                            if (window.confirm(`Approve ₹${req.amount} deposit for ${req.userName || "user"}? Wallet mein amount turant add ho jayega.`)) {
                              approve.mutate(req.id);
                            }
                          }}
                          isLoading={approve.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => {
                            if (window.confirm("Reject this deposit?")) reject.mutate(req.id);
                          }}
                          isLoading={reject.isPending}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
