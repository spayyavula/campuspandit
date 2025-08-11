import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  CheckCircle, 
  XCircle,
  Eye,
  Settings,
  Database,
  FileText,
  BarChart3,
  UserCheck
} from 'lucide-react';

interface Permission {
  resource: string;
  actions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'student',
          displayName: 'Student',
          description: 'Regular student with basic access to learning materials',
          permissions: [
            {
              resource: 'questions',
              actions: { create: false, read: true, update: false, delete: false }
            },
            {
              resource: 'responses',
              actions: { create: true, read: true, update: false, delete: false }
            },
            {
              resource: 'profile',
              actions: { create: false, read: true, update: true, delete: false }
            }
          ],
          userCount: 1089,
          isSystemRole: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'teacher',
          displayName: 'Teacher',
          description: 'Educator with content creation and student management rights',
          permissions: [
            {
              resource: 'questions',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'collections',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'responses',
              actions: { create: false, read: true, update: false, delete: false }
            },
            {
              resource: 'analytics',
              actions: { create: false, read: true, update: false, delete: false }
            },
            {
              resource: 'profile',
              actions: { create: false, read: true, update: true, delete: false }
            }
          ],
          userCount: 142,
          isSystemRole: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'admin',
          displayName: 'Administrator',
          description: 'System administrator with user management capabilities',
          permissions: [
            {
              resource: 'questions',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'collections',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'users',
              actions: { create: false, read: true, update: true, delete: false }
            },
            {
              resource: 'analytics',
              actions: { create: false, read: true, update: false, delete: false }
            },
            {
              resource: 'audit_logs',
              actions: { create: false, read: true, update: false, delete: false }
            },
            {
              resource: 'profile',
              actions: { create: false, read: true, update: true, delete: false }
            }
          ],
          userCount: 12,
          isSystemRole: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'super_admin',
          displayName: 'Super Administrator',
          description: 'Full system access including role and system management',
          permissions: [
            {
              resource: 'questions',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'collections',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'users',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'roles',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'settings',
              actions: { create: true, read: true, update: true, delete: true }
            },
            {
              resource: 'analytics',
              actions: { create: false, read: true, update: false, delete: false }
            },
            {
              resource: 'audit_logs',
              actions: { create: false, read: true, update: false, delete: false }
            },
            {
              resource: 'profile',
              actions: { create: false, read: true, update: true, delete: false }
            }
          ],
          userCount: 4,
          isSystemRole: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      setRoles(mockRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'student': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'teacher': return 'bg-green-100 text-green-800 border-green-200';
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'student': return '👨‍🎓';
      case 'teacher': return '👨‍🏫';
      case 'admin': return '👨‍💼';
      case 'super_admin': return '👑';
      default: return '👤';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'questions': return <FileText className="w-4 h-4" />;
      case 'collections': return <Database className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'roles': return <Shield className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4" />;
      case 'analytics': return <BarChart3 className="w-4 h-4" />;
      case 'audit_logs': return <Eye className="w-4 h-4" />;
      case 'responses': return <UserCheck className="w-4 h-4" />;
      case 'profile': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemRole) {
      alert('System roles cannot be deleted');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      setRoles(prev => prev.filter(role => role.id !== roleId));
    }
  };

  const PermissionMatrix: React.FC<{ permissions: Permission[] }> = ({ permissions }) => (
    <div className="space-y-3">
      {permissions.map((permission, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {getResourceIcon(permission.resource)}
            <span className="font-medium text-gray-900 capitalize">
              {permission.resource.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {Object.entries(permission.actions).map(([action, allowed]) => (
              <div
                key={action}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                  allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {allowed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span className="capitalize">{action}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Configure roles and permissions for your organization</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Roles</p>
              <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Roles</p>
              <p className="text-3xl font-bold text-gray-900">
                {roles.filter(r => r.isSystemRole).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Custom Roles</p>
              <p className="text-3xl font-bold text-gray-900">
                {roles.filter(r => !r.isSystemRole).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getRoleIcon(role.name)}</div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{role.displayName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role.name)}`}>
                          {role.name}
                        </span>
                        {role.isSystemRole && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            System Role
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{role.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{role.userCount} users</span>
                        </span>
                        <span>Created: {formatDate(role.createdAt)}</span>
                        <span>Updated: {formatDate(role.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {!role.isSystemRole && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Permissions</h4>
                  <PermissionMatrix permissions={role.permissions} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoleManagement;