import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/utils";
import { TrendingUp, TrendingDown, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockTransactionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
}

export function StockTransactionModal({ open, onOpenChange, item }: StockTransactionModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [transactionType, setTransactionType] = useState<"in" | "out">("in");
    const [formData, setFormData] = useState({
        quantity: "",
        reason: "",
        notes: "",
        unitCost: "",
        createExpense: false,
        expenseCategory: "School Supplies",
        leadId: "",
    });
    const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);

    // Auto-generate reference number based on timestamp
    const generateReference = () => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = date.getTime().toString().slice(-4);
        return `INV-${dateStr}-${timeStr}`;
    };

    // Fetch leads for linking to stock-out
    const { data: leads = [] } = useQuery({
        queryKey: ['/api/leads'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/leads');
            return await response.json();
        },
        enabled: transactionType === 'out', // Only fetch when stock-out
    });

    const createTransactionMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/inventory/transactions", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
            queryClient.invalidateQueries({ queryKey: ['/api/inventory/transactions'] });
            toast({
                title: "Success",
                description: `Stock ${transactionType === 'in' ? 'added' : 'removed'} successfully${formData.createExpense && transactionType === 'in' ? ' and expense created' : ''}`
            });
            onOpenChange(false);
            resetForm();
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to record transaction", variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        const quantity = Number(formData.quantity);
        const stockBefore = item.currentStock || 0;
        const stockAfter = transactionType === 'in'
            ? stockBefore + quantity
            : stockBefore - quantity;

        if (stockAfter < 0) {
            toast({ title: "Error", description: "Insufficient stock for this transaction", variant: "destructive" });
            return;
        }

        const unitCost = formData.unitCost ? Number(formData.unitCost) : null;
        const totalCost = unitCost ? unitCost * quantity : null;

        createTransactionMutation.mutate({
            itemId: item.id,
            transactionType,
            quantity,
            stockBefore,
            stockAfter,
            reason: formData.reason || (transactionType === 'in' ? 'Purchase' : 'Sale'),
            reference: generateReference(), // Auto-generated
            notes: formData.notes || null,
            unitCost: unitCost ? unitCost.toString() : null,
            totalCost: totalCost ? totalCost.toString() : null,
            leadId: formData.leadId && formData.leadId !== 'none' ? Number(formData.leadId) : null,
            createExpense: formData.createExpense && transactionType === 'in',
            expenseCategory: formData.expenseCategory,
        });
    };

    const resetForm = () => {
        setFormData({
            quantity: "",
            reason: "",
            notes: "",
            unitCost: "",
            createExpense: false,
            expenseCategory: "School Supplies",
            leadId: "",
        });
        setTransactionType("in");
    };

    const totalCost = formData.quantity && formData.unitCost
        ? Number(formData.quantity) * Number(formData.unitCost)
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Record Stock Transaction</DialogTitle>
                    <DialogDescription>
                        {item?.name} | Current Stock: {item?.currentStock ?? 0} {item?.unit || 'pieces'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant={transactionType === "in" ? "default" : "outline"}
                                className={transactionType === "in" ? "bg-green-600 hover:bg-green-700" : ""}
                                onClick={() => setTransactionType("in")}
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Stock In
                            </Button>
                            <Button
                                type="button"
                                variant={transactionType === "out" ? "default" : "outline"}
                                className={transactionType === "out" ? "bg-red-600 hover:bg-red-700" : ""}
                                onClick={() => setTransactionType("out")}
                            >
                                <TrendingDown className="h-4 w-4 mr-2" />
                                Stock Out
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                min="1"
                                required
                                placeholder="Enter quantity..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={transactionType === 'in' ? "Purchase" : "Sale"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {transactionType === 'in' ? (
                                        <>
                                            <SelectItem value="Purchase">Purchase</SelectItem>
                                            <SelectItem value="Return">Return</SelectItem>
                                            <SelectItem value="Adjustment">Adjustment</SelectItem>
                                            <SelectItem value="Donation">Donation</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="Sale">Sale</SelectItem>
                                            <SelectItem value="Damage">Damage</SelectItem>
                                            <SelectItem value="Loss">Loss</SelectItem>
                                            <SelectItem value="Distribution">Distribution</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {transactionType === 'in' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="unitCost">Unit Cost (₹)</Label>
                                    <Input
                                        id="unitCost"
                                        type="number"
                                        step="0.01"
                                        value={formData.unitCost}
                                        onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                                        min="0"
                                        placeholder="Cost per unit..."
                                    />
                                    {totalCost > 0 && (
                                        <p className="text-sm text-gray-600">
                                            Total Cost: <span className="font-semibold">₹{totalCost.toLocaleString()}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Checkbox
                                        id="createExpense"
                                        checked={formData.createExpense}
                                        onCheckedChange={(checked) => setFormData({ ...formData, createExpense: checked as boolean })}
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor="createExpense" className="font-medium cursor-pointer">
                                            Record as Expense
                                        </Label>
                                        <p className="text-xs text-gray-600">Automatically create an expense record for this purchase</p>
                                    </div>
                                </div>

                                {formData.createExpense && (
                                    <div className="space-y-2">
                                        <Label htmlFor="expenseCategory">Expense Category</Label>
                                        <Select value={formData.expenseCategory} onValueChange={(value) => setFormData({ ...formData, expenseCategory: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="School Supplies">School Supplies</SelectItem>
                                                <SelectItem value="Furniture">Furniture</SelectItem>
                                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                <SelectItem value="Textbooks">Textbooks</SelectItem>
                                                <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}

                        {transactionType === 'out' && (
                            <div className="space-y-2">
                                <Label>Customer/Parent (Optional)</Label>
                                <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={leadPopoverOpen}
                                            className="w-full justify-between"
                                        >
                                            {formData.leadId && formData.leadId !== 'none'
                                                ? (() => {
                                                    const selectedLead = leads.find((lead: any) => lead.id.toString() === formData.leadId);
                                                    if (selectedLead) {
                                                        const parts = [selectedLead.studentName, selectedLead.parentName].filter(Boolean);
                                                        return parts.join(' - ') || 'Select customer...';
                                                    }
                                                    return "Select customer...";
                                                })()
                                                : "Select customer or parent..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search by name or phone..." />
                                            <CommandEmpty>No lead found.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-auto">
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        setFormData({ ...formData, leadId: 'none' });
                                                        setLeadPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.leadId === 'none' ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    No Customer
                                                </CommandItem>
                                                {leads.map((lead: any) => (
                                                    <CommandItem
                                                        key={lead.id}
                                                        value={`${lead.studentName} ${lead.parentName} ${lead.phone}`}
                                                        onSelect={() => {
                                                            setFormData({ ...formData, leadId: lead.id.toString() });
                                                            setLeadPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.leadId === lead.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{[lead.studentName, lead.parentName].filter(Boolean).join(' - ')}</span>
                                                            <span className="text-xs text-gray-500">{lead.phone}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-gray-500">Link sale to a specific customer (optional)</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={transactionType === 'in' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {transactionType === 'in' ? 'Add Stock' : 'Remove Stock'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
