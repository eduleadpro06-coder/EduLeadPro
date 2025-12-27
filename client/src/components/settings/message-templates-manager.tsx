import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Check, X, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SendMessageDialog } from "@/components/communication/send-message-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageTemplate {
    id: number;
    name: string;
    displayName: string;
    content: string;
    category: "whatsapp" | "email" | "sms";
    isActive: boolean;
    isDefault: boolean;
    variables: string[];
}

export default function MessageTemplatesManager() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);
    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [selectedTemplateForSend, setSelectedTemplateForSend] = useState<MessageTemplate | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
        queryKey: ["/api/message-templates"],
    });

    const [formData, setFormData] = useState({
        displayName: "",
        content: "",
        category: "whatsapp",
        isActive: true,
    });

    const resetForm = () => {
        setFormData({
            displayName: "",
            content: "",
            category: "whatsapp",
            isActive: true,
        });
        setEditingTemplate(null);
    };

    const handleOpenModal = (template?: MessageTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                displayName: template.displayName,
                content: template.content,
                category: template.category,
                isActive: template.isActive,
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/message-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    name: data.displayName.toLowerCase().replace(/\s+/g, "_"),
                    variables: [], // Extracted server-side or handling manually if needed
                    isDefault: false,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
            toast({ title: "Success", description: "Template created successfully" });
            setIsModalOpen(false);
            resetForm();
        },
        onError: (err: Error) => {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/message-templates/${editingTemplate?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    name: data.displayName.toLowerCase().replace(/\s+/g, "_"),
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
            toast({ title: "Success", description: "Template updated successfully" });
            setIsModalOpen(false);
            resetForm();
        },
        onError: (err: Error) => {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/message-templates/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(await res.text());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
            toast({ title: "Success", description: "Template deleted successfully" });
            setDeleteConfirmOpen(false);
            setTemplateToDelete(null);
        },
        onError: (err: Error) => {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDeleteClick = (template: MessageTemplate) => {
        setTemplateToDelete(template);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (templateToDelete) {
            deleteMutation.mutate(templateToDelete.id);
        }
    };

    const handleSendClick = (template: MessageTemplate) => {
        setSelectedTemplateForSend(template);
        setSendDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Message Templates</CardTitle>
                        <CardDescription>
                            Manage templates for WhatsApp, Email, and SMS communications
                        </CardDescription>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Add Template
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Content Preview</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Loading templates...
                                        </TableCell>
                                    </TableRow>
                                ) : templates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No templates found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    templates.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell className="font-medium">{template.displayName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {template.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={template.content}>
                                                {template.content}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {template.isActive ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Inactive</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenModal(template)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Send Message using this template"
                                                        onClick={() => handleSendClick(template)}
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                    {!template.isDefault && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(template)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? "Edit Template" : "Create New Template"}
                        </DialogTitle>
                        <DialogDescription>
                            Configure the message template details below. Use {"{{variable}}"} for dynamic content.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, displayName: e.target.value })
                                    }
                                    placeholder="e.g., Welcome Message"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, category: value as any })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Message Content</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) =>
                                        setFormData({ ...formData, content: e.target.value })
                                    }
                                    placeholder="Hello {{name}}, welcome to {{instituteName}}!"
                                    className="h-32"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Available variables: <code className="bg-muted px-1 rounded">{"{{name}}"}</code>, <code className="bg-muted px-1 rounded">{"{{instituteName}}"}</code>
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, isActive: checked })
                                    }
                                />
                                <Label htmlFor="isActive">Active Status</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Template"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            template "{templateToDelete?.displayName}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SendMessageDialog
                open={sendDialogOpen}
                onOpenChange={setSendDialogOpen}
                initialData={selectedTemplateForSend ? {
                    message: selectedTemplateForSend.content,
                    type: selectedTemplateForSend.category
                } : undefined}
            />
        </div>
    );
}
