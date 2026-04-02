
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DailyUpdate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Calendar, User, Image as ImageIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function ActivityApproval() {
    const { toast } = useToast();
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);

    // Fetch pending updates with student details
    const { data: updates, isLoading } = useQuery<any[]>({
        queryKey: ['/api/admin/daily-updates', 'pending'],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/daily-updates?status=pending");
            return res.json();
        }
    });

    // Valid updates are those with status 'pending'
    const pendingUpdates = updates || []; // Filter is handled by API now effectively, but we can double check if needed

    // Mutation for approval/rejection
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: number, status: 'approved' | 'rejected', reason?: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/daily-updates/${id}/status`, {
                status,
                rejectionReason: reason
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/daily-updates'] });
            toast({
                title: "Status Updated",
                description: "The activity update status has been changed successfully.",
            });
            setRejectionReason("");
            setSelectedUpdateId(null);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to update status. Please try again.",
                variant: "destructive"
            });
        }
    });

    const handleApprove = (id: number) => {
        updateStatusMutation.mutate({ id, status: 'approved' });
    };

    const handleReject = () => {
        if (selectedUpdateId) {
            updateStatusMutation.mutate({ id: selectedUpdateId, status: 'rejected', reason: rejectionReason });
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-muted-foreground">Loading pending post approvals...</div>;
    }

    if (pendingUpdates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-lg border border-dashed">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium">All Caught Up!</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                    There are no pending activity updates from teachers that require approval.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-1.5 rounded-full">
                        <MessageSquare className="h-4 w-4 text-yellow-700" />
                    </div>
                    <div>
                        <h3 className="font-medium text-yellow-900 text-sm">Pending Approvals</h3>
                        <p className="text-xs text-yellow-700">Reviewing {pendingUpdates.length} teacher posts</p>
                    </div>
                </div>
            </div>

    // Grouping updates by teacher, content, and date
    const groupedUpdates = pendingUpdates.reduce((acc: any[], update: any) => {
        const key = `${update.teacher_name}-${update.content}-${(update.media_urls || []).join(',')}-${update.posted_at ? format(new Date(update.posted_at), 'yyyy-MM-dd HH:mm') : 'now'}`;
        
        const existingGroup = acc.find(g => g.key === key);
        if (existingGroup) {
            existingGroup.studentNames.push(update.leads?.name || `Student #${update.leadId}`);
            existingGroup.ids.push(update.id);
        } else {
            acc.push({
                ...update,
                key,
                studentNames: [update.leads?.name || `Student #${update.leadId}`],
                ids: [update.id]
            });
        }
        return acc;
    }, []);

    const handleApproveAll = async (ids: number[]) => {
        for (const id of ids) {
            await updateStatusMutation.mutateAsync({ id, status: 'approved' });
        }
    };

    const handleRejectAll = async (ids: number[], reason: string) => {
        for (const id of ids) {
            await updateStatusMutation.mutateAsync({ id, status: 'rejected', reason });
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-1.5 rounded-full">
                        <MessageSquare className="h-4 w-4 text-yellow-700" />
                    </div>
                    <div>
                        <h3 className="font-medium text-yellow-900 text-sm">Pending Approvals</h3>
                        <p className="text-xs text-yellow-700">Reviewing {pendingUpdates.length} teacher posts ({groupedUpdates.length} groups)</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {groupedUpdates.map((group) => (
                    <Card key={group.key} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="bg-muted/5 border-b py-3 px-4">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm flex flex-wrap items-center gap-2">
                                            {group.teacher_name || 'Teacher'}
                                            <span className="text-muted-foreground font-normal text-xs">posted for</span>
                                            {group.studentNames.map((name: string, i: number) => (
                                                <span key={i} className="font-semibold text-primary">
                                                    {name}{i < group.studentNames.length - 1 ? ',' : ''}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {group.posted_at ? format(new Date(group.posted_at), 'PPp') : 'Recently'}
                                            <span className="mx-2">•</span>
                                            <span className="capitalize">{group.leads?.class || 'Pre-School'}</span>
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="capitalize px-2 py-0.5 text-xs bg-background">
                                    {(() => {
                                        const type = (group.activity_type || '').toLowerCase();
                                        if (type === 'food') return '🍱 Meal Update';
                                        if (type === 'sleep') return '😴 Sleep Update';
                                        if (type === 'bathroom') return '🚽 Bathroom';
                                        if (type === 'photo') return '📸 Photo';
                                        if (type === 'achievement') return '🏆 Achievement';
                                        if (type === 'homework') return '📚 Homework';
                                        if (type === 'notice') return '📢 Notice';
                                        if (type === 'behaviour') return '🌟 Behaviour';
                                        if (type === 'general') return '📝 General Update';
                                        return '📝 Activity';
                                    })()}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4 px-4 pb-2">
                            {group.title && (
                                <h4 className="font-semibold text-base mb-1">{group.title}</h4>
                            )}
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {group.content}
                            </p>

                            {group.media_urls && group.media_urls.length > 0 && (
                                <div className="mt-4">
                                    <div className={`grid gap-2 ${group.media_urls.length === 1 ? 'grid-cols-1' :
                                        group.media_urls.length === 2 ? 'grid-cols-2' :
                                            'grid-cols-3 md:grid-cols-4'
                                        }`}>
                                        {group.media_urls.map((url: string, idx: number) => (
                                            <div key={idx} className={`relative rounded-lg overflow-hidden bg-muted border ${group.media_urls.length === 1 ? 'aspect-video max-h-[300px]' : 'aspect-square'}`}>
                                                <img
                                                    src={url}
                                                    alt={`Attachment ${idx + 1}`}
                                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                                    onClick={() => window.open(url, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="py-3 px-4 border-t bg-muted/5 flex gap-3">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium h-9 text-sm"
                                onClick={() => handleApproveAll(group.ids)}
                                disabled={updateStatusMutation.isPending}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Approve All {group.ids.length > 1 ? `(${group.ids.length})` : ''}
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 h-9 text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                                        onClick={() => setSelectedUpdateId(group.id)}
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject All
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Activity Update</DialogTitle>
                                        <DialogDescription>
                                            Please provide a reason for rejecting this update for all selected students.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reason">Rejection Reason</Label>
                                            <Textarea
                                                id="reason"
                                                placeholder="Rejection reason..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setRejectionReason("");
                                                setSelectedUpdateId(null);
                                            }}>Cancel</Button>
                                        </DialogClose>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRejectAll(group.ids, rejectionReason)}
                                            disabled={!rejectionReason.trim() || updateStatusMutation.isPending}
                                        >
                                            Confirm Rejection
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
        </div>
    );
}
