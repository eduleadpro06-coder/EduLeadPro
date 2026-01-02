import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package, User, Calendar } from "lucide-react";
import { format } from "date-fns";

export function TransactionsTab() {
    // Fetch all transactions
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['/api/inventory/transactions'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/inventory/transactions');
            return await response.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <p className="text-gray-500">Loading transactions...</p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">No transactions recorded yet</p>
                        <p className="text-sm text-gray-400">Stock movements will appear here</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Stock In</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {transactions.filter((t: any) => t.transactionType === 'in').length}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Stock Out</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {transactions.filter((t: any) => t.transactionType === 'out').length}
                                </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Value</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{transactions
                                        .filter((t: any) => t.totalCost)
                                        .reduce((sum: number, t: any) => sum + Number(t.totalCost), 0)
                                        .toLocaleString()}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <p className="text-sm text-gray-500">{transactions.length} total transactions</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Date</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Type</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Item</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Quantity</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Stock Change</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Reason</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Reference</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-500">Customer/Lead</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((tx: any) => {
                                    const isStockIn = tx.transactionType === 'in';
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-xs">
                                                        {tx.transactionDate ? format(new Date(tx.transactionDate), "MMM dd, yyyy HH:mm") : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    className={isStockIn ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                                >
                                                    {isStockIn ? (
                                                        <>
                                                            <TrendingUp className="h-3 w-3 mr-1" />
                                                            Stock In
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrendingDown className="h-3 w-3 mr-1" />
                                                            Stock Out
                                                        </>
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{tx.item?.name || 'Unknown'}</p>
                                                    {tx.item?.itemCode && (
                                                        <p className="text-xs text-gray-500 font-mono">{tx.item.itemCode}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${isStockIn ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isStockIn ? '+' : '-'}{tx.quantity} {tx.item?.unit || 'units'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="text-xs">
                                                    <span className="text-gray-400">{tx.stockBefore}</span>
                                                    <span className="mx-1">→</span>
                                                    <span className="font-semibold">{tx.stockAfter}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-700">{tx.reason || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.reference ? (
                                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{tx.reference}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.lead ? (
                                                    <div>
                                                        <p className="font-medium text-gray-900">{tx.lead.studentName}</p>
                                                        {tx.lead.parentName && (
                                                            <p className="text-xs text-gray-500">{tx.lead.parentName}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
