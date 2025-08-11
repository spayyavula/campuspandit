import React from 'react';
import { Info, Shield, Mail } from 'lucide-react';

const AuthConfigNotice: React.FC = () => {
  return (
    <div className="bg-blue-500 bg-opacity-20 backdrop-blur-lg rounded-xl p-4 max-w-md mx-auto mt-4 border border-blue-400 border-opacity-30">
      <div className="flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
        <div className="text-blue-100 text-sm">
          <h4 className="font-semibold mb-1">Development Mode Active</h4>
          <p className="mb-2">
            Email verification is currently <strong>disabled</strong> for faster development.
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <Shield className="w-3 h-3" />
              <span>Users are auto-confirmed after registration</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-3 h-3" />
              <span>No verification emails are sent</span>
            </div>
          </div>
          <p className="mt-2 text-xs opacity-80">
            For production, enable email confirmation in Supabase settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthConfigNotice;
