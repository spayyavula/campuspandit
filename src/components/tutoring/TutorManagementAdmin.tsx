import React, { useState, useEffect } from 'react';
import {
  Check, X, Eye, Search, Filter, Users, Clock,
  Shield, AlertCircle, FileText, Download, Loader
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { TutorProfile } from '../../utils/tutoringAPI';

/**
 * TutorManagementAdmin Component
 * Admin panel for verifying and managing tutors
 */
export default function TutorManagementAdmin() {
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<TutorProfile[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);

  useEffect(() => {
    loadTutors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tutors, selectedStatus, searchTerm]);

  const loadTutors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error loading tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tutors];

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.verification_status === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.full_name.toLowerCase().includes(term) ||
          t.country.toLowerCase().includes(term) ||
          t.subjects.some(s => s.toLowerCase().includes(term))
      );
    }

    setFilteredTutors(filtered);
  };

  const updateTutorStatus = async (
    tutorId: string,
    status: 'verified' | 'rejected',
    notes?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {
        verification_status: status,
        verified_at: new Date().toISOString(),
        verified_by: user.id
      };

      const { error } = await supabase
        .from('tutor_profiles')
        .update(updateData)
        .eq('id', tutorId);

      if (error) throw error;

      // Reload tutors
      await loadTutors();
      setSelectedTutor(null);

      // TODO: Send email notification to tutor
    } catch (error: any) {
      console.error('Error updating tutor status:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: any = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      verified: { color: 'bg-green-100 text-green-800', text: 'Verified' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status || 'pending'] || statusConfig.pending;

    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const stats = {
    total: tutors.length,
    pending: tutors.filter(t => t.verification_status === 'pending').length,
    verified: tutors.filter(t => t.verification_status === 'verified').length,
    rejected: tutors.filter(t => t.verification_status === 'rejected').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutor Management</h1>
          <p className="text-gray-600">Review and verify tutor applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tutors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Verified</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.verified}</p>
            </div>
            <Shield className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</p>
            </div>
            <X className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, country, or subject..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Showing {filteredTutors.length} of {tutors.length} tutors
        </p>
      </div>

      {/* Tutors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="text-center p-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No tutors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tutor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTutors.map(tutor => (
                  <tr key={tutor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{tutor.full_name}</div>
                        <div className="text-sm text-gray-500">{tutor.country}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {tutor.subjects.slice(0, 2).map(subject => (
                          <span
                            key={subject}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {subject}
                          </span>
                        ))}
                        {tutor.subjects.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{tutor.subjects.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tutor.teaching_experience_years} years
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${tutor.hourly_rate_usd}/hr
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(tutor.verification_status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(tutor.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedTutor(tutor)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Review Tutor Application</h2>
                <button
                  onClick={() => setSelectedTutor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900 mt-1">{selectedTutor.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Display Name</label>
                    <p className="text-gray-900 mt-1">{selectedTutor.display_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Country</label>
                    <p className="text-gray-900 mt-1">{selectedTutor.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timezone</label>
                    <p className="text-gray-900 mt-1">{selectedTutor.timezone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teaching Experience</label>
                    <p className="text-gray-900 mt-1">{selectedTutor.teaching_experience_years} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Hourly Rate</label>
                    <p className="text-gray-900 mt-1">${selectedTutor.hourly_rate_usd}/hr</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-700">{selectedTutor.bio}</p>
              </div>

              {/* Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTutor.subjects.map(subject => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialization */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialization</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTutor.specialization.map(spec => (
                    <span
                      key={spec}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Teaching Style */}
              {selectedTutor.teaching_style && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Teaching Style</h3>
                  <p className="text-gray-700">{selectedTutor.teaching_style}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedTutor.verification_status === 'pending' && (
                <div className="flex items-center gap-4 pt-6 border-t">
                  <button
                    onClick={() => updateTutorStatus(selectedTutor.id!, 'verified')}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <Check className="w-5 h-5" />
                    Approve & Verify
                  </button>
                  <button
                    onClick={() => updateTutorStatus(selectedTutor.id!, 'rejected')}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <X className="w-5 h-5" />
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
