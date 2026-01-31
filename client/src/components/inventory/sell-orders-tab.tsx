import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, formatDateIST } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SellOrdersTabProps {
    onCreateOrder: () => void;
}

export function SellOrdersTab({ onCreateOrder }: SellOrdersTabProps) {
    const { data: sellOrders = [], isLoading } = useQuery({
        queryKey: ['/api/inventory/sell-orders'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/inventory/sell-orders');
            return await response.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Sell Orders</h2>
                    <p className="text-sm text-muted-foreground">
                        View and manage sell orders with GST invoicing
                    </p>
                </div>
                <Button
                    onClick={onCreateOrder}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sell Order
                </Button>
            </div>

            {/* Orders List */}
            {sellOrders.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Sell Orders Yet</h3>
                            <p className="text-gray-600 mb-4">
                                Create your first sell order to start selling inventory items to parents/students
                            </p>
                            <Button onClick={onCreateOrder}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Order
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {sellOrders.map((order: any) => (
                        <Card key={order.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {order.orderNumber}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {order.parentName} • {formatDateIST(order.createdAt)}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            order.paymentStatus === "paid"
                                                ? "default"
                                                : order.paymentStatus === "pending"
                                                    ? "secondary"
                                                    : "outline"
                                        }
                                    >
                                        {order.paymentStatus}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Subtotal</p>
                                        <p className="font-semibold">₹{parseFloat(order.subtotal).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">GST (18%)</p>
                                        <p className="font-semibold">₹{parseFloat(order.gstAmount).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="font-semibold text-lg">₹{parseFloat(order.totalAmount).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Payment Mode</p>
                                        <p className="font-semibold">{order.paymentMode || "N/A"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
