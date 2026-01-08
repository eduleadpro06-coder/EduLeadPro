
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Statement {
    id: number;
    filename: string;
    originalFilename: string;
    status: string;
    uploadedAt: string;
    totalTransactions: number;
}

export default function StatementUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Statements
    const { data: statements, isLoading } = useQuery<Statement[]>({
        queryKey: ['/api/accounting/statements'],
    });

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            // Use fetch directly for FormData or ensure apiRequest handles it.
            // apiRequest uses JSON by default usually unless Body is FormData.
            // Let's use generic fetch wrapper or axios if available, or just fetch.
            // Assuming apiRequest can't handle multipart easily unless modified.
            // I'll use native fetch with credentials.

            const res = await fetch('/api/accounting/upload', {
                method: 'POST',
                body: formData
            }); // Note: Don't set Content-Type header manually for FormData

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Upload failed');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/accounting/statements'] });
            toast({ title: "Upload Successful", description: "Bank statement uploaded." });
            setFile(null);
        },
        onError: (error: Error) => {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        }
    });

    // Process Mutation
    const processMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest("POST", `/api/accounting/process/${id}`);
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['/api/accounting/statements'] });
            toast({ title: "Processing Started", description: `Parsed ${data.count} transactions.` });
            onUploadSuccess(); // Switch to Review tab
        },
        onError: (error: Error) => {
            toast({ title: "Processing Failed", description: error.message, variant: "destructive" });
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (file) uploadMutation.mutate(file);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Bank Statement</CardTitle>
                    <CardDescription>Supported formats: CSV, Excel (.xls, .xlsx), PDF</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept=".csv,.xls,.xlsx,.pdf"
                            onChange={handleFileChange}
                        />
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploadMutation.isPending}
                        >
                            {uploadMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            Upload
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filename</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statements?.map((stmt) => (
                                    <TableRow key={stmt.id}>
                                        <TableCell className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            {stmt.originalFilename}
                                        </TableCell>
                                        <TableCell>{new Date(stmt.uploadedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold
                                                ${stmt.status === 'processed' ? 'bg-green-100 text-green-700' :
                                                    stmt.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {stmt.status.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {stmt.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => processMutation.mutate(stmt.id)}
                                                    disabled={processMutation.isPending}
                                                >
                                                    {processMutation.isPending ? 'Processing...' : 'Process'}
                                                </Button>
                                            )}
                                            {stmt.status === 'processed' && (
                                                <Button size="sm" variant="ghost" disabled>
                                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                    Done
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!statements || statements.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground p-4">
                                            No statements uploaded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
