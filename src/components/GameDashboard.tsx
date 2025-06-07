import React from 'react';
import { Trophy, Users, Zap, Target, Crown, Sword, Star, Flame, Award } from 'lucide-react';
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
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg relative">
            <Sword className="w-8 h-8 text-white" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Crown className="w-3 h-3 text-yellow-800" />
            </div>
          </div>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
          Gaming Arena
        </h2>
        <p className="text-gray-600 text-lg">Compete, learn, and climb the leaderboards!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Total Points</p>
              <p className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="relative">
              <Crown className="w-8 h-8 opacity-80" />
              <div className="absolute -top-1 -right-1 text-lg">👑</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Global Rank</p>
              <p className="text-2xl font-bold">#{userStats.rank}</p>
            </div>
            <div className="relative">
              <Trophy className="w-8 h-8 opacity-80" />
              <div className="absolute -top-1 -right-1 text-lg">🏆</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Battles Won</p>
              <p className="text-2xl font-bold">{userStats.battlesWon}</p>
            </div>
            <div className="relative">
              <Sword className="w-8 h-8 opacity-80" />
              <div className="absolute -top-1 -right-1 text-lg">⚔️</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Tournaments</p>
              <p className="text-2xl font-bold">{userStats.tournamentsWon}</p>
            </div>
            <div className="relative">
              <Target className="w-8 h-8 opacity-80" />
              <div className="absolute -top-1 -right-1 text-lg">🎯</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Win Streak</p>
              <p className="text-2xl font-bold">{userStats.currentStreak}</p>
            </div>
            <div className="relative">
              <Zap className="w-8 h-8 opacity-80" />
              <div className="absolute -top-1 -right-1 text-lg">🔥</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={onJoinBattle}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-4 hover:opacity-90 transition-opacity flex items-center justify-center space-x-3 shadow-lg"
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Sword className="w-4 h-4" />
                </div>
                <span className="font-medium">Quick Battle</span>
                <span className="text-lg">⚔️</span>
              </button>
              
              <button
                onClick={onViewTeams}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 hover:opacity-90 transition-opacity flex items-center justify-center space-x-3 shadow-lg"
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-medium">Join Team</span>
                <span className="text-lg">👥</span>
              </button>
            </div>
          </div>

          {/* Active Battle */}
          {activeBattles.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Active Battle</h3>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="text-lg mr-2">⚔️</span>
                  {activeBattles[0].title}
                </h4>
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
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{participant.score}</span>
                        <Star className="w-3 h-3 text-yellow-500" />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl py-3 hover:opacity-90 transition-opacity font-medium shadow-lg">
                  Continue Battle ⚔️
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Tournaments */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Upcoming Tournaments</h3>
                <p className="text-gray-600 text-sm">Join competitive events and win rewards</p>
              </div>
            </div>
            <div className="space-y-4">
              {upcomingTournaments.map((tournament) => (
                <div key={tournament.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          {tournament.title}
                          <span className="ml-2 text-lg">🏆</span>
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{tournament.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="capitalize flex items-center">
                            <span className="mr-1">📚</span>
                            {tournament.subject}
                          </span>
                          <span className="capitalize flex items-center">
                            <span className="mr-1">⭐</span>
                            {tournament.difficulty}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">📅</span>
                            {tournament.startTime.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                        <span className="mr-1">🎁</span>
                        {tournament.rewards[0]?.value} {tournament.rewards[0]?.type}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className="mr-1">💰</span>
                        Entry: {tournament.entryFee} coins
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinTournament(tournament.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-3 hover:opacity-90 transition-opacity font-medium shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>Join Tournament</span>
                    <span className="text-lg">🚀</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Top Teams */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Top Teams</h3>
                <p className="text-gray-600 text-sm">Leading teams in the leaderboard</p>
              </div>
            </div>
            <div className="space-y-3">
              {teams.slice(0, 3).map((team, index) => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                    <div className="text-2xl">{team.badge}</div>
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        {team.name}
                        {index === 0 && <span className="ml-2 text-lg">👑</span>}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {team.members.length} members
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 flex items-center">
                      {team.totalPoints.toLocaleString()}
                      <Star className="w-4 h-4 ml-1 text-yellow-500" />
                    </div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Recent Achievements</h3>
                <p className="text-gray-600 text-sm">Your latest accomplishments</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 hover:border-yellow-300 transition-colors">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h4 className="font-medium text-gray-900 mb-1">{achievement.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                  <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                    <Star className="w-3 h-3 mr-1" />
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