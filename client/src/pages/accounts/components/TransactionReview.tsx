
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, AlertCircle, Edit2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: string;
    type: "credit" | "debit";
    confidenceScore: string;
    suggestedAccountId?: number;
    classificationReason?: string;
    status: string;
}

interface Account {
    id: number;
    name: string;
    code: string;
    type: string;
}

export default function TransactionReview() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingTxId, setEditingTxId] = useState<number | null>(null);

    // Fetch Review Queue
    const { data: transactions, isLoading } = useQuery<Transaction[]>({
        queryKey: ['/api/accounting/transactions/review'],
    });

    // Fetch Accounts for dropdown
    const { data: accounts } = useQuery<Account[]>({
        queryKey: ['/api/accounting/accounts'],
    });

    // Update classification
    const updateMutation = useMutation({
        mutationFn: async ({ id, accountId }: { id: number, accountId: number }) => {
            return apiRequest("PATCH", `/api/accounting/transactions/${id}`, {
                accountId,
                reason: "Manual Review",
                description: "Feedback" // Triggers learning
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions/review'] });
            toast({ title: "Updated", description: "Transaction classification updated." });
            setEditingTxId(null);
        }
    });

    // Post Transaction
    const postMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest("POST", `/api/accounting/transactions/${id}/post`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions/review'] });
            toast({ title: "Posted", description: "Transaction posted to ledger." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Review & Approve Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Classification</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions?.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={tx.description}>{tx.description}</TableCell>
                                    <TableCell className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={tx.suggestedAccountId?.toString()}
                                                onValueChange={(val) => updateMutation.mutate({ id: tx.id, accountId: parseInt(val) })}
                                            >
                                                <SelectTrigger className="w-[200px] h-8 text-xs">
                                                    <SelectValue placeholder="Select Account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts?.map((acc) => (
                                                        <SelectItem key={acc.id} value={acc.id.toString()}>
                                                            {acc.code} - {acc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            {tx.classificationReason}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {Number(tx.confidenceScore) >= 0.8 ? (
                                            <span className="text-green-600 text-xs flex items-center">
                                                <CheckCircle className="w-3 h-3 mr-1" /> High
                                            </span>
                                        ) : (
                                            <span className="text-yellow-600 text-xs flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Low
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            className="h-8 bg-green-600 hover:bg-green-700"
                                            onClick={() => postMutation.mutate(tx.id)}
                                            disabled={!tx.suggestedAccountId || postMutation.isPending}
                                        >
                                            {postMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                                            Post
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!transactions || transactions.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground p-10">
                                        No transactions pending review. All caught up!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

// Icon helper
function CheckCircle({ className }: { className?: string }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
