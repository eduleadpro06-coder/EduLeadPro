
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInCalendarDays } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/utils";

interface LeaveRequest {
    id: number;
    staffId: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    appliedAt: string;
}

interface Staff {
    id: number;
    name: string;
    totalLeaves?: number;
    clLimit?: number;
    elLimit?: number;
}

interface StaffLeavesTabProps {
    staffId: number;
}

import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Edit2, Calendar, Target, CheckCircle2 } from "lucide-react";

export function StaffLeavesTab({ staffId }: StaffLeavesTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null }>({
        open: false,
        id: null,
    });
    const [rejectionReason, setRejectionReason] = useState("");
    const [isEditingCL, setIsEditingCL] = useState(false);
    const [isEditingEL, setIsEditingEL] = useState(false);
    const [quotaInputCL, setQuotaInputCL] = useState("");
    const [quotaInputEL, setQuotaInputEL] = useState("");

    // Fetch staff details to get totalLeaves
    const { data: staff } = useQuery<Staff>({
        queryKey: ["staff", staffId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/staff/${staffId}`);
            return res.json();
        },
    });

    const { data: leaves, isLoading } = useQuery<LeaveRequest[]>({
        queryKey: ["staff-leaves", staffId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/staff/${staffId}/leaves`);
            return res.json();
        },
    });

    const updateQuotaMutation = useMutation({
        mutationFn: async (updates: { clLimit?: number; elLimit?: number }) => {
            const res = await apiRequest("PATCH", `/api/staff/${staffId}/leave-quota`, updates);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
            toast({ title: "Success", description: "Leave quota updated successfully" });
            setIsEditingCL(false);
            setIsEditingEL(false);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update leave quota", variant: "destructive" });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: number; status: 'approved' | 'rejected'; reason?: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/leaves/${id}`, { status, rejectionReason: reason });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff-leaves", staffId] });
            toast({ title: "Success", description: "Leave request updated successfully" });
            setRejectDialog({ open: false, id: null });
            setRejectionReason("");
        },
        onError: (error) => {
            toast({ title: "Error", description: "Failed to update leave request", variant: "destructive" });
        },
    });

    const handleApprove = (id: number) => {
        updateStatusMutation.mutate({ id, status: "approved" });
    };

    const handleRejectClick = (id: number) => {
        setRejectDialog({ open: true, id });
    };

    const confirmReject = () => {
        if (rejectDialog.id && rejectionReason) {
            updateStatusMutation.mutate({ id: rejectDialog.id, status: "rejected", reason: rejectionReason });
        }
    };

    const handleSaveCL = () => {
        const val = parseInt(quotaInputCL);
        if (!isNaN(val) && val >= 0) {
            updateQuotaMutation.mutate({ clLimit: val });
        }
    };

    const handleSaveEL = () => {
        const val = parseInt(quotaInputEL);
        if (!isNaN(val) && val >= 0) {
            updateQuotaMutation.mutate({ elLimit: val });
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "approved": return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case "rejected": return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default: return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const clLimit = staff?.clLimit ?? 10;
    const elLimit = staff?.elLimit ?? 5;

    // Calculate used leaves (count of approved requests)
    const calculateUsedCount = (type: 'CL' | 'EL') => {
        if (!leaves) return 0;
        return leaves.filter(l => l.status === 'approved' && ((l as any).leaveType === type || (l as any).leave_type === type)).length;
    };

    const clUsed = calculateUsedCount('CL');
    const elUsed = calculateUsedCount('EL');

    // If legacy data or unspecified, maybe just count towards CL? For now strict.

    const clBalance = clLimit - clUsed;
    const elBalance = elLimit - elUsed;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* CL Card */}
                <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Casual Leave (CL)</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{clBalance} <span className="text-sm font-normal text-slate-400">left</span></h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-400 font-medium mb-1">Quota</div>
                                {isEditingCL ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            className="w-12 px-1 py-0.5 text-center border rounded border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            autoFocus
                                            value={quotaInputCL}
                                            onChange={(e) => setQuotaInputCL(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCL()}
                                        />
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={handleSaveCL}><CheckCircle2 className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 group cursor-pointer" onClick={() => { setQuotaInputCL(clLimit.toString()); setIsEditingCL(true); }}>
                                        <span className="text-lg font-semibold text-slate-700">{clLimit}</span>
                                        <Edit2 className="h-3 w-3 text-slate-300 group-hover:text-blue-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <Progress value={(clUsed / clLimit) * 100} className="h-1.5 bg-blue-100" indicatorClassName="bg-blue-500" />
                        <div className="mt-2 text-xs text-slate-400 text-right">{clUsed} Used</div>
                    </div>
                </Card>

                {/* EL Card */}
                <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Emergency Leave (EL)</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{elBalance} <span className="text-sm font-normal text-slate-400">left</span></h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-400 font-medium mb-1">Quota</div>
                                {isEditingEL ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            className="w-12 px-1 py-0.5 text-center border rounded border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                            autoFocus
                                            value={quotaInputEL}
                                            onChange={(e) => setQuotaInputEL(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEL()}
                                        />
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={handleSaveEL}><CheckCircle2 className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 group cursor-pointer" onClick={() => { setQuotaInputEL(elLimit.toString()); setIsEditingEL(true); }}>
                                        <span className="text-lg font-semibold text-slate-700">{elLimit}</span>
                                        <Edit2 className="h-3 w-3 text-slate-300 group-hover:text-purple-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <Progress value={(elUsed / elLimit) * 100} className="h-1.5 bg-purple-100" indicatorClassName="bg-purple-500" />
                        <div className="mt-2 text-xs text-slate-400 text-right">{elUsed} Used</div>
                    </div>
                </Card>
            </div>

            {leaves && leaves.length > 0 ? (
                <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Date Range</TableHead>
                                <TableHead className="font-semibold text-slate-700">Duration</TableHead>
                                <TableHead className="font-semibold text-slate-700">Type</TableHead>
                                <TableHead className="font-semibold text-slate-700">Reason</TableHead>
                                <TableHead className="font-semibold text-slate-700">Applied On</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaves.map((leave) => (
                                <TableRow key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d, yyyy")}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600 hover:bg-slate-200">
                                            {differenceInCalendarDays(new Date(leave.endDate), new Date(leave.startDate)) + 1} Days
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={((leave as any).leaveType === 'EL' || (leave as any).leave_type === 'EL') ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                            {(leave as any).leaveType || (leave as any).leave_type || 'CL'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={leave.reason}>
                                        {leave.reason}
                                        {leave.rejectionReason && (
                                            <div className="text-xs text-red-500 mt-1 font-medium bg-red-50 p-1 rounded inline-block">Note: {leave.rejectionReason}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{format(new Date(leave.appliedAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell>{statusBadge(leave.status)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {leave.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 h-8"
                                                    onClick={() => handleApprove(leave.id)}
                                                    disabled={updateStatusMutation.isPending}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                                    onClick={() => handleRejectClick(leave.id)}
                                                    disabled={updateStatusMutation.isPending}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900">No leave requests</h3>
                    <p className="text-muted-foreground max-w-sm mt-1">
                        This staff member hasn't applied for any leaves yet.
                    </p>
                </div>
            )}

            <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, id: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Leave Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason for Rejection</Label>
                            <Textarea
                                placeholder="Please explain why this leave request is being rejected..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmReject} disabled={!rejectionReason || updateStatusMutation.isPending}>
                            {updateStatusMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default StaffLeavesTab;
