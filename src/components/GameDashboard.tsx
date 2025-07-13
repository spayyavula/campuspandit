import React, { useState, useEffect } from 'react';
import { Trophy, Users, Zap, Target, Crown, Sword, Star, Flame, Award, Play, Clock, Medal } from 'lucide-react';
import { teams, tournaments, achievements, activeBattles } from '../data/gameData';

interface GameDashboardProps {
  onViewChange: (view: string) => void;
}

const GameDashboard: React.FC<GameDashboardProps> = ({ onViewChange }) => {
  const [liveLeaderboard, setLiveLeaderboard] = useState([
    { id: 1, name: 'You', avatar: '👨‍🎓', score: 1850, streak: 7, isBot: false, status: 'online', change: '+50' },
    { id: 2, name: 'Einstein Bot', avatar: '🧠', score: 2100, streak: 12, isBot: true, status: 'active', change: '+25' },
    { id: 3, name: 'Newton Bot', avatar: '🍎', score: 1950, streak: 8, isBot: true, status: 'active', change: '+15' },
    { id: 4, name: 'Sarah Chen', avatar: '👩‍🔬', score: 1820, streak: 5, isBot: false, status: 'online', change: '+30' },
    { id: 5, name: 'Curie Bot', avatar: '⚛️', score: 1780, streak: 6, isBot: true, status: 'active', change: '+20' },
    { id: 6, name: 'Mike Rodriguez', avatar: '👨‍💻', score: 1650, streak: 3, isBot: false, status: 'away', change: '+10' },
  ]);

  const [activePlayers, setActivePlayers] = useState([
    { id: 1, name: 'You', avatar: '👨‍🎓', currentQuestion: 3, score: 150, timeLeft: 25, isBot: false },
    { id: 2, name: 'Einstein Bot', avatar: '🧠', currentQuestion: 3, score: 140, timeLeft: 28, isBot: true },
    { id: 3, name: 'Newton Bot', avatar: '🍎', currentQuestion: 2, score: 120, timeLeft: 15, isBot: true },
    { id: 4, name: 'Sarah Chen', avatar: '👩‍🔬', currentQuestion: 3, score: 135, timeLeft: 20, isBot: false },
  ]);

  const [recentScores, setRecentScores] = useState([
    { player: 'You', points: '+50', subject: 'Physics', time: 'Just now', type: 'correct' },
    { player: 'Einstein Bot', points: '+25', subject: 'Math', time: '2s ago', type: 'correct' },
    { player: 'Sarah Chen', points: '+30', subject: 'Chemistry', time: '5s ago', type: 'correct' },
    { player: 'Newton Bot', points: '+15', subject: 'Physics', time: '8s ago', type: 'partial' },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update scores randomly
      setLiveLeaderboard(prev => prev.map(player => ({
        ...player,
        score: player.score + Math.floor(Math.random() * 10),
        change: `+${Math.floor(Math.random() * 20) + 5}`
      })).sort((a, b) => b.score - a.score));

      // Update active players
      setActivePlayers(prev => prev.map(player => ({
        ...player,
        timeLeft: Math.max(0, player.timeLeft - 1),
        score: player.score + (Math.random() > 0.7 ? Math.floor(Math.random() * 25) + 5 : 0)
      })));

      // Add new recent scores
      if (Math.random() > 0.8) {
        const players = ['You', 'Einstein Bot', 'Sarah Chen', 'Newton Bot'];
        const subjects = ['Physics', 'Math', 'Chemistry'];
        const points = ['+15', '+25', '+30', '+50'];
        
        setRecentScores(prev => [
          {
            player: players[Math.floor(Math.random() * players.length)],
            points: points[Math.floor(Math.random() * points.length)],
            subject: subjects[Math.floor(Math.random() * subjects.length)],
            time: 'Just now',
            type: Math.random() > 0.3 ? 'correct' : 'partial'
          },
          ...prev.slice(0, 3)
        ]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const userStats = {
    totalPoints: 1850,
    rank: 15,
    battlesWon: 23,
    tournamentsWon: 3,
    currentStreak: 7
  };

  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming').slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg relative">
            <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold transform rotate-12 shadow-lg">
              FREE ACCESS
            </div>
            <Sword className="w-8 h-8 text-white" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <Crown className="w-3 h-3 text-yellow-800" />
            </div>
          </div>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
          Gaming Arena
        </h2>
        <p className="text-gray-600 text-lg">Live competitive learning with real-time scoring!</p>
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

      {/* Live Gaming Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Live Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Live Leaderboard</h3>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">LIVE</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-2">
              {liveLeaderboard.map((player, index) => (
                <div key={player.id} className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  player.name === 'You' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-2xl">{player.avatar}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${player.name === 'You' ? 'text-blue-600' : 'text-gray-900'}`}>
                          {player.name}
                        </span>
                        {player.isBot && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">BOT</span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                          player.status === 'online' ? 'bg-green-500' :
                          player.status === 'active' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Flame className="w-3 h-3" />
                        <span>{player.streak} streak</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{player.score.toLocaleString()}</div>
                    <div className="text-xs text-green-600 font-medium">{player.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Players Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Active Battle</h3>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Question 3/10</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {activePlayers.map((player) => (
                <div key={player.id} className={`p-3 rounded-xl border-2 transition-all ${
                  player.name === 'You' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{player.avatar}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${player.name === 'You' ? 'text-red-600' : 'text-gray-900'}`}>
                            {player.name}
                          </span>
                          {player.isBot && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">BOT</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Question {player.currentQuestion}/10</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{player.score}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            player.timeLeft > 15 ? 'bg-green-500' :
                            player.timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(player.timeLeft / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${
                      player.timeLeft > 15 ? 'text-green-600' :
                      player.timeLeft > 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {player.timeLeft}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => onViewChange('battle')}
              className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl py-3 hover:opacity-90 transition-opacity font-medium shadow-lg flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Join Battle</span>
              <span className="text-lg">⚔️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Scores Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Scores Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Live Score Feed</h3>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">UPDATING</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {recentScores.map((score, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  score.type === 'correct' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      score.type === 'correct' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {score.type === 'correct' ? '✓' : '½'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{score.player}</div>
                      <div className="text-xs text-gray-500">{score.subject} • {score.time}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    score.type === 'correct' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {score.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Tournaments */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => onViewChange('battle')}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-4 hover:opacity-90 transition-opacity flex items-center justify-center space-x-3 shadow-lg"
              >
                <Sword className="w-5 h-5" />
                <span className="font-medium">Quick Battle</span>
                <span className="text-lg">⚔️</span>
              </button>
              
              <button
                onClick={() => onViewChange('teams')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 hover:opacity-90 transition-opacity flex items-center justify-center space-x-3 shadow-lg"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Join Team</span>
                <span className="text-lg">👥</span>
              </button>
            </div>
          </div>

          {/* Upcoming Tournaments */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Tournaments</h3>
            </div>
            <div className="space-y-3">
              {upcomingTournaments.map((tournament) => (
                <div key={tournament.id} className="border-2 border-gray-200 rounded-xl p-3 hover:border-blue-300 transition-colors">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{tournament.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>🏆 {tournament.rewards[0]?.value} pts</span>
                    <span>💰 {tournament.entryFee} coins</span>
                  </div>
                  <button
                    onClick={() => onViewChange('tournament')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg py-2 text-sm hover:opacity-90 transition-opacity"
                  >
                    Join Now 🚀
                  </button>
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