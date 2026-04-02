import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, User, Users, Clock, Calendar, CheckCircle2, XCircle, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function GateLogsHistory() {
    // Helper to get IST date string (YYYY-MM-DD)
    const getISTDateString = () => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState(getISTDateString());
    const [endDate, setEndDate] = useState(getISTDateString());
    const [activeTab, setActiveTab] = useState("students");

    // Fetch Student Logs
    const { data: studentLogs = [], isLoading: isLoadingStudents } = useQuery<any[]>({
        queryKey: ['/api/v1/gate/history/students', startDate, endDate, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({ startDate, endDate, search: searchTerm });
            const res = await apiRequest("GET", `/api/v1/gate/history/students?${params.toString()}`);
            const json = await res.json();
            return json.data || [];
        },
        enabled: activeTab === "students"
    });

    // Fetch Visitor Logs
    const { data: visitorLogs = [], isLoading: isLoadingVisitors } = useQuery<any[]>({
        queryKey: ['/api/v1/gate/history/visitors', startDate, endDate, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({ startDate, endDate, search: searchTerm });
            const res = await apiRequest("GET", `/api/v1/gate/history/visitors?${params.toString()}`);
            const json = await res.json();
            return json.data || [];
        },
        enabled: activeTab === "visitors"
    });

    const exportToCSV = () => {
        const data = activeTab === "students" ? studentLogs : visitorLogs;
        if (data.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        if (activeTab === "students") {
            csvContent += "Date,Student Name,Class,Check-In,Check-Out,Status,Recorded By\n";
            data.forEach(log => {
                const checkIn = log.check_in_time ? format(new Date(log.check_in_time), 'hh:mm a') : '-';
                const checkOut = log.check_out_time ? format(new Date(log.check_out_time), 'hh:mm a') : '-';
                csvContent += `${log.date},${log.student?.name},${log.student?.class},${checkIn},${checkOut},${log.status},${log.recorder?.name || 'N/A'}\n`;
            });
        } else {
            csvContent += "Time,Visitor Name,Phone,Purpose,Check-Out,Status,Recorded By\n";
            data.forEach(log => {
                const checkIn = format(new Date(log.check_in_time), 'dd/MM/yyyy hh:mm a');
                const checkOut = log.check_out_time ? format(new Date(log.check_out_time), 'hh:mm a') : '-';
                csvContent += `${checkIn},${log.visitorName},${log.visitorPhone},${log.visitorPurpose},${checkOut},${log.status},${log.recorder?.name || 'N/A'}\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `gate_logs_${activeTab}_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Gate Entry History</CardTitle>
                        <CardDescription>View and audit all student and visitor logs</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                            <Calendar className="h-4 w-4 ml-2 text-gray-400" />
                            <Input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-none focus-visible:ring-0 w-36 h-8 text-sm"
                            />
                            <span className="text-gray-300">to</span>
                            <Input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-none focus-visible:ring-0 w-36 h-8 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="Search name or phone..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-64 h-10 bg-white"
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={exportToCSV}
                            disabled={activeTab === "students" ? studentLogs.length === 0 : visitorLogs.length === 0}
                            className="bg-white hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-gray-100/50 p-1">
                        <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4 mr-2" />
                            Student Entries
                        </TabsTrigger>
                        <TabsTrigger value="visitors" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <User className="h-4 w-4 mr-2" />
                            Visitor Logs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="students">
                        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-32">Date</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead className="text-center">Check-In</TableHead>
                                        <TableHead className="text-center">Check-Out</TableHead>
                                        <TableHead>Picked Up By</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Recorded By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStudents ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">Loading history...</TableCell></TableRow>
                                    ) : studentLogs.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-400">No student logs found for this period</TableCell></TableRow>
                                    ) : (
                                        studentLogs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="font-medium text-gray-600">
                                                    {format(new Date(log.date), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{log.student?.name}</span>
                                                        <span className="text-xs text-gray-500">{log.student?.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {log.student?.class} {log.student?.section || ''}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {log.check_in_time ? (
                                                        <div className="flex flex-col items-center">
                                                            <Clock className="h-3 w-3 text-green-500 mb-1" />
                                                            <span className="text-sm font-semibold">{format(new Date(log.check_in_time), 'hh:mm a')}</span>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {log.check_out_time ? (
                                                        <div className="flex flex-col items-center">
                                                            <Clock className="h-3 w-3 text-orange-500 mb-1" />
                                                            <span className="text-sm font-semibold">{format(new Date(log.check_out_time), 'hh:mm a')}</span>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>

                                                {/* Picked Up By */}
                                                <TableCell>
                                                    {log.pickup_person_type ? (
                                                        <div className="flex items-center gap-2">
                                                            <div>
                                                                <Badge variant="outline" className={
                                                                    log.pickup_person_type === 'parent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    log.pickup_person_type === 'authorized' || log.pickup_person_type === 'verified' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                                }>
                                                                    {log.pickup_person_type === 'parent' ? 'Parent' :
                                                                     log.pickup_person_type === 'authorized' || log.pickup_person_type === 'verified' ? 'Authorized' :
                                                                     'Other'}
                                                                </Badge>
                                                                {log.pickup_person_name && (
                                                                    <p className="text-xs text-gray-500 mt-1">{log.pickup_person_name}</p>
                                                                )}
                                                            </div>
                                                            {log.pickup_photo_url && (
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <button className="relative w-9 h-9 rounded-md overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors cursor-pointer flex-shrink-0">
                                                                            <img src={log.pickup_photo_url} alt="Pickup" className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                                <Camera className="h-3 w-3 text-white" />
                                                                            </div>
                                                                        </button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-md">
                                                                        <DialogTitle>Pickup Photo — {log.student?.name}</DialogTitle>
                                                                        <img src={log.pickup_photo_url} alt="Pickup person" className="w-full rounded-lg" />
                                                                        <p className="text-sm text-gray-500 mt-2">
                                                                            Picked up by: <span className="font-medium text-gray-700">{log.pickup_person_name || log.pickup_person_type || 'Unknown'}</span>
                                                                            {' • '}{log.check_out_time ? format(new Date(log.check_out_time), 'dd MMM yyyy, hh:mm a') : ''}
                                                                        </p>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 text-sm">—</span>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {log.status === 'present' ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" /> In
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                                                            <XCircle className="h-3 w-3 mr-1" /> Out
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm italic">
                                                    {log.recorder?.name || 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="visitors">
                        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead>Check-In</TableHead>
                                        <TableHead>Visitor Details</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead className="text-center">Check-Out</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Recorded By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingVisitors ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-500">Loading history...</TableCell></TableRow>
                                    ) : visitorLogs.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400">No visitor logs found for this period</TableCell></TableRow>
                                    ) : (
                                        visitorLogs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-600">{format(new Date(log.check_in_time), 'dd MMM yyyy')}</span>
                                                        <span className="text-xs font-bold text-gray-900">{format(new Date(log.check_in_time), 'hh:mm a')}</span>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{log.visitorName}</span>
                                                        <span className="text-xs text-gray-500">{log.visitorPhone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={log.visitorPurpose}>
                                                    {log.visitorPurpose}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {log.check_out_time ? (
                                                        <div className="flex flex-col items-center">
                                                            <Clock className="h-3 w-3 text-orange-500 mb-1" />
                                                            <span className="text-sm font-semibold">{format(new Date(log.check_out_time), 'hh:mm a')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Still inside</span>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {log.status === 'inside' ? (
                                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 animate-pulse">
                                                            <Users className="h-3 w-3 mr-1" /> Inside
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Exited
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm italic">
                                                    {log.recorder?.name || 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
