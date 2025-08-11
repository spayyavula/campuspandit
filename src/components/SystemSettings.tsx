import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Mail, 
  Shield, 
  Globe, 
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

interface SystemSetting {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'password';
  category: string;
  label: string;
  description: string;
  isPublic: boolean;
  isRequired: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('general');
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockSettings: SystemSetting[] = [
        // General Settings
        {
          key: 'app_name',
          value: 'CampusPandit',
          type: 'string',
          category: 'general',
          label: 'Application Name',
          description: 'The name of your application displayed to users',
          isPublic: true,
          isRequired: true
        },
        {
          key: 'app_description',
          value: 'Smart Learning Platform for Physics, Math, and Chemistry',
          type: 'string',
          category: 'general',
          label: 'Application Description',
          description: 'Brief description of your application',
          isPublic: true,
          isRequired: false
        },
        {
          key: 'maintenance_mode',
          value: false,
          type: 'boolean',
          category: 'general',
          label: 'Maintenance Mode',
          description: 'Enable maintenance mode to prevent user access',
          isPublic: false,
          isRequired: false
        },
        {
          key: 'registration_enabled',
          value: true,
          type: 'boolean',
          category: 'general',
          label: 'User Registration',
          description: 'Allow new users to register accounts',
          isPublic: false,
          isRequired: false
        },
        
        // Security Settings
        {
          key: 'session_timeout',
          value: 86400,
          type: 'number',
          category: 'security',
          label: 'Session Timeout (seconds)',
          description: 'How long user sessions remain active',
          isPublic: false,
          isRequired: true,
          validation: { min: 300, max: 604800 }
        },
        {
          key: 'password_min_length',
          value: 8,
          type: 'number',
          category: 'security',
          label: 'Minimum Password Length',
          description: 'Minimum number of characters required for passwords',
          isPublic: false,
          isRequired: true,
          validation: { min: 6, max: 128 }
        },
        {
          key: 'max_login_attempts',
          value: 5,
          type: 'number',
          category: 'security',
          label: 'Max Login Attempts',
          description: 'Maximum failed login attempts before account lockout',
          isPublic: false,
          isRequired: true,
          validation: { min: 3, max: 10 }
        },
        {
          key: 'jwt_secret',
          value: 'your-secret-key-here',
          type: 'password',
          category: 'security',
          label: 'JWT Secret Key',
          description: 'Secret key used for JWT token signing',
          isPublic: false,
          isRequired: true
        },
        
        // Email Settings
        {
          key: 'smtp_host',
          value: 'smtp.gmail.com',
          type: 'string',
          category: 'email',
          label: 'SMTP Host',
          description: 'SMTP server hostname',
          isPublic: false,
          isRequired: true
        },
        {
          key: 'smtp_port',
          value: 587,
          type: 'number',
          category: 'email',
          label: 'SMTP Port',
          description: 'SMTP server port number',
          isPublic: false,
          isRequired: true,
          validation: { min: 1, max: 65535 }
        },
        {
          key: 'smtp_username',
          value: 'your-email@gmail.com',
          type: 'string',
          category: 'email',
          label: 'SMTP Username',
          description: 'SMTP authentication username',
          isPublic: false,
          isRequired: true
        },
        {
          key: 'smtp_password',
          value: 'your-app-password',
          type: 'password',
          category: 'email',
          label: 'SMTP Password',
          description: 'SMTP authentication password',
          isPublic: false,
          isRequired: true
        },
        {
          key: 'from_email',
          value: 'noreply@campuspandit.com',
          type: 'string',
          category: 'email',
          label: 'From Email Address',
          description: 'Default sender email address',
          isPublic: false,
          isRequired: true,
          validation: { pattern: '^[^@]+@[^@]+\.[^@]+$' }
        },
        
        // Storage Settings
        {
          key: 'max_file_size',
          value: 10485760,
          type: 'number',
          category: 'storage',
          label: 'Max File Size (bytes)',
          description: 'Maximum file upload size in bytes',
          isPublic: false,
          isRequired: true,
          validation: { min: 1048576, max: 104857600 }
        },
        {
          key: 'allowed_file_types',
          value: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
          type: 'json',
          category: 'storage',
          label: 'Allowed File Types',
          description: 'List of allowed file extensions',
          isPublic: false,
          isRequired: true
        },
        {
          key: 'storage_provider',
          value: 'local',
          type: 'string',
          category: 'storage',
          label: 'Storage Provider',
          description: 'File storage provider (local, s3, gcs)',
          isPublic: false,
          isRequired: true
        }
      ];
      setSettings(mockSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const categories = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'storage', label: 'Storage', icon: Database }
  ];

  const filteredSettings = settings.filter(setting => {
    const matchesCategory = setting.category === activeCategory;
    const matchesSearch = setting.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={setting.value}
              onChange={(e) => updateSetting(setting.key, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              {setting.value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, parseInt(e.target.value) || 0)}
            min={setting.validation?.min}
            max={setting.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={setting.isRequired}
          />
        );
      
      case 'password':
        return (
          <div className="relative">
            <input
              type={showPasswords[setting.key] ? 'text' : 'password'}
              value={setting.value}
              onChange={(e) => updateSetting(setting.key, e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={setting.isRequired}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(setting.key)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords[setting.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );
      
      case 'json':
        return (
          <textarea
            value={JSON.stringify(setting.value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateSetting(setting.key, parsed);
              } catch (error) {
                // Invalid JSON, don't update
              }
            }}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            required={setting.isRequired}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            pattern={setting.validation?.pattern}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={setting.isRequired}
          />
        );
    }
  };

  const getSettingIcon = (setting: SystemSetting) => {
    if (setting.type === 'boolean') {
      return setting.value ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure application settings and preferences</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadSettings}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors ${
                  activeCategory === category.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSettings.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No settings found</h3>
            <p className="text-gray-600">Try adjusting your search or select a different category</p>
          </div>
        ) : (
          filteredSettings.map((setting) => (
            <div key={setting.key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  {getSettingIcon(setting)}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{setting.label}</h3>
                      {setting.isRequired && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Required
                        </span>
                      )}
                      {setting.isPublic && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{setting.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Key: {setting.key}</p>
                  </div>
                </div>
              </div>

              <div className="max-w-md">
                {renderSettingInput(setting)}
              </div>

              {setting.validation && (
                <div className="mt-2 text-xs text-gray-500">
                  {setting.validation.min && setting.validation.max && (
                    <span>Range: {setting.validation.min} - {setting.validation.max}</span>
                  )}
                  {setting.validation.pattern && (
                    <span>Pattern: {setting.validation.pattern}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Warning Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Important Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Changes to system settings may affect application functionality. 
              Please ensure you understand the implications before making modifications.
              Some settings may require an application restart to take effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;