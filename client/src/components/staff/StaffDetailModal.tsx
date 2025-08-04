import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Phone, Building, Briefcase, Calendar, IndianRupee, ShieldCheck, Trash2, Edit, Save
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Staff {
  id: number;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  salary: number;
  dateOfJoining: string;
  phone?: string;
  email?: string;
  address?: string;
  qualifications?: string;
  isActive?: boolean;
}

interface StaffDetailModalProps {
  staff: Staff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStaffUpdated?: () => void;
  fetchPayrollOverview?: () => void;
}

export default function StaffDetailModal({ staff, open, onOpenChange, onStaffUpdated, fetchPayrollOverview }: StaffDetailModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedStaff, setEditedStaff] = useState<Partial<Staff>>({});

  useEffect(() => {
    if (staff) {
      setEditedStaff({ ...staff, salary: staff.salary });
    } else {
      setEditedStaff({});
    }
    setIsEditing(false); // Reset editing state when modal opens or staff changes
  }, [staff, open]);

  const handleInputChange = (field: keyof Staff, value: string | number) => {
    setEditedStaff(prev => ({ ...prev, [field]: value }));
  };

  const updateStaffMutation = useMutation({
    mutationFn: async (updates: Partial<Staff>) => {
      if (!staff) throw new Error("No staff member selected");
      const response = await apiRequest("PUT", `/api/staff/${staff.id}`, updates);
      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      invalidateNotifications(queryClient);
      // Refetch the latest staff data and update the modal
      if (staff) {
        const response = await apiRequest("GET", `/api/staff/${staff.id}`);
        const updatedStaff = await response.json();
        setEditedStaff({ ...updatedStaff, salary: updatedStaff.salary });
      }
      setIsEditing(false);
      toast({ title: "Success", description: "Staff details updated successfully." });
      if(onStaffUpdated) onStaffUpdated();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update staff.", variant: "destructive" });
    }
  });

  const handleSave = () => {
    let payload = { ...editedStaff, salary: Number(editedStaff.salary) };
    // Ensure dateOfJoining is always a string in 'YYYY-MM-DD' format
    if (payload.dateOfJoining && typeof payload.dateOfJoining !== 'string') {
      payload.dateOfJoining = (payload.dateOfJoining as Date).toISOString().split('T')[0];
    } else if (payload.dateOfJoining && typeof payload.dateOfJoining === 'string') {
      // If it's a string but not in 'YYYY-MM-DD', try to parse and reformat
      const d = new Date(payload.dateOfJoining);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.dateOfJoining) && !isNaN(d.getTime())) {
        payload.dateOfJoining = d.toISOString().split('T')[0];
      }
    }
    updateStaffMutation.mutate(payload);
  };
  
  const deleteStaffMutation = useMutation({
    mutationFn: async () => {
      if (!staff) throw new Error("No staff member selected");
      const response = await apiRequest("DELETE", `/api/staff/${staff.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      invalidateNotifications(queryClient);
      if (fetchPayrollOverview) fetchPayrollOverview();
      toast({ title: "Success", description: "Staff member deleted." });
      onOpenChange(false);
      if(onStaffUpdated) onStaffUpdated();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete staff member.", variant: "destructive" });
    }
  });

  // Add a helper for status dot color
  const getStatusDotColor = (isActive: boolean) => isActive ? "bg-green-500" : "bg-gray-400";

  if (!staff) return null;

  const getStatusPill = (isActive: boolean) => (
    isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        <ShieldCheck className="mr-1 h-3 w-3" /> Active
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
        <Trash2 className="mr-1 h-3 w-3" /> Inactive
      </Badge>
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto border-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Status dot */}
              <span className={`w-3 h-3 rounded-full border-2 border-white ${getStatusDotColor((isEditing ? editedStaff.isActive : staff.isActive) !== false)}`}></span>
              <User size={24} />
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {staff.name}
                  {/* Show Active/Inactive toggle in edit mode */}
                  {isEditing && (
                    <span className="flex items-center gap-2 ml-4">
                      <Label htmlFor="active-toggle">{editedStaff.isActive !== false ? "Active" : "Inactive"}</Label>
                      <Switch
                        id="active-toggle"
                        checked={editedStaff.isActive !== false}
                        onCheckedChange={(checked) => setEditedStaff(prev => ({ ...prev, isActive: checked }))}
                      />
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-600">{staff.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                {getStatusPill((isEditing ? editedStaff.isActive : staff.isActive) !== false)}
            </div>
          </DialogTitle>
          <DialogDescription>
              Comprehensive information about {staff.name}
          </DialogDescription>
        </DialogHeader>
        
            <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="py-6 h-[500px] overflow-y-auto">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">Employee Information</h3>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                                <Edit className="mr-2 h-4 w-4" /> {isEditing ? "Cancel" : "Edit"}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 size={16} className="mr-2" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove the employee from the UI and move it to Recently Deleted in the database.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteStaffMutation.mutate()}>
                                        Confirm
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    {isEditing ? (
                                        <Input value={editedStaff.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
                                    ) : (
                                        <div className="flex items-center gap-2"><User size={16} className="text-gray-500" /><span>{staff.name}</span></div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    {isEditing ? (
                                        <Input value={editedStaff.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
                                    ) : (
                                        <div className="flex items-center gap-2"><Phone size={16} className="text-gray-500" /><span>{staff.phone || 'N/A'}</span></div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    {isEditing ? (
                                        <Input value={editedStaff.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
                                    ) : (
                                        <div className="flex items-center gap-2"><Mail size={16} className="text-gray-500" /><span>{staff.email || 'N/A'}</span></div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                                    <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-500" /><span>{staff.dateOfJoining ? format(new Date(staff.dateOfJoining), "MMM dd, yyyy") : "N/A"}</span></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                                    {isEditing ? (
                                        <Input type="number" value={editedStaff.salary || ''} onChange={(e) => handleInputChange('salary', e.target.value)} />
                                    ) : (
                                        <div className="flex items-center gap-2"><IndianRupee size={16} className="text-gray-500" /><span>₹ {Number(staff.salary).toLocaleString()}</span></div>
                                    )}
                                </div>
                            </div>
                                          
                            <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                                  <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-gray-500" /><span>{staff.employeeId}</span></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                    {isEditing ? (
                                        <Select value={editedStaff.department} onValueChange={(val) => handleInputChange('department', val)}>
                                            <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HR">HR</SelectItem>
                                                <SelectItem value="IT">IT</SelectItem>
                                                <SelectItem value="Finance">Finance</SelectItem>
                                                <SelectItem value="Operations">Operations</SelectItem>
                                                <SelectItem value="Marketing">Marketing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex items-center gap-2"><Building size={16} className="text-gray-500" /><span>{staff.department}</span></div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                    {isEditing ? (
                                        <Input value={editedStaff.role || ''} onChange={(e) => handleInputChange('role', e.target.value)} />
                                    ) : (
                                        <div className="flex items-center gap-2"><Briefcase size={16} className="text-gray-500" /><span>{staff.role}</span></div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    {isEditing ? (
                                        <Textarea 
                                            value={editedStaff.address || ''} 
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            placeholder="Enter employee address"
                                            rows={3}
                                        />
                                    ) : (
                                        <div className="flex items-start gap-2">
                                            <Building size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                                            <span className="text-sm">{staff.address || 'N/A'}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                                    {isEditing ? (
                                        <Textarea 
                                            value={editedStaff.qualifications || ''} 
                                            onChange={(e) => handleInputChange('qualifications', e.target.value)}
                                            placeholder="Enter employee qualifications (e.g., B.Tech, MBA, etc.)"
                                            rows={3}
                                        />
                                    ) : (
                                        <div className="flex items-start gap-2">
                                            <ShieldCheck size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                                            <span className="text-sm">{staff.qualifications || 'N/A'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                         {isEditing && (
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={updateStaffMutation.isPending}>
                                    <Save size={16} className="mr-2" />
                                    {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="performance" className="py-6 h-[500px] overflow-y-auto">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">Performance Metrics</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Attendance Rate</h4>
                                    <p className="text-2xl font-bold text-green-600">95%</p>
                                    <p className="text-sm text-gray-600">Last 30 days</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Score</h4>
                                    <p className="text-2xl font-bold text-blue-600">8.5/10</p>
                                    <p className="text-sm text-gray-600">Based on KPIs</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Projects Completed</h4>
                                    <p className="text-2xl font-bold text-purple-600">12</p>
                                    <p className="text-sm text-gray-600">This quarter</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Client Satisfaction</h4>
                                    <p className="text-2xl font-bold text-orange-600">4.8/5</p>
                                    <p className="text-sm text-gray-600">Average rating</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Recent Performance Notes</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>• Excellent communication skills demonstrated in client meetings</p>
                                <p>• Successfully completed project ahead of schedule</p>
                                <p>• Shows strong leadership potential in team collaborations</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="activity" className="py-6 h-[500px] overflow-y-auto">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">Recent Activity</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 border rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Updated employee information</p>
                                    <p className="text-sm text-gray-600">Modified contact details and address</p>
                                    <p className="text-xs text-gray-500">2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 border rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Completed training module</p>
                                    <p className="text-sm text-gray-600">Finished "Advanced Communication Skills" course</p>
                                    <p className="text-xs text-gray-500">1 day ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 border rounded-lg">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Project milestone achieved</p>
                                    <p className="text-sm text-gray-600">Successfully completed Phase 1 of client project</p>
                                    <p className="text-xs text-gray-500">3 days ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 border rounded-lg">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Team meeting attended</p>
                                    <p className="text-sm text-gray-600">Participated in weekly department review</p>
                                    <p className="text-xs text-gray-500">1 week ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
      </DialogContent>
    </Dialog>
  );
} 