import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/utils";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CategorySupplierManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"categories" | "suppliers">("categories");
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: "", description: "", color: "#8b5cf6" });
    const [supplierForm, setSupplierForm] = useState({ name: "", contactPerson: "", email: "", phone: "", address: "" });

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

    const createCategoryMutation = useMutation({
        mutationFn: async (data: any) => apiRequest("POST", "/api/inventory/categories", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/categories'] });
            toast({ title: "Success", description: "Category created successfully" });
            setCategoryModalOpen(false);
            setCategoryForm({ name: "", description: "", color: "#8b5cf6" });
        },
    });

    const createSupplierMutation = useMutation({
        mutationFn: async (data: any) => apiRequest("POST", "/api/inventory/suppliers", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/suppliers'] });
            toast({ title: "Success", description: "Supplier created successfully" });
            setSupplierModalOpen(false);
            setSupplierForm({ name: "", contactPerson: "", email: "", phone: "", address: "" });
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async ({ id, force }: { id: number, force?: boolean }) => {
            return apiRequest("DELETE", `/api/inventory/categories/${id}${force ? '?force=true' : ''}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/categories'] });
            toast({ title: "Success", description: "Category deleted" });
        },
        onError: (error: any, variables) => {
            const message = error.errorData?.message || "Failed to delete category";
            if (message === "Cannot delete category with associated inventory items") {
                if (window.confirm("This category has associated inventory items. Do you want to force delete it? Items will be unlinked (uncategorized).")) {
                    deleteCategory.mutate({ id: variables.id, force: true });
                    return;
                }
            }
            toast({ title: "Error", description: message, variant: "destructive" });
        },
    });

    const deleteSupplier = useMutation({
        mutationFn: async ({ id, force }: { id: number, force?: boolean }) => {
            return apiRequest("DELETE", `/api/inventory/suppliers/${id}${force ? '?force=true' : ''}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/suppliers'] });
            toast({ title: "Success", description: "Supplier deleted" });
        },
        onError: (error: any, variables) => {
            const message = error.errorData?.message || "Failed to delete supplier";
            if (message === "Cannot delete supplier with associated inventory items") {
                if (window.confirm("This supplier has associated inventory items. Do you want to force delete it? Items will be unlinked (no supplier).")) {
                    deleteSupplier.mutate({ id: variables.id, force: true });
                    return;
                }
            }
            toast({ title: "Error", description: message, variant: "destructive" });
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeTab === "categories" ? "default" : "ghost"}
                    onClick={() => setActiveTab("categories")}
                    className="rounded-b-none"
                >
                    Categories
                </Button>
                <Button
                    variant={activeTab === "suppliers" ? "default" : "ghost"}
                    onClick={() => setActiveTab("suppliers")}
                    className="rounded-b-none"
                >
                    Suppliers
                </Button>
            </div>

            {activeTab === "categories" ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Categories</CardTitle>
                        <Button onClick={() => setCategoryModalOpen(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" /> Add Category
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {categories.map((cat: any) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color || "#666" }} />
                                        <div>
                                            <p className="font-medium">{cat.name}</p>
                                            {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteCategory.mutate({ id: cat.id })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Suppliers</CardTitle>
                        <Button onClick={() => setSupplierModalOpen(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" /> Add Supplier
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {suppliers.map((sup: any) => (
                                <div key={sup.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{sup.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {sup.contactPerson && `${sup.contactPerson} • `}
                                            {sup.phone || sup.email}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteSupplier.mutate({ id: sup.id })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Category Modal */}
            <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createCategoryMutation.mutate(categoryForm); }}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <Input
                                    type="color"
                                    value={categoryForm.color}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Supplier Modal */}
            <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createSupplierMutation.mutate(supplierForm); }}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Supplier Name *</Label>
                                <Input
                                    value={supplierForm.name}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Contact Person</Label>
                                    <Input
                                        value={supplierForm.contactPerson}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={supplierForm.phone}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={supplierForm.email}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Textarea
                                    value={supplierForm.address}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSupplierModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
