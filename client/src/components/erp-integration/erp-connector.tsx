import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Link, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  Users, 
  GraduationCap,
  IndianRupee,
  Settings,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ERPSystem {
  id: string;
  name: string;
  type: "tally" | "sap" | "oracle" | "custom" | "zoho" | "salesforce";
  status: "connected" | "disconnected" | "error" | "syncing";
  apiEndpoint: string;
  lastSync: Date | null;
  syncedEntities: string[];
  credentials: {
    username?: string;
    apiKey?: string;
    serverUrl?: string;
  };
}

interface SyncMapping {
  localField: string;
  erpField: string;
  direction: "import" | "export" | "bidirectional";
  dataType: "string" | "number" | "date" | "boolean";
}

export default function ERPConnector() {
  const [activeSystem, setActiveSystem] = useState<ERPSystem | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    type: "",
    name: "",
    apiEndpoint: "",
    username: "",
    apiKey: "",
    serverUrl: ""
  });
  const [syncMappings, setSyncMappings] = useState<SyncMapping[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    return window.location.hash.slice(1) || "systems";
  });

  const { data: erpSystems, refetch } = useQuery({
    queryKey: ["/api/erp/systems"],
    queryFn: async () => {
      // Mock data for demonstration
      const systems: ERPSystem[] = [
        {
          id: "1",
          name: "School ERP System",
          type: "custom",
          status: "connected",
          apiEndpoint: "https://school-erp.example.com/api",
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
          syncedEntities: ["students", "fees", "classes"],
          credentials: {
            username: "admin",
            apiKey: "****",
            serverUrl: "https://school-erp.example.com"
          }
        }
      ];
      return systems;
    }
  });

  const connectERPMutation = useMutation({
    mutationFn: async (systemData: any) => {
      const response = await apiRequest("POST", "/api/erp/connect", systemData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ERP Connected",
        description: "Successfully connected to ERP system",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to ERP system. Please check credentials.",
        variant: "destructive"
      });
    }
  });

  const syncDataMutation = useMutation({
    mutationFn: async ({ systemId, entities }: { systemId: string; entities: string[] }) => {
      const response = await apiRequest("POST", `/api/erp/${systemId}/sync`, { entities });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Data synchronized successfully",
      });
    }
  });

  const connectERP = () => {
    if (!connectionForm.name || !connectionForm.apiEndpoint) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    connectERPMutation.mutate(connectionForm);
  };

  const syncData = (systemId: string, entities: string[]) => {
    syncDataMutation.mutate({ systemId, entities });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-100 text-green-800";
      case "syncing": return "bg-blue-100 text-blue-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle size={16} className="text-green-600" />;
      case "syncing": return <RefreshCw size={16} className="text-blue-600 animate-spin" />;
      case "error": return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Database size={16} className="text-gray-600" />;
    }
  };

  const defaultMappings: SyncMapping[] = [
    { localField: "name", erpField: "student_name", direction: "bidirectional", dataType: "string" },
    { localField: "phone", erpField: "contact_number", direction: "bidirectional", dataType: "string" },
    { localField: "email", erpField: "email_address", direction: "bidirectional", dataType: "string" },
    { localField: "class", erpField: "grade_level", direction: "bidirectional", dataType: "string" },
    { localField: "status", erpField: "admission_status", direction: "export", dataType: "string" },
    { localField: "createdAt", erpField: "inquiry_date", direction: "export", dataType: "date" }
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2" size={20} />
            ERP/CRM Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="systems">Connected Systems</TabsTrigger>
              <TabsTrigger value="connect">Add Connection</TabsTrigger>
              <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
              <TabsTrigger value="sync">Data Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="systems" className="space-y-4">
              <div className="space-y-4">
                {erpSystems?.map((system) => (
                  <div key={system.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(system.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{system.name}</h4>
                          <p className="text-sm text-gray-600">{system.type.toUpperCase()} • {system.apiEndpoint}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="status" className={getStatusColor(system.status)}>
                          {system.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncData(system.id, system.syncedEntities)}
                          disabled={syncDataMutation.isPending}
                        >
                          <RotateCcw size={14} className="mr-1" />
                          Sync Now
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">Last Sync</div>
                        <div className="text-gray-600">
                          {system.lastSync ? system.lastSync.toLocaleString() : "Never"}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Entities</div>
                        <div className="text-gray-600">
                          {system.syncedEntities.join(", ")}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Status</div>
                        <div className="flex items-center gap-1 text-gray-600">
                          {system.status === "connected" && <CheckCircle size={12} className="text-green-600" />}
                          {system.status === "connected" ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!erpSystems || erpSystems.length === 0) && (
                  <div className="text-center py-8">
                    <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No ERP Systems Connected</h3>
                    <p className="text-gray-600 mb-4">Connect your school's ERP or CRM system to sync student data</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="connect" className="space-y-4">
              <div className="max-w-2xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Type
                  </label>
                  <Select
                    value={connectionForm.type}
                    onValueChange={(value) => setConnectionForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ERP/CRM system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tally">Tally ERP</SelectItem>
                      <SelectItem value="sap">SAP</SelectItem>
                      <SelectItem value="oracle">Oracle ERP</SelectItem>
                      <SelectItem value="zoho">Zoho CRM</SelectItem>
                      <SelectItem value="salesforce">Salesforce</SelectItem>
                      <SelectItem value="custom">Custom System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Name
                  </label>
                  <Input
                    value={connectionForm.name}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter system name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint
                  </label>
                  <Input
                    value={connectionForm.apiEndpoint}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                    placeholder="https://your-erp.com/api"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <Input
                      value={connectionForm.username}
                      onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <Input
                      type="password"
                      value={connectionForm.apiKey}
                      onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="API Key"
                    />
                  </div>
                </div>

                <Button onClick={connectERP} disabled={connectERPMutation.isPending}>
                  <Link size={16} className="mr-2" />
                  {connectERPMutation.isPending ? "Connecting..." : "Connect System"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Field Mapping Configuration</h3>
                <div className="space-y-3">
                  {defaultMappings.map((mapping, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 items-center p-3 border border-gray-200 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Local Field</label>
                        <Input value={mapping.localField} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">ERP Field</label>
                        <Input 
                          value={mapping.erpField}
                          onChange={(e) => {
                            const newMappings = [...defaultMappings];
                            newMappings[index].erpField = e.target.value;
                            setSyncMappings(newMappings);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Direction</label>
                        <Select value={mapping.direction}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="import">Import Only</SelectItem>
                            <SelectItem value="export">Export Only</SelectItem>
                            <SelectItem value="bidirectional">Bidirectional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <Badge variant="outline">{mapping.dataType}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4">
                  <Settings size={16} className="mr-2" />
                  Save Mapping Configuration
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Users size={18} className="mr-2" />
                      Student Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Local Records</span>
                        <span className="font-medium">1,245</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ERP Records</span>
                        <span className="font-medium">1,198</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Sync</span>
                        <span className="font-medium text-orange-600">47</span>
                      </div>
                      <Button size="sm" className="w-full">
                        <RotateCcw size={14} className="mr-1" />
                        Sync Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <IndianRupee size={18} className="mr-2" />
                      Fee Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Local Records</span>
                        <span className="font-medium">892</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ERP Records</span>
                        <span className="font-medium">892</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Sync</span>
                        <span className="font-medium text-green-600">0</span>
                      </div>
                      <Button size="sm" className="w-full" variant="outline">
                        <CheckCircle size={14} className="mr-1" />
                        Up to Date
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <GraduationCap size={18} className="mr-2" />
                      Academic Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Local Records</span>
                        <span className="font-medium">156</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ERP Records</span>
                        <span className="font-medium">143</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Sync</span>
                        <span className="font-medium text-orange-600">13</span>
                      </div>
                      <Button size="sm" className="w-full">
                        <RotateCcw size={14} className="mr-1" />
                        Sync Academic
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}