import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/utils";

interface AddItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddItemModal({ open, onOpenChange }: AddItemModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: "",
        itemCode: "",
        description: "",
        categoryId: "",
        supplierId: "",
        currentStock: "0",
        minimumStock: "0",
        unit: "pieces",
        costPrice: "",
        sellingPrice: "",
        location: "",
    });

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ['/api/inventory/categories'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/inventory/categories');
            return await response.json();
        },
    });

    // Fetch suppliers
    const { data: suppliers = [] } = useQuery({
        queryKey: ['/api/inventory/suppliers'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/inventory/suppliers');
            return await response.json();
        },
    });

    const createItemMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/inventory/items", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/stats'] });
            toast({ title: "Success", description: "Item added successfully" });
            onOpenChange(false);
            resetForm();
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createItemMutation.mutate({
            ...formData,
            categoryId: formData.categoryId ? Number(formData.categoryId) : null,
            supplierId: formData.supplierId ? Number(formData.supplierId) : null,
            currentStock: Number(formData.currentStock),
            minimumStock: Number(formData.minimumStock),
            costPrice: formData.costPrice || null,
            sellingPrice: formData.sellingPrice || null,
        });
    };

    const resetForm = () => {
        setFormData({
            name: "",
            itemCode: "",
            description: "",
            categoryId: "",
            supplierId: "",
            currentStock: "0",
            minimumStock: "0",
            unit: "pieces",
            costPrice: "",
            sellingPrice: "",
            location: "",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Stock Item</DialogTitle>
                    <DialogDescription>Add a new item to your inventory</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Item Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="itemCode">Item Code/SKU</Label>
                                <Input
                                    id="itemCode"
                                    value={formData.itemCode}
                                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                                    placeholder="SKU-001"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Item description..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supplier">Supplier</Label>
                                <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((sup: any) => (
                                            <SelectItem key={sup.id} value={sup.id.toString()}>
                                                {sup.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentStock">Current Stock *</Label>
                                <Input
                                    id="currentStock"
                                    type="number"
                                    value={formData.currentStock}
                                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minimumStock">Minimum Stock *</Label>
                                <Input
                                    id="minimumStock"
                                    type="number"
                                    value={formData.minimumStock}
                                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pieces">Pieces</SelectItem>
                                        <SelectItem value="kg">Kilograms</SelectItem>
                                        <SelectItem value="liters">Liters</SelectItem>
                                        <SelectItem value="boxes">Boxes</SelectItem>
                                        <SelectItem value="packs">Packs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="costPrice">Cost Price (₹)</Label>
                                <Input
                                    id="costPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.costPrice}
                                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                    min="0"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                                <Input
                                    id="sellingPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.sellingPrice}
                                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                    min="0"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Storage Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Shelf A-3, Warehouse 2"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Add Item
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
