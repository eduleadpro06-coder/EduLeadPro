import { useState } from "react";
import { useQueryState } from "@/hooks/use-query-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/utils";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package, TrendingDown, AlertTriangle, DollarSign, Download, Settings, List, History, Pencil, Trash2, ShoppingCart } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AddItemModal } from "@/components/inventory/add-item-modal";
import { EditItemModal } from "@/components/inventory/edit-item-modal";
import { StockTransactionModal } from "@/components/inventory/stock-transaction-modal";
import { CategorySupplierManager } from "@/components/inventory/category-supplier-manager";
import { TransactionsTab } from "@/components/inventory/transactions-tab";
import { SellOrdersTab } from "@/components/inventory/sell-orders-tab";
import { CreateSellOrderModal } from "@/components/inventory/create-sell-order-modal";

export default function Inventory() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useQueryState<"sell-orders" | "items" | "transactions">("tab", "sell-orders");
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");

    const [addItemOpen, setAddItemOpen] = useState(false);
    const [editItemOpen, setEditItemOpen] = useState(false);
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [managerModalOpen, setManagerModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [createSellOrderOpen, setCreateSellOrderOpen] = useState(false);

    // Fetch inventory stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['/api/inventory/stats'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/inventory/stats');
            return await response.json();
        },
    });

    // Fetch all inventory items with filters
    const { data: items = [], isLoading: itemsLoading } = useQuery({
        queryKey: ['/api/inventory/items', searchTerm, categoryFilter, supplierFilter, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter && categoryFilter !== 'all') params.append('categoryId', categoryFilter);
            if (supplierFilter && supplierFilter !== 'all') params.append('supplierId', supplierFilter);
            if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active' ? 'true' : 'false');

            const url = params.toString() ? `/api/inventory/items?${params}` : '/api/inventory/items';
            const response = await apiRequest('GET', url);
            return await response.json();
        },
    });

    // Fetch low stock items
    const { data: lowStockItems = [] } = useQuery({
        queryKey: ['/api/inventory/low-stock'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/inventory/low-stock');
            return await response.json();
        },
    });

    const handleStockAction = (item: any) => {
        setSelectedItem(item);
        setTransactionModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setItemToEdit(item);
        setEditItemOpen(true);
    };

    const deleteItemMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/inventory/items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/stats'] });
            toast({ title: "Success", description: "Item deleted successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
        },
    });

    const handleDelete = (item: any) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
            deleteItemMutation.mutate(item.id);
        }
    };

    const exportToCSV = () => {
        if (items.length === 0) {
            toast({ title: "No Data", description: "No items to export", variant: "destructive" });
            return;
        }

        const headers = ["Item Code", "Name", "Category", "Supplier", "Stock", "Unit", "Cost Price", "Selling Price", "Location", "Status"];
        const rows = items.map((item: any) => [
            item.itemCode || "",
            item.name,
            item.category?.name || "",
            item.supplier?.name || "",
            item.currentStock || 0,
            item.unit || "",
            item.costPrice || "",
            item.sellingPrice || "",
            item.location || "",
            item.isActive ? "Active" : "Inactive"
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map((cell: any) => `"${cell}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        toast({ title: "Success", description: "Inventory exported to CSV" });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Header
                title="Stock Management"
                subtitle="Manage your inventory, track stock levels, and monitor expenses"
            />

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header & Navigation Combined */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b">
                    {/* Tab Navigation */}
                    <div className="flex gap-2 -mb-px">
                        <Button
                            variant={activeTab === "sell-orders" ? "default" : "ghost"}
                            onClick={() => setActiveTab("sell-orders")}
                            className="rounded-b-none"
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Sell Orders
                        </Button>
                        <Button
                            variant={activeTab === "items" ? "default" : "ghost"}
                            onClick={() => setActiveTab("items")}
                            className="rounded-b-none"
                        >
                            <List className="h-4 w-4 mr-2" />
                            Items & Inventory
                        </Button>
                        <Button
                            variant={activeTab === "transactions" ? "default" : "ghost"}
                            onClick={() => setActiveTab("transactions")}
                            className="rounded-b-none"
                        >
                            <History className="h-4 w-4 mr-2" />
                            Transaction History
                        </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mb-1">
                        <Button variant="outline" onClick={() => setManagerModalOpen(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                        </Button>
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button onClick={() => setAddItemOpen(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>
                </div>

                {/* Sell Orders Tab Content */}
                {activeTab === "sell-orders" && (
                    <SellOrdersTab
                        onCreateOrder={() => setCreateSellOrderOpen(true)}
                    />
                )}

                {/* Items Tab Content */}
                {activeTab === "items" && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="shadow-sm border-l-4 border-l-blue-600 hover:shadow-md transition-all backdrop-blur-sm bg-white/80">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-caption font-medium text-gray-500">Total Items</p>
                                            <h3 className="text-h3 mt-2">
                                                {statsLoading ? "..." : stats?.totalItems || 0}
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Package className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">Active inventory items</p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-l-4 border-l-amber-500 hover:shadow-md transition-all backdrop-blur-sm bg-white/80">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-caption font-medium text-gray-500">Low Stock Alerts</p>
                                            <h3 className="text-h3 mt-2">
                                                {statsLoading ? "..." : stats?.lowStockCount || 0}
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-amber-50 rounded-lg">
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">Items below minimum stock</p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-all backdrop-blur-sm bg-white/80">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-caption font-medium text-gray-500">Stock Value</p>
                                            <h3 className="text-h3 mt-2">
                                                ₹{statsLoading ? "..." : Number(stats?.totalValue || 0).toLocaleString()}
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <DollarSign className="h-5 w-5 text-emerald-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">Total inventory valuation</p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-all backdrop-blur-sm bg-white/80">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-caption font-medium text-gray-500">Recent Activity</p>
                                            <h3 className="text-h3 mt-2">
                                                {statsLoading ? "..." : stats?.recentTransactionsCount || 0}
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <TrendingDown className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">Transactions (last 30 days)</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Low Stock Alerts */}
                        {lowStockItems.length > 0 && (
                            <Card className="shadow-sm border-l-4 border-l-red-500">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        <CardTitle className="text-h3">Low Stock Alerts</CardTitle>
                                    </div>
                                    <CardDescription>{lowStockItems.length} items need restocking</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {lowStockItems.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                                                <div className="flex items-center gap-3">
                                                    <Package className="h-4 w-4 text-red-600" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            Current: {item.currentStock || 0} {item.unit || 'units'}  |  Minimum: {item.minimumStock || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={() => handleStockAction(item)}>Restock</Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Search and Filters */}
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <SearchInput
                                        placeholder="Search items by name or code..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        wrapperClassName="flex-1"
                                    />

                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-full md:w-[200px]">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {stats?.categories?.map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                                        <SelectTrigger className="w-full md:w-[200px]">
                                            <SelectValue placeholder="All Suppliers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Suppliers</SelectItem>
                                            {stats?.suppliers?.map((sup: any) => (
                                                <SelectItem key={sup.id} value={sup.id.toString()}>{sup.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inventory Items Table */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-h3">Inventory Items</CardTitle>
                                <CardDescription>{items.length} items found</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 border-b">
                                            <tr>
                                                <th className="table-header px-6 py-4 text-left">Item Code</th>
                                                <th className="table-header px-6 py-4 text-left">Name</th>
                                                <th className="table-header px-6 py-4 text-left">Category</th>
                                                <th className="table-header px-6 py-4 text-left">Stock</th>
                                                <th className="table-header px-6 py-4 text-left">Cost Price</th>
                                                <th className="table-header px-6 py-4 text-left">Status</th>
                                                <th className="table-header px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {itemsLoading ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                        Loading inventory items...
                                                    </td>
                                                </tr>
                                            ) : items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <Package className="h-8 w-8 text-gray-300" />
                                                            <p>No inventory items found</p>
                                                            <Button variant="outline" size="sm" className="mt-2" onClick={() => setAddItemOpen(true)}>
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                Add your first item
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map((item: any) => {
                                                    const isLowStock = item.minimumStock && item.currentStock < item.minimumStock;
                                                    return (
                                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 font-mono text-gray-600">{item.itemCode || '-'}</td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                                    {item.description && (
                                                                        <p className="text-xs text-gray-500">{item.description}</p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {item.category ? (
                                                                    <Badge variant="secondary" style={{ backgroundColor: item.category.color + '20', color: item.category.color || '#666' }}>
                                                                        {item.category.name}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className={`flex items-center gap-2 ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                                    {isLowStock && <AlertTriangle className="h-4 w-4" />}
                                                                    <span className="font-semibold">
                                                                        {item.currentStock ?? 0} {item.unit || 'pieces'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-900">
                                                                {item.costPrice ? `₹${Number(item.costPrice).toLocaleString()}` : '-'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {item.isActive ? (
                                                                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                                ) : (
                                                                    <Badge variant="secondary">Inactive</Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(item)}
                                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(item)}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStockAction(item)}
                                                                    >
                                                                        Stock
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Transactions Tab Content */}
                {activeTab === "transactions" && <TransactionsTab />}
            </main>

            {/* Modals */}
            <AddItemModal open={addItemOpen} onOpenChange={setAddItemOpen} />
            {itemToEdit && (
                <EditItemModal
                    open={editItemOpen}
                    onOpenChange={setEditItemOpen}
                    item={itemToEdit}
                />
            )}
            {selectedItem && (
                <StockTransactionModal
                    open={transactionModalOpen}
                    onOpenChange={setTransactionModalOpen}
                    item={selectedItem}
                />
            )}
            <CreateSellOrderModal
                open={createSellOrderOpen}
                onOpenChange={setCreateSellOrderOpen}
            />
            <Dialog open={managerModalOpen} onOpenChange={setManagerModalOpen}>
                <DialogContent className="max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Manage Categories & Suppliers</DialogTitle>
                    </DialogHeader>
                    <CategorySupplierManager />
                </DialogContent>
            </Dialog>
        </div>
    );
}
