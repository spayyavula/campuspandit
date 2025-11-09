import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, TrendingUp, AlertCircle, BookOpen, Target, RefreshCw, Plus, X } from 'lucide-react';
import {
  getWeakAreas,
  getUpcomingRepetitions
} from '../../services/coaching';
import type {
  WeakArea,
  RepetitionSchedule
} from '../../utils/coachingAI';

interface WeakAreaManagerProps {
  studentId: string;
}

const WeakAreaManager: React.FC<WeakAreaManagerProps> = ({ studentId }) => {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<WeakArea | null>(null);
  const [repetitions, setRepetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRepetition, setSelectedRepetition] = useState<any>(null);

  // Form states
  const [completionForm, setCompletionForm] = useState({
    accuracy: 0,
    problemsAttempted: 0,
    problemsSolved: 0,
    notes: ''
  });

  const [notesForm, setNotesForm] = useState({
    studentNotes: '',
    tutorNotes: ''
  });

  useEffect(() => {
    loadWeakAreas();
  }, [studentId]);

  useEffect(() => {
    if (selectedArea) {
      loadRepetitionsForArea(selectedArea.id);
    }
  }, [selectedArea]);

  const loadWeakAreas = async () => {
    try {
      setLoading(true);
      const data = await getWeakAreas(studentId);
      setWeakAreas(data.filter(w => w.status !== 'resolved'));
      if (data.length > 0 && !selectedArea) {
        setSelectedArea(data[0]);
      }
    } catch (error) {
      console.error('Error loading weak areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepetitionsForArea = async (weakAreaId: string) => {
    try {
      // MVP: Load all upcoming repetitions and filter by weak area
      const data = await getUpcomingRepetitions(studentId, 30);
      // Filter repetitions for this specific weak area
      const areaRepetitions = data.filter((r: any) => r.weak_area_id === weakAreaId);
      setRepetitions(areaRepetitions || []);
    } catch (error) {
      console.error('Error loading repetitions:', error);
      setRepetitions([]);
    }
  };

  const handleScheduleRepetitions = async (weakAreaId: string) => {
    try {
      // MVP: This feature is not yet implemented in the backend
      alert('Scheduling repetitions will be available soon! For now, the AI Coach will automatically schedule them.');
    } catch (error) {
      console.error('Error scheduling repetitions:', error);
      alert('Failed to schedule repetitions');
    }
  };

  const handleOpenCompleteModal = (repetition: any) => {
    setSelectedRepetition(repetition);
    setCompletionForm({
      accuracy: 0,
      problemsAttempted: 0,
      problemsSolved: 0,
      notes: ''
    });
    setShowCompleteModal(true);
  };

  const handleCompleteRepetition = async () => {
    if (!selectedRepetition) return;

    try {
      // MVP: This feature is not yet implemented in the backend
      alert('Completing repetitions will be available soon! The AI Coach will track your progress automatically.');
      setShowCompleteModal(false);
    } catch (error) {
      console.error('Error completing repetition:', error);
      alert('Failed to complete repetition');
    }
  };

  const handleOpenNotesModal = (area: WeakArea) => {
    setNotesForm({
      studentNotes: area.student_notes || '',
      tutorNotes: area.tutor_notes || ''
    });
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedArea) return;

    try {
      // MVP: This feature is not yet implemented in the backend
      alert('Saving notes will be available soon!');
      setShowNotesModal(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  const handleMarkAsResolved = async (weakAreaId: string) => {
    if (!confirm('Are you sure you want to mark this weak area as resolved?')) return;

    try {
      // MVP: This feature is not yet implemented in the backend
      alert('Marking weak areas as resolved will be available soon!');
    } catch (error) {
      console.error('Error marking as resolved:', error);
      alert('Failed to update weak area');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'improving': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRepetitionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-gray-600">Loading weak areas...</p>
        </div>
      </div>
    );
  }

  if (weakAreas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <CheckCircle className="w-20 h-20 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Weak Areas!</h2>
          <p className="text-gray-600 mb-6">
            You're doing great! Keep studying consistently to maintain your progress.
          </p>
          <button
            onClick={() => window.location.href = '/coach'}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to AI Coach
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar - Weak Areas List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Weak Areas Manager
            </h2>
            <p className="text-sm text-gray-600 mt-1">{weakAreas.length} active areas</p>
          </div>

          <div className="p-3 space-y-2">
            {weakAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedArea?.id === area.id
                    ? 'bg-purple-50 border-purple-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm">{area.topic}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(area.weakness_severity)}`}>
                    {area.weakness_severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2 capitalize">{area.subject}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(area.status)}`}>
                    {area.status}
                  </span>
                  <span className="text-gray-500">
                    {area.current_accuracy_percentage?.toFixed(0)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedArea && (
            <div className="p-6">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{selectedArea.topic}</h1>
                      <span className={`text-sm px-3 py-1 rounded-full border ${getSeverityColor(selectedArea.weakness_severity)}`}>
                        {selectedArea.weakness_severity}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedArea.status)}`}>
                        {selectedArea.status}
                      </span>
                    </div>
                    <p className="text-gray-600 capitalize">{selectedArea.subject}</p>
                    {selectedArea.subtopic && (
                      <p className="text-sm text-gray-500 mt-1">Subtopic: {selectedArea.subtopic}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenNotesModal(selectedArea)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Notes
                    </button>
                    <button
                      onClick={() => handleMarkAsResolved(selectedArea.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Resolved
                    </button>
                  </div>
                </div>

                {/* Identification Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Identified From:</p>
                  <p className="text-sm text-gray-600">{selectedArea.identified_from}</p>
                  {selectedArea.identification_reason && (
                    <p className="text-sm text-gray-600 mt-2">{selectedArea.identification_reason}</p>
                  )}
                </div>

                {/* Progress Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Accuracy</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedArea.current_accuracy_percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedArea.target_accuracy_percentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Improvement</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedArea.current_improvement_percentage?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Attempts</p>
                    <p className="text-2xl font-bold text-gray-700">{selectedArea.attempts_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Repetitions</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {selectedArea.times_repeated}/{selectedArea.target_repetitions}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress to Target</span>
                    <span>
                      {((selectedArea.current_accuracy_percentage || 0) / selectedArea.target_accuracy_percentage * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-3 transition-all"
                      style={{
                        width: `${Math.min(
                          ((selectedArea.current_accuracy_percentage || 0) / selectedArea.target_accuracy_percentage) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>

                {/* AI Recommendations */}
                {selectedArea.ai_recommendations && selectedArea.ai_recommendations.length > 0 && (
                  <div className="mt-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold text-purple-900 mb-2">AI Recommendations:</p>
                    <ul className="space-y-1">
                      {selectedArea.ai_recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Repetition Schedule */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Repetition Schedule
                  </h2>
                  {repetitions.length === 0 && (
                    <button
                      onClick={() => handleScheduleRepetitions(selectedArea.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Schedule Repetitions
                    </button>
                  )}
                </div>

                {repetitions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-4">No repetitions scheduled yet</p>
                    <button
                      onClick={() => handleScheduleRepetitions(selectedArea.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Schedule Repetitions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repetitions.map((rep) => (
                      <div
                        key={rep.id}
                        className={`p-4 border rounded-lg ${
                          rep.status === 'completed' ? 'bg-green-50 border-green-200' :
                          rep.status === 'scheduled' ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Repetition #{rep.repetition_number}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getRepetitionStatusColor(rep.status)}`}>
                                {rep.status}
                              </span>
                              <span className="text-xs px-2 py-1 bg-white rounded-full capitalize">
                                {rep.content_type}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                              <div>
                                <p className="text-gray-600">Scheduled Date</p>
                                <p className="font-medium">
                                  {new Date(rep.scheduled_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Duration</p>
                                <p className="font-medium">~{rep.estimated_duration_minutes} min</p>
                              </div>
                              {rep.status === 'completed' && (
                                <>
                                  <div>
                                    <p className="text-gray-600">Accuracy</p>
                                    <p className="font-medium text-green-600">{rep.accuracy_achieved?.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Problems</p>
                                    <p className="font-medium">{rep.problems_solved}/{rep.problems_attempted}</p>
                                  </div>
                                </>
                              )}
                            </div>

                            {rep.notes && (
                              <div className="bg-white p-2 rounded text-sm text-gray-700">
                                <p className="font-semibold mb-1">Notes:</p>
                                <p>{rep.notes}</p>
                              </div>
                            )}
                          </div>

                          {rep.status === 'scheduled' && (
                            <button
                              onClick={() => handleOpenCompleteModal(rep)}
                              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Repetition Modal */}
      {showCompleteModal && selectedRepetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Complete Repetition #{selectedRepetition.repetition_number}</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accuracy Achieved (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={completionForm.accuracy}
                  onChange={(e) => setCompletionForm({ ...completionForm, accuracy: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="85"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problems Attempted
                </label>
                <input
                  type="number"
                  min="0"
                  value={completionForm.problemsAttempted}
                  onChange={(e) => setCompletionForm({ ...completionForm, problemsAttempted: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problems Solved Correctly
                </label>
                <input
                  type="number"
                  min="0"
                  max={completionForm.problemsAttempted}
                  value={completionForm.problemsSolved}
                  onChange={(e) => setCompletionForm({ ...completionForm, problemsSolved: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={completionForm.notes}
                  onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any observations or difficulties..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCompleteRepetition}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Complete
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notes for {selectedArea.topic}</h3>
              <button onClick={() => setShowNotesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Notes
                </label>
                <textarea
                  value={notesForm.studentNotes}
                  onChange={(e) => setNotesForm({ ...notesForm, studentNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={6}
                  placeholder="Add your personal notes about this weak area..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutor Notes (Read Only)
                </label>
                <textarea
                  value={notesForm.tutorNotes}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  rows={4}
                  placeholder="Your tutor hasn't added any notes yet..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveNotes}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save Notes
              </button>
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeakAreaManager;
