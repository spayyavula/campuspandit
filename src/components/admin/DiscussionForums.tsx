import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Filter, Edit, Trash2, Eye, Pin, Flag, CheckCircle, XCircle, Plus, ArrowUp, ArrowDown, MessageCircle, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: 'student' | 'teacher' | 'admin';
  };
  course?: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
  replies: number;
  views: number;
  isPinned: boolean;
  isClosed: boolean;
  tags: string[];
  lastReply?: {
    author: {
      id: string;
      name: string;
    };
    createdAt: string;
  };
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: 'student' | 'teacher' | 'admin';
  };
  createdAt: string;
  updatedAt: string;
  isAnswer: boolean;
  likes: number;
  topicId: string;
}

const DiscussionForums: React.FC = () => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    course: '',
    tag: '',
    status: ''
  });
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [showTopicDetails, setShowTopicDetails] = useState(false);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyContent, setReplyContent] = useState('');

  // Sample forum data
  const sampleTopics: ForumTopic[] = [
    {
      id: '1',
      title: 'Understanding Quantum Entanglement',
      content: `# Quantum Entanglement Question

I'm having trouble understanding quantum entanglement. The textbook says that when two particles are entangled, measuring one instantly affects the other, regardless of distance. How does this not violate the speed of light limit?

Can someone explain this in simpler terms? Are there any good analogies that might help?

Thanks in advance!`,
      author: {
        id: '1',
        name: 'Alex Johnson',
        role: 'student'
      },
      course: {
        id: '1',
        title: 'Advanced Physics'
      },
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-20T14:45:00Z',
      replies: 8,
      views: 124,
      isPinned: true,
      isClosed: false,
      tags: ['quantum physics', 'entanglement', 'theory'],
      lastReply: {
        author: {
          id: '2',
          name: 'Dr. Robert Chen'
        },
        createdAt: '2025-01-20T14:45:00Z'
      }
    },
    {
      id: '2',
      title: 'Help with Organic Chemistry Reaction Mechanisms',
      content: `I'm struggling with understanding the mechanism for nucleophilic substitution reactions (SN1 vs SN2). 

Can someone explain:
1. The key differences between SN1 and SN2?
2. How to identify which mechanism a reaction will follow?
3. The role of the solvent in these reactions?

I've attached my attempt at drawing the mechanisms, but I'm not sure if they're correct.`,
      author: {
        id: '2',
        name: 'Priya Sharma',
        role: 'student'
      },
      course: {
        id: '2',
        title: 'Organic Chemistry'
      },
      createdAt: '2025-01-18T09:15:00Z',
      updatedAt: '2025-01-19T16:20:00Z',
      replies: 5,
      views: 87,
      isPinned: false,
      isClosed: false,
      tags: ['organic chemistry', 'reaction mechanisms', 'SN1', 'SN2'],
      lastReply: {
        author: {
          id: '3',
          name: 'Prof. Anita Sharma'
        },
        createdAt: '2025-01-19T16:20:00Z'
      }
    },
    {
      id: '3',
      title: 'Integration Techniques for JEE Advanced',
      content: `I'm preparing for JEE Advanced and finding it difficult to solve complex integration problems. 

I understand the basic techniques like substitution and integration by parts, but struggle with:
- Trigonometric substitutions
- Partial fractions
- Improper integrals

Could someone share some strategies or practice problems that would help? Also, are there any specific patterns I should look for when deciding which technique to use?`,
      author: {
        id: '3',
        name: 'Raj Patel',
        role: 'student'
      },
      course: {
        id: '3',
        title: 'Calculus for JEE'
      },
      createdAt: '2025-01-17T11:45:00Z',
      updatedAt: '2025-01-18T13:10:00Z',
      replies: 3,
      views: 65,
      isPinned: false,
      isClosed: false,
      tags: ['calculus', 'integration', 'JEE Advanced'],
      lastReply: {
        author: {
          id: '4',
          name: 'Dr. James Wilson'
        },
        createdAt: '2025-01-18T13:10:00Z'
      }
    },
    {
      id: '4',
      title: 'Cell Division Process Animation Resources',
      content: `Hello everyone,

I'm looking for good animation resources that explain the cell division process (both mitosis and meiosis) in detail. Our textbook has static images, but I find it difficult to visualize the dynamic process.

Has anyone found any helpful videos or interactive simulations that clearly show each phase? Ideally, I'd like something that compares mitosis and meiosis side by side.

Thank you!`,
      author: {
        id: '4',
        name: 'Sarah Williams',
        role: 'student'
      },
      course: {
        id: '4',
        title: 'Biology: Human Physiology'
      },
      createdAt: '2025-01-16T14:20:00Z',
      updatedAt: '2025-01-17T10:05:00Z',
      replies: 6,
      views: 92,
      isPinned: false,
      isClosed: true,
      tags: ['biology', 'cell division', 'resources'],
      lastReply: {
        author: {
          id: '5',
          name: 'Dr. Priya Patel'
        },
        createdAt: '2025-01-17T10:05:00Z'
      }
    },
    {
      id: '5',
      title: 'Coordinate Geometry Problem Set Solutions',
      content: `I've been working through the coordinate geometry problem set from last week, but I'm stuck on problems 7, 12, and 15.

For problem 7 (finding the equation of a circle passing through three points), I've tried using the general form and solving the system of equations, but I'm getting inconsistent results.

Could someone please share their approach or solution? I want to understand where I'm going wrong.`,
      author: {
        id: '5',
        name: 'Michael Chen',
        role: 'student'
      },
      course: {
        id: '5',
        title: 'Algebra and Coordinate Geometry'
      },
      createdAt: '2025-01-15T16:30:00Z',
      updatedAt: '2025-01-16T09:45:00Z',
      replies: 4,
      views: 78,
      isPinned: false,
      isClosed: false,
      tags: ['coordinate geometry', 'circles', 'problem solving'],
      lastReply: {
        author: {
          id: '6',
          name: 'Prof. Michael Lee'
        },
        createdAt: '2025-01-16T09:45:00Z'
      }
    }
  ];

  const sampleReplies: ForumReply[] = [
    {
      id: '1',
      content: `Great question about quantum entanglement! This is indeed one of the most counterintuitive aspects of quantum mechanics.

To address your concern about violating the speed of light: Quantum entanglement doesn't actually allow for faster-than-light communication or information transfer, despite how it might initially appear.

Here's a simpler way to think about it:

1. When two particles are entangled, they're essentially part of a single quantum system
2. Their properties are correlated, but indeterminate until measured
3. When you measure one particle, you're not changing the other particle - you're just learning information about the entire system

A helpful analogy might be to imagine two sealed envelopes sent to opposite sides of the galaxy. Each contains either a red or blue card, and they're perfectly anti-correlated (if one is red, the other is blue). When you open your envelope, you instantly know what's in the other envelope, but no information has traveled faster than light.

The key difference in quantum mechanics is that the "color" isn't determined until you open the envelope!

I recommend checking out the double-slit experiment videos in the course resources section for more on quantum weirdness.`,
      author: {
        id: '2',
        name: 'Dr. Robert Chen',
        role: 'teacher'
      },
      createdAt: '2025-01-15T11:45:00Z',
      updatedAt: '2025-01-15T11:45:00Z',
      isAnswer: true,
      likes: 15,
      topicId: '1'
    },
    {
      id: '2',
      content: `I was confused about this too! Dr. Chen's explanation helped, but I still have a question:

If measuring one particle doesn't actually "change" the other particle, why do physicists say that quantum entanglement is "spooky action at a distance" (Einstein's words)?

Is it just because it seems weird to us based on our everyday experience?`,
      author: {
        id: '6',
        name: 'Emma Wilson',
        role: 'student'
      },
      createdAt: '2025-01-16T09:30:00Z',
      updatedAt: '2025-01-16T09:30:00Z',
      isAnswer: false,
      likes: 3,
      topicId: '1'
    },
    {
      id: '3',
      content: `@Emma - Great follow-up question!

Einstein called it "spooky action at a distance" precisely because it seemed to violate his intuition about locality - the idea that objects are only directly influenced by their immediate surroundings.

The "spookiness" comes from the fact that quantum mechanics predicts stronger correlations between entangled particles than would be possible if the particles had definite properties before measurement (this is proven by Bell's Theorem).

So while no information travels faster than light, the nature of reality at the quantum level appears to be fundamentally non-local in a way that defies our classical intuition.

This is why many physicists say "if you think you understand quantum mechanics, you don't understand quantum mechanics"!`,
      author: {
        id: '2',
        name: 'Dr. Robert Chen',
        role: 'teacher'
      },
      createdAt: '2025-01-16T10:15:00Z',
      updatedAt: '2025-01-16T10:15:00Z',
      isAnswer: false,
      likes: 8,
      topicId: '1'
    },
    {
      id: '4',
      content: `I found a great video that helped me visualize this concept: [Quantum Entanglement Explained](https://www.youtube.com/watch?v=z1GCnycbMeA)

The visual explanations really helped me grasp the concept better than just reading about it.`,
      author: {
        id: '7',
        name: 'David Kim',
        role: 'student'
      },
      createdAt: '2025-01-17T14:20:00Z',
      updatedAt: '2025-01-17T14:20:00Z',
      isAnswer: false,
      likes: 5,
      topicId: '1'
    },
    {
      id: '5',
      content: `One thing that helped me understand entanglement better was learning about quantum computing. In quantum computers, entanglement is actually a resource that allows for certain computations to be performed more efficiently than on classical computers.

So while it seems strange from our everyday perspective, entanglement is a real phenomenon with practical applications!`,
      author: {
        id: '8',
        name: 'Lisa Zhang',
        role: 'student'
      },
      createdAt: '2025-01-18T16:40:00Z',
      updatedAt: '2025-01-18T16:40:00Z',
      isAnswer: false,
      likes: 4,
      topicId: '1'
    },
    {
      id: '6',
      content: `To add to the excellent explanations above, I'd like to address a common misconception:

Entanglement doesn't mean the particles are somehow "communicating" instantaneously. Instead, their quantum states were never truly separate to begin with.

Think of it this way: When we describe two entangled particles, we're not describing two separate entities with their own individual quantum states. We're describing a single quantum system that happens to be spatially separated.

This is why measuring one part of the system reveals information about another part instantly - they're aspects of the same thing!`,
      author: {
        id: '9',
        name: 'Prof. Alan Thompson',
        role: 'teacher'
      },
      createdAt: '2025-01-19T11:25:00Z',
      updatedAt: '2025-01-19T11:25:00Z',
      isAnswer: false,
      likes: 12,
      topicId: '1'
    },
    {
      id: '7',
      content: `Thank you all for the amazing explanations! I think I understand it much better now.

So to summarize:
1. Entangled particles are part of a single quantum system
2. No information actually travels faster than light
3. The "spookiness" comes from the fact that quantum mechanics defies our classical intuition about locality
4. Bell's Theorem proves that these correlations can't be explained by hidden variables

I'll check out that video and the double-slit experiment resources. This has been really helpful!`,
      author: {
        id: '1',
        name: 'Alex Johnson',
        role: 'student'
      },
      createdAt: '2025-01-20T09:10:00Z',
      updatedAt: '2025-01-20T09:10:00Z',
      isAnswer: false,
      likes: 7,
      topicId: '1'
    },
    {
      id: '8',
      content: `@Alex - That's a perfect summary! I'm glad we could help clarify this concept.

For anyone else reading this thread who wants to dive deeper, I've added some additional resources to the "Quantum Mechanics: Advanced Concepts" section of our course materials, including:

1. A simulation where you can "perform" entanglement experiments
2. A more mathematical explanation of Bell's Inequality
3. A reading on the philosophical implications of quantum non-locality

Feel free to book office hours if you'd like to discuss further!`,
      author: {
        id: '2',
        name: 'Dr. Robert Chen',
        role: 'teacher'
      },
      createdAt: '2025-01-20T14:45:00Z',
      updatedAt: '2025-01-20T14:45:00Z',
      isAnswer: false,
      likes: 9,
      topicId: '1'
    }
  ];

  useEffect(() => {
    // In a real app, fetch topics from Supabase
    // For now, use sample data
    setTopics(sampleTopics);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      // In a real app, fetch replies for the selected topic
      // For now, filter sample replies
      setReplies(sampleReplies.filter(reply => reply.topicId === selectedTopic.id));
    }
  }, [selectedTopic]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedTopics = topics
    .filter(topic => {
      const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           topic.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCourse = !filters.course || (topic.course && topic.course.id === filters.course);
      const matchesTag = !filters.tag || topic.tags.includes(filters.tag);
      const matchesStatus = !filters.status || 
                           (filters.status === 'pinned' && topic.isPinned) ||
                           (filters.status === 'closed' && topic.isClosed) ||
                           (filters.status === 'open' && !topic.isClosed);
      
      return matchesSearch && matchesCourse && matchesTag && matchesStatus;
    })
    .sort((a, b) => {
      // Always put pinned topics at the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const fieldA = a[sortField as keyof ForumTopic];
      const fieldB = b[sortField as keyof ForumTopic];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' 
          ? fieldA - fieldB 
          : fieldB - fieldA;
      }
      
      if (typeof fieldA === 'boolean' && typeof fieldB === 'boolean') {
        return sortDirection === 'asc' 
          ? (fieldA === fieldB ? 0 : fieldA ? 1 : -1)
          : (fieldA === fieldB ? 0 : fieldA ? -1 : 1);
      }
      
      return 0;
    });

  const handleViewTopic = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setShowTopicDetails(true);
  };

  const handleTogglePin = (topicId: string) => {
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, isPinned: !topic.isPinned }
        : topic
    ));
  };

  const handleToggleClose = (topicId: string) => {
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, isClosed: !topic.isClosed }
        : topic
    ));
  };

  const handleDeleteTopic = (topicId: string) => {
    if (window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      setTopics(topics.filter(topic => topic.id !== topicId));
    }
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !selectedTopic) return;
    
    const newReply: ForumReply = {
      id: Date.now().toString(),
      content: replyContent,
      author: {
        id: 'admin',
        name: 'Admin User',
        role: 'admin'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAnswer: false,
      likes: 0,
      topicId: selectedTopic.id
    };
    
    setReplies([...replies, newReply]);
    setReplyContent('');
    
    // Update the topic's reply count and last reply info
    setTopics(topics.map(topic => 
      topic.id === selectedTopic.id 
        ? { 
            ...topic, 
            replies: topic.replies + 1,
            updatedAt: new Date().toISOString(),
            lastReply: {
              author: {
                id: 'admin',
                name: 'Admin User'
              },
              createdAt: new Date().toISOString()
            }
          }
        : topic
    ));
    
    // Update the selected topic as well
    setSelectedTopic({
      ...selectedTopic,
      replies: selectedTopic.replies + 1,
      updatedAt: new Date().toISOString(),
      lastReply: {
        author: {
          id: 'admin',
          name: 'Admin User'
        },
        createdAt: new Date().toISOString()
      }
    });
  };

  const handleMarkAsAnswer = (replyId: string) => {
    setReplies(replies.map(reply => 
      reply.id === replyId 
        ? { ...reply, isAnswer: !reply.isAnswer }
        : reply.topicId === reply.topicId ? { ...reply, isAnswer: false } : reply
    ));
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const courses = [
    { id: '1', title: 'Advanced Physics' },
    { id: '2', title: 'Organic Chemistry' },
    { id: '3', title: 'Calculus for JEE' },
    { id: '4', title: 'Biology: Human Physiology' },
    { id: '5', title: 'Algebra and Coordinate Geometry' }
  ];

  const allTags = Array.from(new Set(topics.flatMap(topic => topic.tags)));

  return (
    <div className="space-y-6">
      {showTopicDetails && selectedTopic ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTopicDetails(false)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forums
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleTogglePin(selectedTopic.id)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                  selectedTopic.isPinned
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Pin className="w-4 h-4" />
                <span>{selectedTopic.isPinned ? 'Unpin' : 'Pin'}</span>
              </button>
              
              <button
                onClick={() => handleToggleClose(selectedTopic.id)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                  selectedTopic.isClosed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {selectedTopic.isClosed ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Reopen</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Close</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleDeleteTopic(selectedTopic.id)}
                className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Topic Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {selectedTopic.isPinned && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Pin className="w-3 h-3 mr-1" />
                      Pinned
                    </span>
                  )}
                  {selectedTopic.isClosed && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Closed
                    </span>
                  )}
                  {selectedTopic.course && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedTopic.course.title}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTopic.title}</h2>
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <span>Posted by {selectedTopic.author.name}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDateTime(selectedTopic.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none mb-6">
              <ReactMarkdown>{selectedTopic.content}</ReactMarkdown>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTopic.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {selectedTopic.replies} replies
                </span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {selectedTopic.views} views
                </span>
              </div>
            </div>
          </div>

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Replies</h3>
            
            {replies.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No replies yet</h4>
                <p className="text-gray-600">Be the first to reply to this topic</p>
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div 
                    key={reply.id} 
                    className={`bg-white rounded-xl border ${reply.isAnswer ? 'border-green-300 shadow-md' : 'border-gray-200'} overflow-hidden`}
                  >
                    {reply.isAnswer && (
                      <div className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marked as Answer
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {reply.author.avatar ? (
                              <img 
                                src={reply.author.avatar} 
                                alt={reply.author.name} 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              reply.author.name.charAt(0)
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-gray-900 mr-2">{reply.author.name}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(reply.author.role)}`}>
                              {reply.author.role}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-3">
                            {formatDateTime(reply.createdAt)}
                            {reply.createdAt !== reply.updatedAt && ' (edited)'}
                          </div>
                          <div className="prose max-w-none">
                            <ReactMarkdown>{reply.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center text-gray-500 hover:text-blue-600">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            <span className="text-sm">{reply.likes}</span>
                          </button>
                          <button className="text-gray-500 hover:text-blue-600">
                            <Reply className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!selectedTopic.isClosed && (
                            <button
                              onClick={() => handleMarkAsAnswer(reply.id)}
                              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                reply.isAnswer
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>{reply.isAnswer ? 'Unmark Answer' : 'Mark as Answer'}</span>
                            </button>
                          )}
                          <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Reply Form */}
            {!selectedTopic.isClosed && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Post a Reply</h4>
                <div className="mb-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write your reply here... (Markdown supported)"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim()}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Post Reply</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Discussion Forums</h2>
              <p className="text-gray-600">Manage forum topics and student discussions</p>
            </div>
            
            <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              <span>Create Topic</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Topics</p>
                  <p className="text-3xl font-bold text-gray-900">{topics.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Discussions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {topics.filter(t => !t.isClosed).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Replies</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {topics.reduce((sum, t) => sum + t.replies, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Reply className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {/* In a real app, this would be the count of unique users */}
                    12
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search topics by title, content, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.course}
                  onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>

                <select
                  value={filters.tag}
                  onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Tags</option>
                  {allTags.map((tag, index) => (
                    <option key={index} value={tag}>{tag}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pinned">Pinned</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Topics Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('title')}
                      >
                        <span>Topic</span>
                        {sortField === 'title' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('replies')}
                      >
                        <span>Replies</span>
                        {sortField === 'replies' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('views')}
                      >
                        <span>Views</span>
                        {sortField === 'views' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('updatedAt')}
                      >
                        <span>Last Activity</span>
                        {sortField === 'updatedAt' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredAndSortedTopics.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No topics found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedTopics.map((topic) => (
                      <tr key={topic.id} className={`hover:bg-gray-50 ${topic.isPinned ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 pt-1">
                              {topic.isPinned ? (
                                <Pin className="w-5 h-5 text-yellow-500" />
                              ) : (
                                <MessageSquare className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => handleViewTopic(topic)}>
                                {topic.title}
                              </div>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <span>by {topic.author.name}</span>
                                <span className="mx-1">•</span>
                                <span>{formatDate(topic.createdAt)}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {topic.tags.slice(0, 3).map((tag, index) => (
                                  <span 
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {topic.tags.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    +{topic.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {topic.course?.title || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {topic.replies}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {topic.views}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {topic.lastReply ? (
                            <div>
                              <div>by {topic.lastReply.author.name}</div>
                              <div>{formatDate(topic.lastReply.createdAt)}</div>
                            </div>
                          ) : (
                            <span>No replies</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {topic.isClosed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Open
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTopic(topic)}
                              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Topic"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleTogglePin(topic.id)}
                              className={`p-1 rounded transition-colors ${
                                topic.isPinned
                                  ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
                                  : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                              }`}
                              title={topic.isPinned ? 'Unpin Topic' : 'Pin Topic'}
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleToggleClose(topic.id)}
                              className={`p-1 rounded transition-colors ${
                                topic.isClosed
                                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={topic.isClosed ? 'Reopen Topic' : 'Close Topic'}
                            >
                              {topic.isClosed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Topic"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DiscussionForums;