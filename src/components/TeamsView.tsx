import React, { useState } from 'react';
import { ArrowLeft, Users, Crown, Trophy, Plus, Search } from 'lucide-react';
import { teams, bots } from '../data/gameData';
import { Team } from '../types';

interface TeamsViewProps {
  onBack: () => void;
}

const TeamsView: React.FC<TeamsViewProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gaming Arena
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams & Competitions</h1>
            <p className="text-gray-600">Join a team or create your own to compete together</p>
          </div>
          
          <button
            onClick={() => console.log('Create team')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg px-6 py-3 hover:opacity-90 transition-opacity flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams List */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {filteredTeams.map((team) => (
              <div 
                key={team.id} 
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer transition-all hover:shadow-md ${
                  selectedTeam?.id === team.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${team.color} rounded-xl flex items-center justify-center text-2xl`}>
                      {team.badge}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{team.name}</h3>
                      <p className="text-gray-600 mb-2">{team.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {team.members.length} members
                        </span>
                        <span className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          Rank #{team.rank}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{team.totalPoints.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">total points</div>
                  </div>
                </div>

                {/* Team Members Preview */}
                <div className="flex items-center space-x-2 mb-4">
                  {team.members.slice(0, 4).map((member) => (
                    <div key={member.id} className="relative">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                        {member.avatar}
                      </div>
                      {member.isBot && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                      )}
                    </div>
                  ))}
                  {team.members.length > 4 && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600">
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Join team:', team.id);
                  }}
                  className={`w-full bg-gradient-to-r ${team.color} text-white rounded-lg py-2 hover:opacity-90 transition-opacity`}
                >
                  Join Team
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Team Details Sidebar */}
        <div className="lg:col-span-1">
          {selectedTeam ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${selectedTeam.color} rounded-xl flex items-center justify-center text-3xl mx-auto mb-4`}>
                  {selectedTeam.badge}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedTeam.name}</h3>
                <p className="text-gray-600 text-sm">{selectedTeam.description}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Global Rank</span>
                  <span className="font-semibold">#{selectedTeam.rank}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Points</span>
                  <span className="font-semibold">{selectedTeam.totalPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Members</span>
                  <span className="font-semibold">{selectedTeam.members.length}/6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold">{selectedTeam.createdAt.toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Team Members</h4>
                <div className="space-y-2">
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{member.avatar}</span>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium">{member.name}</span>
                            {member.role === 'leader' && <Crown className="w-3 h-3 text-yellow-500" />}
                            {member.isBot && (
                              <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">BOT</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{member.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => console.log('Join team:', selectedTeam.id)}
                className={`w-full bg-gradient-to-r ${selectedTeam.color} text-white rounded-lg py-3 hover:opacity-90 transition-opacity`}
              >
                Join {selectedTeam.name}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Team</h3>
              <p className="text-gray-600 text-sm">Click on a team to view details and join</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsView;