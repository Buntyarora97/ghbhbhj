import React from "react";
import { useDeposits, useApproveDeposit, useRejectDeposit } from "@/hooks/use-transactions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, X, ExternalLink, ArrowDownCircle } from "lucide-react";

export default function DepositsPage() {
  const { data, isLoading } = useDeposits();
  const approve = useApproveDeposit();
  const reject = useRejectDeposit();

  const deposits = data?.deposits || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Deposit Requests</h1>
        <p className="text-muted-foreground">Review and approve user deposit requests.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>UPI ID Used</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Proof</TableHead>
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
                  <TableCell className="text-sm text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                  <TableCell>
                    {req.screenshotUrl ? (
                      <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline text-sm">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">No screenshot</span>
                    )}
                  </TableCell>
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
                            if (window.confirm("Approve this deposit? Amount will be added to user wallet.")) {
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
