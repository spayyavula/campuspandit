/**
 * Chat Bot Service
 * Simulates real-time responses from tutors/students for testing
 */

import { IMessage } from 'react-native-gifted-chat';

export interface BotResponse {
  text: string;
  delay: number; // milliseconds before sending
}

const tutorResponses = [
  "That's a great question! Let me explain...",
  "I'd be happy to help you with that topic.",
  "Based on what you've described, I recommend focusing on the fundamentals first.",
  "Have you tried working through some practice problems? That usually helps.",
  "Let me share some study materials that might help.",
  "I'm available for a session tomorrow at 3 PM if that works for you.",
  "That's exactly right! You're making great progress.",
  "Don't worry, this concept can be tricky at first. Let's break it down step by step.",
  "I have some time this week. Would you like to schedule a tutoring session?",
  "Great work! Keep practicing and you'll master this in no time.",
];

const studentResponses = [
  "Thanks so much! That really helps.",
  "I'm still a bit confused about the second part. Could you explain more?",
  "When is your next available session?",
  "I've been practicing what we covered last time.",
  "Can we schedule another session for next week?",
  "That makes so much more sense now!",
  "I really appreciate your patience and help.",
  "Could you recommend some additional resources?",
  "I have a test coming up next week. Can we do a review session?",
  "Your teaching style really works for me. Thank you!",
];

const contextualResponses: { [key: string]: string[] } = {
  hello: ["Hi! How can I help you today?", "Hello! Great to hear from you!"],
  hi: ["Hey there! What can I do for you?", "Hi! Ready to tackle some problems?"],
  thanks: ["You're very welcome!", "Happy to help anytime!", "My pleasure!"],
  thank: ["You're welcome!", "Glad I could help!", "Anytime!"],
  help: ["Of course! What do you need help with?", "I'm here to help. What's the topic?"],
  schedule: ["I'm available Mon-Fri 3-8 PM. What time works for you?", "Let me check my calendar..."],
  session: ["Sure! When would you like to meet?", "I'd be happy to schedule a session."],
  test: ["Let's prepare together! When is your test?", "We can do a comprehensive review session."],
  exam: ["I can help you prepare. What subjects are covered?", "Let's set up some review sessions."],
  question: ["Go ahead, I'm listening!", "What's your question?"],
  confused: ["No problem! Let me explain it differently.", "Let's go over that again step by step."],
  understand: ["Great! Understanding is the first step.", "Excellent! You're getting it!"],
};

/**
 * Get a bot response based on user message
 */
export const getBotResponse = (
  userMessage: string,
  botRole: 'tutor' | 'student'
): BotResponse => {
  const lowerMessage = userMessage.toLowerCase();

  // Check for contextual responses
  for (const [keyword, responses] of Object.entries(contextualResponses)) {
    if (lowerMessage.includes(keyword)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return {
        text: randomResponse,
        delay: 1500 + Math.random() * 1500, // 1.5-3 seconds
      };
    }
  }

  // Default random responses based on role
  const responses = botRole === 'tutor' ? tutorResponses : studentResponses;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return {
    text: randomResponse,
    delay: 2000 + Math.random() * 2000, // 2-4 seconds
  };
};

/**
 * Create a bot message object
 */
export const createBotMessage = (
  text: string,
  botId: string,
  botName: string,
  botAvatar: string
): IMessage => {
  return {
    _id: Math.random().toString(),
    text,
    createdAt: new Date(),
    user: {
      _id: botId,
      name: botName,
      avatar: botAvatar,
    },
  };
};

/**
 * Simulate typing delay
 */
export const simulateTyping = (messageLength: number): number => {
  // Typing speed: ~50 characters per second
  const baseDelay = (messageLength / 50) * 1000;
  // Add some randomness (±30%)
  const randomFactor = 0.7 + Math.random() * 0.6;
  return Math.max(500, Math.min(3000, baseDelay * randomFactor));
};

/**
 * AI-powered smart responses (simulated)
 */
export const getSmartResponse = (userMessage: string, conversationHistory: IMessage[]): BotResponse => {
  const lowerMessage = userMessage.toLowerCase();

  // Math/Academic help
  if (lowerMessage.match(/calculus|derivative|integral|equation|algebra|math/i)) {
    const mathResponses = [
      "Let's work through this problem step by step. First, identify what we're solving for.",
      "For this type of problem, remember the fundamental theorem we discussed.",
      "I recommend reviewing the chapter on this topic. Would you like me to send some practice problems?",
      "This is a common area of confusion. Let me break it down into simpler parts.",
    ];
    return {
      text: mathResponses[Math.floor(Math.random() * mathResponses.length)],
      delay: 2000 + Math.random() * 2000,
    };
  }

  // Physics help
  if (lowerMessage.match(/physics|force|motion|energy|velocity/i)) {
    const physicsResponses = [
      "For physics problems, always start by drawing a diagram. What forces are at play?",
      "Let's apply Newton's laws here. Which law do you think applies?",
      "Remember to break down the vectors into components first.",
      "This is a classic physics problem. Let me guide you through the solution.",
    ];
    return {
      text: physicsResponses[Math.floor(Math.random() * physicsResponses.length)],
      delay: 2000 + Math.random() * 2000,
    };
  }

  // Scheduling
  if (lowerMessage.match(/book|schedule|appointment|available|time|when/i)) {
    const scheduleResponses = [
      "I'm available tomorrow at 3 PM or Thursday at 5 PM. Which works better for you?",
      "Let me check my calendar... I have slots open on Tuesday and Friday afternoon.",
      "Sure! I can do Monday 4-6 PM or Wednesday 3-5 PM. Your preference?",
      "I have availability this week. Would you prefer morning or afternoon sessions?",
    ];
    return {
      text: scheduleResponses[Math.floor(Math.random() * scheduleResponses.length)],
      delay: 1500 + Math.random() * 1500,
    };
  }

  // Pricing
  if (lowerMessage.match(/price|cost|rate|pay|fee|charge/i)) {
    const priceResponses = [
      "My hourly rate is $45. I also offer package deals for multiple sessions.",
      "I charge $50 per hour, but I can give you a discount for booking 5+ sessions.",
      "For one-on-one tutoring, my rate is $45/hour. Group sessions are $30 per student.",
    ];
    return {
      text: priceResponses[Math.floor(Math.random() * priceResponses.length)],
      delay: 1000 + Math.random() * 1000,
    };
  }

  // General encouragement
  if (lowerMessage.match(/difficult|hard|struggling|confused|don't understand/i)) {
    const encouragementResponses = [
      "Don't worry! This topic is challenging for many students. We'll work through it together.",
      "I understand it seems difficult now, but with practice, it will click. Let's take it one step at a time.",
      "You're not alone in finding this tough. Many students struggle with this initially. Let me help.",
      "It's okay to be confused. That means you're learning! Let's review the fundamentals.",
    ];
    return {
      text: encouragementResponses[Math.floor(Math.random() * encouragementResponses.length)],
      delay: 1500 + Math.random() * 1500,
    };
  }

  // Default response
  return getBotResponse(userMessage, 'tutor');
};

/**
 * Generate random proactive messages (for demo purposes)
 */
export const getProactiveMessage = (): string => {
  const proactiveMessages = [
    "Hey! Just checking in - how's your studying going?",
    "I uploaded some new practice problems. Want to review them together?",
    "Remember we have a session tomorrow at 3 PM. Looking forward to it!",
    "I found a great video explanation of the topic we discussed. Want the link?",
    "How did your quiz go? Let me know if you want to review anything.",
  ];
  return proactiveMessages[Math.floor(Math.random() * proactiveMessages.length)];
};
