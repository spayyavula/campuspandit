import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Plus, Edit2, Trash2, Play, BarChart3, Home, BookOpen,
  ChevronLeft, ChevronRight, RotateCw, Check, XIcon, Star, Award,
  Brain, Target, TrendingUp, Calendar, Clock, Zap
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import {
  flashcardDeckAPI,
  flashcardAPI,
  flashcardStatsAPI,
  Flashcard,
  FlashcardDeck,
  FlashcardStats
} from '../../utils/flashcardAPI';
import { Button, Card } from '../ui';

interface FlashcardManagerProps {
  studentId: string;
}

type ViewMode = 'decks' | 'cards' | 'study' | 'stats' | 'create-deck' | 'create-card';

const FlashcardManager: React.FC<FlashcardManagerProps> = ({ studentId }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('decks');
  const [loading, setLoading] = useState(true);

  // Data
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<FlashcardStats | null>(null);

  // Study mode
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyResults, setStudyResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  // Form state
  const [deckForm, setDeckForm] = useState({ name: '', description: '', subject: '', color: '#3B82F6' });
  const [cardForm, setCardForm] = useState({ front: '', back: '', subject: '', difficulty: 'medium' as const });

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [decksData, statsData] = await Promise.all([
        flashcardDeckAPI.getDecks(studentId),
        flashcardStatsAPI.getStats(studentId)
      ]);
      setDecks(decksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading flashcard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeckCards = async (deckId: string) => {
    try {
      const cardsData = await flashcardAPI.getCards(deckId);
      setCards(cardsData);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleCreateDeck = async () => {
    if (!deckForm.name.trim()) return;

    try {
      await flashcardDeckAPI.createDeck({
        user_id: studentId,
        ...deckForm
      });
      await loadData();
      setViewMode('decks');
      setDeckForm({ name: '', description: '', subject: '', color: '#3B82F6' });
    } catch (error) {
      console.error('Error creating deck:', error);
    }
  };

  const handleCreateCard = async () => {
    if (!cardForm.front.trim() || !cardForm.back.trim() || !selectedDeck) return;

    try {
      await flashcardAPI.createCard({
        user_id: studentId,
        deck_id: selectedDeck.id,
        ...cardForm
      });
      await loadDeckCards(selectedDeck.id!);
      setViewMode('cards');
      setCardForm({ front: '', back: '', subject: '', difficulty: 'medium' });
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) return;

    try {
      await flashcardDeckAPI.deleteDeck(deckId);
      await loadData();
    } catch (error) {
      console.error('Error deleting deck:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;

    try {
      await flashcardAPI.deleteCard(cardId);
      if (selectedDeck) {
        await loadDeckCards(selectedDeck.id!);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const startStudySession = async (deck: FlashcardDeck) => {
    try {
      const deckCards = await flashcardAPI.getCards(deck.id);
      if (deckCards.length === 0) {
        alert('This deck has no cards yet!');
        return;
      }
      // Shuffle cards
      const shuffled = [...deckCards].sort(() => Math.random() - 0.5);
      setStudyCards(shuffled);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setStudyResults({ correct: 0, incorrect: 0 });
      setSelectedDeck(deck);
      setViewMode('study');
    } catch (error) {
      console.error('Error starting study session:', error);
    }
  };

  const handleCardReview = async (correct: boolean) => {
    const currentCard = studyCards[currentCardIndex];

    try {
      await flashcardAPI.reviewCard(currentCard.id!, correct);

      setStudyResults(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1)
      }));

      // Move to next card
      if (currentCardIndex < studyCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Study session complete
        alert(`Study session complete!\nCorrect: ${studyResults.correct + (correct ? 1 : 0)}\nIncorrect: ${studyResults.incorrect + (correct ? 0 : 1)}`);
        setViewMode('decks');
        await loadData();
      }
    } catch (error) {
      console.error('Error reviewing card:', error);
    }
  };

  const getMasteryColor = (level: number) => {
    if (level >= 75) return 'bg-green-500';
    if (level >= 50) return 'bg-blue-500';
    if (level >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (level: number) => {
    if (level >= 75) return 'Mastered';
    if (level >= 50) return 'Advanced';
    if (level >= 25) return 'Intermediate';
    return 'Beginner';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Desktop/Tablet Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm hidden lg:block">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/coach')}
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Coach
          </Button>
        </div>
      </div>

      {/* Mobile Header (Simple) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/coach')}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setViewMode('decks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'decks' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">My Decks</span>
            </button>

            <button
              onClick={() => setViewMode('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'stats' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Statistics</span>
            </button>

            <button
              onClick={() => setViewMode('create-deck')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'create-deck' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Deck</span>
            </button>

            {selectedDeck && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Current Deck</p>
                </div>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    viewMode === 'cards' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium truncate">{selectedDeck.name}</span>
                </button>
                <button
                  onClick={() => setViewMode('create-card')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    viewMode === 'create-card' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Card</span>
                </button>
              </>
            )}
          </nav>

          {/* Stats Summary in Desktop Sidebar */}
          {stats && (
            <div className="p-4 border-t border-gray-200 mt-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Cards</span>
                  <span className="font-bold text-gray-900">{stats.totalCards}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Decks</span>
                  <span className="font-bold text-gray-900">{stats.totalDecks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg Accuracy</span>
                  <span className="font-bold text-primary-600">{stats.averageAccuracy.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            <button
              onClick={() => setViewMode('decks')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'decks' ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Decks</span>
            </button>

            <button
              onClick={() => setViewMode('create-deck')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'create-deck' ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-medium">New</span>
            </button>

            <button
              onClick={() => setViewMode('stats')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'stats' ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-medium">Stats</span>
            </button>

            <button
              onClick={() => {
                if (selectedDeck) {
                  setViewMode('cards');
                } else {
                  alert('Please select a deck first');
                }
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'cards' || viewMode === 'create-card' ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
              }`}
            >
              <Edit2 className="w-5 h-5" />
              <span className="text-xs font-medium">Cards</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-primary-600 animate-pulse" />
                <p className="text-gray-600">Loading flashcards...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Decks View */}
              {viewMode === 'decks' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Decks</h2>
                    <Button
                      variant="primary"
                      onClick={() => setViewMode('create-deck')}
                      className="hidden sm:flex"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Deck
                    </Button>
                  </div>

                  {decks.length === 0 ? (
                    <Card className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Decks Yet</h3>
                      <p className="text-gray-600 mb-4">Create your first flashcard deck to get started!</p>
                      <Button variant="primary" onClick={() => setViewMode('create-deck')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Deck
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {decks.map((deck) => (
                        <Card key={deck.id} className="hover:shadow-lg transition-shadow">
                          <div
                            className="h-2 rounded-t-lg"
                            style={{ backgroundColor: deck.color || '#3B82F6' }}
                          />
                          <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{deck.name}</h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deck.description}</p>

                            <div className="flex items-center gap-2 mb-4">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {deck.subject || 'General'}
                              </span>
                              <span className="text-sm text-gray-600">
                                {deck.card_count || 0} cards
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => startStudySession(deck)}
                                className="flex-1"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Study
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDeck(deck);
                                  loadDeckCards(deck.id!);
                                  setViewMode('cards');
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDeck(deck.id!)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cards View */}
              {viewMode === 'cards' && selectedDeck && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setViewMode('decks');
                        setSelectedDeck(null);
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDeck.name}</h2>
                  </div>

                  <div className="mb-6 flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => startStudySession(selectedDeck)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Study Session
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('create-card')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Card
                    </Button>
                  </div>

                  {cards.length === 0 ? (
                    <Card className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cards Yet</h3>
                      <p className="text-gray-600 mb-4">Add your first flashcard to this deck!</p>
                      <Button variant="primary" onClick={() => setViewMode('create-card')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Card
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cards.map((card) => (
                        <Card key={card.id} className="hover:shadow-lg transition-shadow">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                card.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {card.difficulty}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${getMasteryColor(card.mastery_level || 0)}`} />
                                  <span className="text-xs text-gray-600">{getMasteryLabel(card.mastery_level || 0)}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCard(card.id!)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-xs text-gray-500 mb-1">Front:</p>
                              <p className="text-sm font-medium text-gray-900 mb-3">{card.front}</p>
                              <p className="text-xs text-gray-500 mb-1">Back:</p>
                              <p className="text-sm text-gray-700">{card.back}</p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Reviewed: {card.times_reviewed || 0}×</span>
                              <span>Accuracy: {card.times_reviewed ? Math.round((card.times_correct! / card.times_reviewed) * 100) : 0}%</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Study Mode */}
              {viewMode === 'study' && studyCards.length > 0 && (
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">Study Session</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Exit study session?')) {
                            setViewMode('decks');
                          }
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Exit
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Card {currentCardIndex + 1} of {studyCards.length}
                      </span>
                      <span className="text-green-600">
                        ✓ {studyResults.correct}
                      </span>
                      <span className="text-red-600">
                        ✗ {studyResults.incorrect}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 rounded-full h-2 transition-all"
                        style={{ width: `${((currentCardIndex + 1) / studyCards.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={`relative w-full aspect-[3/2] cursor-pointer perspective-1000`}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div
                      className={`absolute inset-0 transition-transform duration-500 preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Front */}
                      <Card
                        className="absolute inset-0 backface-hidden flex items-center justify-center p-8 bg-white border-4 border-primary-200"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-4">FRONT</p>
                          <p className="text-xl font-medium text-gray-900">
                            {studyCards[currentCardIndex].front}
                          </p>
                          <p className="text-sm text-gray-500 mt-6">Click to flip</p>
                        </div>
                      </Card>

                      {/* Back */}
                      <Card
                        className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center p-8 bg-primary-50 border-4 border-primary-300"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <div className="text-center">
                          <p className="text-xs text-primary-600 mb-4">BACK</p>
                          <p className="text-lg text-gray-900">
                            {studyCards[currentCardIndex].back}
                          </p>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {isFlipped && (
                    <div className="mt-6 flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleCardReview(false)}
                      >
                        <XIcon className="w-5 h-5 mr-2" />
                        Incorrect
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleCardReview(true)}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Correct
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Statistics View */}
              {viewMode === 'stats' && stats && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistics</h2>

                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Cards</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.totalCards}</p>
                        </div>
                        <BookOpen className="w-10 h-10 text-primary-600 opacity-20" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Decks</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.totalDecks}</p>
                        </div>
                        <Target className="w-10 h-10 text-blue-600 opacity-20" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Avg Accuracy</p>
                          <p className="text-3xl font-bold text-green-600">{stats.averageAccuracy.toFixed(0)}%</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Study Streak</p>
                          <p className="text-3xl font-bold text-orange-600">{stats.studyStreak} days</p>
                        </div>
                        <Zap className="w-10 h-10 text-orange-600 opacity-20" />
                      </div>
                    </Card>
                  </div>

                  {/* Mastery Distribution */}
                  <Card className="p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Mastery Distribution</h3>
                    <div className="space-y-4">
                      {Object.entries(stats.masteryDistribution).map(([level, count]) => (
                        <div key={level}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="capitalize font-medium text-gray-700">{level}</span>
                            <span className="text-gray-600">{count} cards</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                level === 'mastered' ? 'bg-green-500' :
                                level === 'advanced' ? 'bg-blue-500' :
                                level === 'intermediate' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${(count / stats.totalCards) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Weekly Progress */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Cards Reviewed</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.cardsReviewedThisWeek}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Study Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalReviewSessions}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Create Deck Form */}
              {viewMode === 'create-deck' && (
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Deck</h2>
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deck Name *
                        </label>
                        <input
                          type="text"
                          value={deckForm.name}
                          onChange={(e) => setDeckForm({ ...deckForm, name: e.target.value })}
                          placeholder="e.g., Physics - Mechanics"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={deckForm.description}
                          onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                          placeholder="What topics does this deck cover?"
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={deckForm.subject}
                          onChange={(e) => setDeckForm({ ...deckForm, subject: e.target.value })}
                          placeholder="e.g., Physics, Chemistry, Math"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <div className="flex gap-2">
                          {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                            <button
                              key={color}
                              onClick={() => setDeckForm({ ...deckForm, color })}
                              className={`w-10 h-10 rounded-lg transition-transform ${
                                deckForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="primary"
                          onClick={handleCreateDeck}
                          disabled={!deckForm.name.trim()}
                          className="flex-1"
                        >
                          Create Deck
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setViewMode('decks');
                            setDeckForm({ name: '', description: '', subject: '', color: '#3B82F6' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Create Card Form */}
              {viewMode === 'create-card' && selectedDeck && (
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Card to {selectedDeck.name}</h2>
                  <p className="text-gray-600 mb-6">Create a new flashcard for this deck</p>
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Front (Question) *
                        </label>
                        <textarea
                          value={cardForm.front}
                          onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                          placeholder="What do you want to remember?"
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Back (Answer) *
                        </label>
                        <textarea
                          value={cardForm.back}
                          onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                          placeholder="The answer or explanation"
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={cardForm.subject}
                            onChange={(e) => setCardForm({ ...cardForm, subject: e.target.value })}
                            placeholder="e.g., Physics"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty
                          </label>
                          <select
                            value={cardForm.difficulty}
                            onChange={(e) => setCardForm({ ...cardForm, difficulty: e.target.value as any })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="primary"
                          onClick={handleCreateCard}
                          disabled={!cardForm.front.trim() || !cardForm.back.trim()}
                          className="flex-1"
                        >
                          Add Card
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setViewMode('cards');
                            setCardForm({ front: '', back: '', subject: '', difficulty: 'medium' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default FlashcardManager;
