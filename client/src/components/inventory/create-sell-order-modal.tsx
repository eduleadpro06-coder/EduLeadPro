import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CreateSellOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface OrderItem {
    inventoryItemId: number;
    itemName: string;
    quantity: number;
    unitPrice: string;
    availableStock: number;
}

export function CreateSellOrderModal({ open, onOpenChange }: CreateSellOrderModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [studentSearch, setStudentSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [paymentMode, setPaymentMode] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("pending");
    const [notes, setNotes] = useState("");

    // Search students
    const { data: students = [] } = useQuery({
        queryKey: ['/api/inventory/students/search', studentSearch],
        queryFn: async () => {
            if (studentSearch.length < 2) return [];
            const response = await apiRequest('GET', `/api/inventory/students/search?search=${encodeURIComponent(studentSearch)}`);
            return await response.json();
        },
        enabled: studentSearch.length >= 2,
    });

    // Fetch inventory items
    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['/api/inventory/items'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/inventory/items?isActive=true');
            return await response.json();
        },
    });

    const createOrderMutation = useMutation({
        mutationFn: async (orderData: any) => {
            const response = await apiRequest('POST', '/api/inventory/sell-orders', orderData);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create sell order');
            }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/sell-orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/transactions'] });
            toast({ title: "Success", description: "Sell order created successfully" });
            handleClose();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create sell order",
                variant: "destructive"
            });
        },
    });

    const handleClose = () => {
        setSelectedStudent(null);
        setStudentSearch("");
        setOrderItems([]);
        setPaymentMode("");
        setPaymentStatus("pending");
        setNotes("");
        onOpenChange(false);
    };

    const addItem = () => {
        setOrderItems([...orderItems, {
            inventoryItemId: 0,
            itemName: "",
            quantity: 1,
            unitPrice: "0",
            availableStock: 0
        }]);
    };

    const removeItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const updated = [...orderItems];

        if (field === 'inventoryItemId') {
            const item = inventoryItems.find((i: any) => i.id === parseInt(value));
            if (item) {
                updated[index] = {
                    ...updated[index],
                    inventoryItemId: item.id,
                    itemName: item.name,
                    unitPrice: item.sellingPrice || item.costPrice || "0",
                    availableStock: item.currentStock || 0
                };
            }
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }

        setOrderItems(updated);
    };

    // Calculate totals
    const calculateTotals = () => {
        const subtotal = orderItems.reduce((sum, item) => {
            return sum + (parseFloat(item.unitPrice) * item.quantity);
        }, 0);

        const gstAmount = subtotal * 0.18; // 18% GST
        const total = subtotal + gstAmount;

        return { subtotal, gstAmount, total };
    };

    const handleSubmit = () => {
        // Validation
        if (!selectedStudent) {
            toast({ title: "Error", description: "Please select a student/parent", variant: "destructive" });
            return;
        }

        if (orderItems.length === 0) {
            toast({ title: "Error", description: "Please add at least one item", variant: "destructive" });
            return;
        }

        // Validate all items
        for (const item of orderItems) {
            if (!item.inventoryItemId || item.inventoryItemId === 0) {
                toast({ title: "Error", description: "Please select an item for all rows", variant: "destructive" });
                return;
            }
            if (item.quantity <= 0) {
                toast({ title: "Error", description: "Quantity must be greater than 0", variant: "destructive" });
                return;
            }
            if (item.quantity > item.availableStock) {
                toast({
                    title: "Error",
                    description: `Insufficient stock for ${item.itemName}. Available: ${item.availableStock}`,
                    variant: "destructive"
                });
                return;
            }
        }

        const orderData = {
            leadId: selectedStudent.id,
            parentName: selectedStudent.parentName,
            items: orderItems.map(item => ({
                inventoryItemId: item.inventoryItemId,
                itemName: item.itemName,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })),
            paymentMode: paymentMode || undefined,
            paymentStatus,
            notes: notes || undefined
        };

        createOrderMutation.mutate(orderData);
    };

    const { subtotal, gstAmount, total } = calculateTotals();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Create Sell Order
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Student Selection */}
                    <div className="space-y-2">
                        <Label>Select Student/Parent</Label>
                        {selectedStudent ? (
                            <Card className="p-3 bg-blue-50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{selectedStudent.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Parent: {selectedStudent.parentName} • {selectedStudent.phone}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedStudent(null)}
                                    >
                                        Change
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                <Input
                                    placeholder="Search by student name or phone..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                                {students.length > 0 && (
                                    <Card className="max-h-48 overflow-y-auto">
                                        {students.map((student: any) => (
                                            <div
                                                key={student.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setStudentSearch("");
                                                }}
                                            >
                                                <p className="font-semibold">{student.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Parent: {student.parentName} • {student.phone} • Class: {student.class}
                                                </p>
                                            </div>
                                        ))}
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Order Items</Label>
                            <Button onClick={addItem} size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        {orderItems.length === 0 ? (
                            <Card className="p-6 text-center text-muted-foreground">
                                No items added. Click "Add Item" to begin.
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {orderItems.map((item, index) => (
                                    <Card key={index} className="p-4">
                                        <div className="grid grid-cols-12 gap-3 items-start">
                                            <div className="col-span-5">
                                                <Label className="text-xs">Item</Label>
                                                <Select
                                                    value={item.inventoryItemId.toString()}
                                                    onValueChange={(value) => updateItem(index, 'inventoryItemId', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {inventoryItems.map((invItem: any) => (
                                                            <SelectItem key={invItem.id} value={invItem.id.toString()}>
                                                                {invItem.name} (Stock: {invItem.currentStock})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-2">
                                                <Label className="text-xs">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={item.availableStock}
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <Label className="text-xs">Unit Price (₹)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <Label className="text-xs">Subtotal</Label>
                                                <p className="font-semibold mt-2">
                                                    ₹{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>

                                            <div className="col-span-1 flex items-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Totals */}
                    {orderItems.length > 0 && (
                        <Card className="p-4 bg-gray-50">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-blue-600">
                                    <span>GST (18%):</span>
                                    <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg border-t pt-2">
                                    <span className="font-bold">Grand Total:</span>
                                    <span className="font-bold">₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Payment Mode</Label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Status</Label>
                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Input
                            placeholder="Additional notes or remarks..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createOrderMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {createOrderMutation.isPending ? "Creating..." : "Create Sell Order"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
