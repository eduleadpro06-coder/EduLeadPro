
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";
import * as xlsx from "xlsx";

interface LedgerEntry {
    id: number;
    transactionId: number;
    accountId: number;
    debit: string;
    credit: string;
    description: string;
    entryDate: string;
}

interface Account {
    id: number;
    name: string;
    code: string;
}

export default function AccountingReports() {
    const [selectedAccount, setSelectedAccount] = useState<string>("all");

    // Fetch Accounts
    const { data: accounts } = useQuery<Account[]>({
        queryKey: ['/api/accounting/accounts'],
    });

    // Fetch Ledger
    const { data: entries, isLoading } = useQuery<LedgerEntry[]>({
        queryKey: ['/api/accounting/reports/ledger', selectedAccount],
        queryFn: async () => {
            const url = selectedAccount && selectedAccount !== "all"
                ? `/api/accounting/reports/ledger?accountId=${selectedAccount}`
                : `/api/accounting/reports/ledger`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed");
            return res.json();
        }
    });

    const exportToExcel = () => {
        if (!entries) return;
        const worksheet = xlsx.utils.json_to_sheet(entries);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Ledger");
        xlsx.writeFile(workbook, "ledger_export.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Filter by Account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Accounts</SelectItem>
                            {accounts?.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id.toString()}>
                                    {acc.code} - {acc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" onClick={exportToExcel} disabled={!entries || entries.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Ledger</CardTitle>
                    <CardDescription>
                        {selectedAccount === "all" ? "Showing all entries" : `Showing entries for account filtering`}
                    </CardDescription>
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
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries?.map((entry) => {
                                    const accountName = accounts?.find(a => a.id === entry.accountId)?.name || entry.accountId;
                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell>
                                                <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs px-2">
                                                    {accountName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {Number(entry.debit) > 0 ? Number(entry.debit).toFixed(2) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {Number(entry.credit) > 0 ? Number(entry.credit).toFixed(2) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {(!entries || entries.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground p-4">
                                            No ledger entries found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
