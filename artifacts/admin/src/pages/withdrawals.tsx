import React from "react";
import { useWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from "@/hooks/use-transactions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, X, ArrowUpCircle } from "lucide-react";

export default function WithdrawalsPage() {
  const { data, isLoading } = useWithdrawals();
  const approve = useApproveWithdrawal();
  const reject = useRejectWithdrawal();

  const withdrawals = data?.withdrawals || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Withdrawal Requests</h1>
        <p className="text-muted-foreground">Process user payouts. Ensure you have transferred the money before marking as paid.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Pay To UPI ID</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : withdrawals.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No withdrawal requests</TableCell></TableRow>
            ) : (
              withdrawals.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <p className="font-semibold text-white">{req.userName}</p>
                    <p className="text-xs text-muted-foreground">{req.userPhone}</p>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-red-400 text-lg flex items-center gap-1">
                      <ArrowUpCircle className="w-4 h-4" />
                      {formatCurrency(req.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded">{req.upiId}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(req.upiId)}
                        className="text-xs text-muted-foreground hover:text-white underline"
                      >
                        Copy
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      req.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Did you successfully transfer the money? This marks it as Paid.")) {
                              approve.mutate(req.id);
                            }
                          }}
                          isLoading={approve.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" /> Mark Paid
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Reject this withdrawal? The amount will be refunded to user's wallet.")) {
                              reject.mutate(req.id);
                            }
                          }}
                          isLoading={reject.isPending}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject & Refund
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
