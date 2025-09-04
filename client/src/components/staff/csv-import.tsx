import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Users
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CSVImportProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

interface ParsedStaff {
  employeeId: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  department?: string;
  dateOfJoining: string;
  salary: number;
  isActive: boolean;
  address?: string;
  emergencyContact?: string;
  qualifications?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
  duplicateInfo?: {
    existingStaffId: number;
    existingStaffName: string;
    matchType: 'phone' | 'email' | 'employeeId';
  };
}

interface DuplicateStaff {
  row: number;
  name: string;
  phone: string;
  employeeId: string;
  existingStaffId: number;
}

export default function StaffCSVImport({ onSuccess, onClose }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStaff[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const [validationResults, setValidationResults] = useState<{
    valid: number;
    invalid: number;
    total: number;
    duplicates: number;
  }>({ valid: 0, invalid: 0, total: 0, duplicates: 0 });
  const [duplicateStaff, setDuplicateStaff] = useState<DuplicateStaff[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (validStaff: ParsedStaff[]) => {
      const response = await apiRequest("POST", "/staff/import-csv", { 
        csvData: validStaff.map(staff => ({
          employeeId: staff.employeeId,
          name: staff.name,
          email: staff.email || "",
          phone: staff.phone,
          role: staff.role,
          department: staff.department || "",
          dateOfJoining: staff.dateOfJoining,
          salary: staff.salary,
          isActive: staff.isActive,
          address: staff.address || "",
          emergencyContact: staff.emergencyContact || "",
          qualifications: staff.qualifications || "",
          bankAccountNumber: staff.bankAccountNumber || "",
          ifscCode: staff.ifscCode || "",
          panNumber: staff.panNumber || ""
        }))
      });
      return response.json();
    },
    onSuccess: (data) => {
      let description = `Successfully imported ${data.staff?.length || 0} staff members`;
      
      if (data.duplicates && data.duplicates > 0) {
        description += `, ${data.duplicates} duplicates skipped`;
      }
      
      if (data.errors && data.errors > 0) {
        description += `, ${data.errors} errors`;
      }
      
      toast({
        title: "Import Completed!",
        description: description,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      
      setFile(null);
      setParsedData([]);
      setActiveTab("upload");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const checkForDuplicates = async (staff: ParsedStaff[]): Promise<{
    duplicates: DuplicateStaff[];
    updatedStaff: ParsedStaff[];
  }> => {
    setIsCheckingDuplicates(true);
    
    try {
      const duplicates: DuplicateStaff[] = [];
      const updatedStaff: ParsedStaff[] = [];
      
      for (let i = 0; i < staff.length; i++) {
        const currentStaff = staff[i];
        
        // Check for duplicates via API
        const response = await apiRequest("POST", "/staff/check-duplicate", {
          phone: currentStaff.phone,
          email: currentStaff.email,
          employeeId: currentStaff.employeeId
        });
        
        const duplicateResult = await response.json();
        
        if (duplicateResult.isDuplicate) {
          duplicates.push({
            row: i + 1,
            name: currentStaff.name,
            phone: currentStaff.phone,
            employeeId: currentStaff.employeeId,
            existingStaffId: duplicateResult.existingStaff.id
          });
          
          updatedStaff.push({
            ...currentStaff,
            isDuplicate: true,
            duplicateInfo: {
              existingStaffId: duplicateResult.existingStaff.id,
              existingStaffName: duplicateResult.existingStaff.name,
              matchType: duplicateResult.matchType
            }
          });
        } else {
          updatedStaff.push(currentStaff);
        }
      }
      
      return { duplicates, updatedStaff };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return { duplicates: [], updatedStaff: staff };
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const processCSV = async () => {
    if (!file) return;

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row");
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const dataLines = lines.slice(1);

      setImportProgress(25);

      const parsed: ParsedStaff[] = [];
      
      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row: any = {};
        
        // Map CSV headers to our schema
        headers.forEach((header, index) => {
          const value = values[index] || "";
          
          // Map common header variations to our schema
          switch (header) {
            case 'employee_id':
            case 'employeeid':
            case 'emp_id':
              row.employeeId = value;
              break;
            case 'name':
            case 'employee_name':
            case 'staff_name':
              row.name = value;
              break;
            case 'email':
            case 'email_address':
              row.email = value;
              break;
            case 'phone':
            case 'phone_number':
            case 'mobile':
              row.phone = value;
              break;
            case 'role':
            case 'designation':
            case 'position':
              row.role = value;
              break;
            case 'department':
            case 'dept':
              row.department = value;
              break;
            case 'date_of_joining':
            case 'dateofjoining':
            case 'joining_date':
            case 'doj':
              row.dateOfJoining = value;
              break;
            case 'salary':
            case 'basic_salary':
              row.salary = parseFloat(value) || 0;
              break;
            case 'is_active':
            case 'active':
            case 'status':
              row.isActive = value.toLowerCase() === 'true' || value.toLowerCase() === 'active' || value === '1';
              break;
            case 'address':
              row.address = value;
              break;
            case 'emergency_contact':
            case 'emergency_phone':
              row.emergencyContact = value;
              break;
            case 'qualifications':
            case 'education':
              row.qualifications = value;
              break;
            case 'bank_account_number':
            case 'account_number':
              row.bankAccountNumber = value;
              break;
            case 'ifsc_code':
            case 'ifsc':
              row.ifscCode = value;
              break;
            case 'pan_number':
            case 'pan':
              row.panNumber = value;
              break;
          }
        });

        // Validate required fields
        const errors: string[] = [];
        
        if (!row.employeeId) errors.push("Employee ID is required");
        if (!row.name) errors.push("Name is required");
        if (!row.phone) errors.push("Phone is required");
        if (!row.role) errors.push("Role is required");
        if (!row.dateOfJoining) errors.push("Date of Joining is required");
        if (!row.salary || row.salary <= 0) errors.push("Valid salary is required");

        // Validate phone format (basic validation)
        if (row.phone && !/^\d{10}$/.test(row.phone.replace(/\D/g, ''))) {
          errors.push("Phone must be a valid 10-digit number");
        }

        // Validate email format if provided
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push("Invalid email format");
        }

        // Validate date format
        if (row.dateOfJoining && isNaN(new Date(row.dateOfJoining).getTime())) {
          errors.push("Invalid date format for Date of Joining");
        }

        parsed.push({
          ...row,
          isActive: row.isActive ?? true, // Default to active if not specified
          isValid: errors.length === 0,
          errors,
          isDuplicate: false
        });
      }

      setImportProgress(50);

      // Check for duplicates
      const { duplicates, updatedStaff } = await checkForDuplicates(parsed);
      
      setDuplicateStaff(duplicates);
      setParsedData(updatedStaff);

      const validCount = updatedStaff.filter(s => s.isValid && !s.isDuplicate).length;
      const invalidCount = updatedStaff.filter(s => !s.isValid).length;
      const duplicateCount = duplicates.length;

      setValidationResults({
        valid: validCount,
        invalid: invalidCount,
        total: updatedStaff.length,
        duplicates: duplicateCount
      });

      setImportProgress(100);
      setActiveTab("preview");
      
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process CSV file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    const validStaff = parsedData.filter(s => s.isValid && !s.isDuplicate);
    if (validStaff.length === 0) {
      toast({
        title: "No Valid Records",
        description: "There are no valid staff records to import",
        variant: "destructive"
      });
      return;
    }
    importMutation.mutate(validStaff);
  };

  const downloadTemplate = () => {
    const headers = [
      "employee_id", "name", "email", "phone", "role", "department", 
      "date_of_joining", "salary", "is_active", "address", "emergency_contact",
      "qualifications", "bank_account_number", "ifsc_code", "pan_number"
    ];
    
    const sampleData = [
      "EMP001", "John Doe", "john@example.com", "9876543210", "Teacher", "Mathematics",
      "2023-01-15", "35000", "true", "123 Main St", "9876543211",
      "M.Sc Mathematics", "1234567890", "SBIN0001234", "ABCDE1234F"
    ];

    const csvContent = [headers, sampleData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={parsedData.length === 0}>
            <FileText className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="template">
            <Download className="w-4 h-4 mr-2" />
            Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-lg font-medium cursor-pointer">
                Choose CSV file to upload
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="max-w-md mx-auto"
              />
            </div>
          </div>

          {file && (
            <div className="space-y-4">
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
              
              <Button onClick={processCSV} disabled={isProcessing} className="w-full">
                {isProcessing ? "Processing..." : "Process CSV"}
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-center text-gray-600">
                {isCheckingDuplicates ? "Checking for duplicates..." : `Processing... ${importProgress}%`}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {parsedData.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{validationResults.valid}</div>
                  <div className="text-sm text-gray-600">Valid Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{validationResults.invalid}</div>
                  <div className="text-sm text-gray-600">Invalid Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{validationResults.duplicates}</div>
                  <div className="text-sm text-gray-600">Duplicates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{validationResults.total}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Employee ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Phone</th>
                      <th className="p-2 text-left">Role</th>
                      <th className="p-2 text-left">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((staff, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          {staff.isDuplicate ? (
                            <Badge variant="secondary">Duplicate</Badge>
                          ) : staff.isValid ? (
                            <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>
                          ) : (
                            <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Invalid</Badge>
                          )}
                        </td>
                        <td className="p-2">{staff.employeeId}</td>
                        <td className="p-2">{staff.name}</td>
                        <td className="p-2">{staff.phone}</td>
                        <td className="p-2">{staff.role}</td>
                        <td className="p-2">
                          {staff.errors.length > 0 && (
                            <div className="text-xs text-red-600">
                              {staff.errors.join(", ")}
                            </div>
                          )}
                          {staff.isDuplicate && (
                            <div className="text-xs text-yellow-600">
                              Duplicate of existing staff member
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("upload")}>
                  Back to Upload
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importMutation.isPending || validationResults.valid === 0}
                >
                  {importMutation.isPending ? "Importing..." : `Import ${validationResults.valid} Staff Members`}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          <div className="text-center space-y-4">
            <Users className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-medium">Download Template</h3>
              <p className="text-gray-600">
                Download a sample CSV template with the required format and headers
              </p>
            </div>
            <Button onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Required Fields:</strong> employee_id, name, phone, role, date_of_joining, salary<br/>
              <strong>Optional Fields:</strong> email, department, is_active, address, emergency_contact, qualifications, bank_account_number, ifsc_code, pan_number
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
