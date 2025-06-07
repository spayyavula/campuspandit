import React from 'react';
import { Trophy, Users, Zap, Target, Crown, Sword } from 'lucide-react';
import { teams, tournaments, achievements, activeBattles } from '../data/gameData';

interface GameDashboardProps {
  onJoinTournament: (tournamentId: string) => void;
  onJoinBattle: () => void;
  onViewTeams: () => void;
}

const GameDashboard: React.FC<GameDashboardProps> = ({ 
  onJoinTournament, 
  onJoinBattle, 
  onViewTeams 
}) => {
  const userStats = {
    totalPoints: 1850,
    rank: 15,
    battlesWon: 23,
    tournamentsWon: 3,
    currentStreak: 7
  };

  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming').slice(0, 3);
  const recentAchievements = achievements.filter(a => a.earned).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gaming Arena</h2>
        <p className="text-gray-600">Compete, learn, and climb the leaderboards!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Points</p>
              <p className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</p>
            </div>
            <Crown className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Global Rank</p>
              <p className="text-2xl font-bold">#{userStats.rank}</p>
            </div>
            <Trophy className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Battles Won</p>
              <p className="text-2xl font-bold">{userStats.battlesWon}</p>
            </div>
            <Sword className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Tournaments</p>
              <p className="text-2xl font-bold">{userStats.tournamentsWon}</p>
            </div>
            <Target className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Win Streak</p>
              <p className="text-2xl font-bold">{userStats.currentStreak}</p>
            </div>
            <Zap className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={onJoinBattle}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg p-4 hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
              >
                <Sword className="w-5 h-5" />
                <span className="font-medium">Quick Battle</span>
              </button>
              
              <button
                onClick={onViewTeams}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Join Team</span>
              </button>
            </div>
          </div>

          {/* Active Battle */}
          {activeBattles.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Battle</h3>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-gray-900 mb-2">{activeBattles[0].title}</h4>
                <div className="space-y-2">
                  {activeBattles[0].participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{participant.avatar}</span>
                        <span className="text-sm font-medium">{participant.name}</span>
                        {participant.isBot && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">BOT</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{participant.score}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 bg-red-500 text-white rounded-lg py-2 hover:bg-red-600 transition-colors">
                  Continue Battle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Tournaments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Tournaments</h3>
            <div className="space-y-4">
              {upcomingTournaments.map((tournament) => (
                <div key={tournament.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{tournament.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{tournament.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{tournament.subject}</span>
                        <span className="capitalize">{tournament.difficulty}</span>
                        <span>{tournament.startTime.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {tournament.rewards[0]?.value} {tournament.rewards[0]?.type}
                      </div>
                      <div className="text-xs text-gray-500">Entry: {tournament.entryFee} coins</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinTournament(tournament.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg py-2 hover:opacity-90 transition-opacity"
                  >
                    Join Tournament
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Top Teams */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Teams</h3>
            <div className="space-y-3">
              {teams.slice(0, 3).map((team, index) => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{team.badge}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{team.name}</h4>
                      <p className="text-sm text-gray-600">{team.members.length} members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{team.totalPoints.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h4 className="font-medium text-gray-900 mb-1">{achievement.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    +{achievement.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDashboard;