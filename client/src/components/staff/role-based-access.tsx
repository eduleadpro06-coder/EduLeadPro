import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  IndianRupee, 
  Calendar,
  BarChart,
  FileText,
  UserCheck,
  Lock
} from 'lucide-react';

interface RolePermissions {
  [key: string]: {
    name: string;
    color: string;
    permissions: string[];
    description: string;
    icon: React.ReactNode;
  };
}

const rolePermissions: RolePermissions = {
  'Admin': {
    name: 'Administrator',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: [
      'View all staff',
      'Add/Edit/Delete staff',
      'Manage payroll',
      'View analytics',
      'Manage departments',
      'System settings',
      'User management'
    ],
    description: 'Full system access with administrative privileges',
    icon: <Shield className="h-5 w-5" />
  },
  'Teacher': {
    name: 'Teacher',
    color: 'bg-green-100 text-green-800 border-green-200',
    permissions: [
      'View own profile',
      'Update personal info',
      'View attendance',
      'View salary info',
      'Submit leave requests'
    ],
    description: 'Teaching staff with limited administrative access',
    icon: <Users className="h-5 w-5" />
  },
  'Counselor': {
    name: 'Counselor',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: [
      'View student records',
      'Manage counseling sessions',
      'View own profile',
      'Update personal info',
      'View attendance'
    ],
    description: 'Student counseling and support staff',
    icon: <UserCheck className="h-5 w-5" />
  },
  'Accountant': {
    name: 'Accountant',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    permissions: [
      'View all staff',
      'Manage payroll',
      'View financial reports',
      'Process payments',
      'View own profile'
    ],
    description: 'Financial management and payroll processing',
    icon: <IndianRupee className="h-5 w-5" />
  },
  'HR': {
    name: 'Human Resources',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    permissions: [
      'View all staff',
      'Add/Edit staff',
      'Manage attendance',
      'View payroll',
      'Manage departments',
      'View analytics'
    ],
    description: 'Human resources management and staff administration',
    icon: <Settings className="h-5 w-5" />
  },
  'Support': {
    name: 'Support Staff',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    permissions: [
      'View own profile',
      'Update personal info',
      'View attendance',
      'Submit requests'
    ],
    description: 'General support and administrative staff',
    icon: <Users className="h-5 w-5" />
  }
};

// Helper functions
const canPerformAction = (action: string, userRole?: string): boolean => {
  if (!userRole) return false;
  
  const role = rolePermissions[userRole];
  if (!role) return false;
  
  return role.permissions.includes(action);
};

const getRoleInfo = (role: string) => {
  return rolePermissions[role] || {
    name: role,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    permissions: [],
    description: 'Custom role',
    icon: <Lock className="h-5 w-5" />
  };
};

interface RoleBasedAccessProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
  showPermissions?: boolean;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  currentRole,
  onRoleChange,
  showPermissions = false
}) => {
  return (
    <div className="space-y-6">
      {showPermissions && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(rolePermissions).map(([role, info]) => (
            <Card key={role} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {info.icon}
                  <CardTitle className="text-lg">{info.name}</CardTitle>
                </div>
                <CardDescription>{info.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge className={info.color}>
                    {role}
                  </Badge>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {info.permissions.slice(0, 3).map((permission, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {permission}
                      </li>
                    ))}
                    {info.permissions.length > 3 && (
                      <li className="text-xs text-gray-500">
                        +{info.permissions.length - 3} more permissions
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {currentRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current Role Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getRoleInfo(currentRole).color}>
                  {currentRole}
                </Badge>
                <span className="text-sm text-gray-600">
                  {getRoleInfo(currentRole).description}
                </span>
              </div>
              
              <div className="grid gap-2">
                <h4 className="font-medium text-sm">Available Actions:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getRoleInfo(currentRole).permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {permission}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Hook for role-based access control
export const useRoleAccess = (userRole?: string) => {
  const canView = (action: string): boolean => {
    return canPerformAction(action, userRole);
  };

  const canEdit = (action: string): boolean => {
    return canPerformAction(action, userRole);
  };

  const canDelete = (action: string): boolean => {
    return canPerformAction(action, userRole);
  };

  const canManage = (action: string): boolean => {
    return canPerformAction(action, userRole);
  };

  return {
    canView,
    canEdit,
    canDelete,
    canManage,
    rolePermissions,
    getRoleInfo: (role: string) => getRoleInfo(role)
  };
};

// Permission constants
export const PERMISSIONS = {
  STAFF: {
    VIEW_ALL: 'View all staff',
    ADD: 'Add/Edit/Delete staff',
    EDIT: 'Add/Edit staff',
    DELETE: 'Add/Edit/Delete staff',
    VIEW_OWN: 'View own profile',
    UPDATE_OWN: 'Update personal info'
  },
  PAYROLL: {
    VIEW: 'View payroll',
    MANAGE: 'Manage payroll',
    PROCESS: 'Process payments'
  },
  ATTENDANCE: {
    VIEW: 'View attendance',
    MANAGE: 'Manage attendance'
  },
  ANALYTICS: {
    VIEW: 'View analytics'
  },
  SETTINGS: {
    MANAGE: 'System settings',
    DEPARTMENTS: 'Manage departments'
  },
  USERS: {
    MANAGE: 'User management'
  }
} as const;

export default RoleBasedAccess; 