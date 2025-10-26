/**
 * Chat Screen
 * One-on-one messaging with tutors or students using Gifted Chat
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { getSmartResponse, createBotMessage, simulateTyping } from '../services/chatBotService';

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, recipientName, recipientPhoto } = route.params;

  const [messages, setMessages] = useState<IMessage[]>(() => [{
    _id: '1',
    text: 'Hi! How can I help you today? Feel free to ask me about scheduling, subjects I teach, or any questions you have! 📚',
    createdAt: new Date(Date.now() - 30000),
    user: {
      _id: 'user-2',
      name: recipientName,
      avatar: `https://ui-avatars.com/api/?name=${recipientPhoto}&background=6200ea&color=fff`,
    },
  }]);

  const [isTyping, setIsTyping] = useState(false);

  const currentUserId = 'user-1';

  // Stable user object
  const user = useMemo(() => ({ _id: currentUserId }), [currentUserId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: recipientName,
    });
  }, [navigation, recipientName]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );

    const userMessageText = newMessages[0]?.text || '';
    const botId = 'user-2';
    const botAvatar = `https://ui-avatars.com/api/?name=${recipientPhoto}&background=6200ea&color=fff`;

    setTimeout(() => {
      setIsTyping(true);
      const { text: botText } = getSmartResponse(userMessageText, []);
      const typingDelay = simulateTyping(botText.length);

      setTimeout(() => {
        setIsTyping(false);
        const botMessage = createBotMessage(botText, botId, recipientName, botAvatar);
        setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, [botMessage])
        );
      }, typingDelay);
    }, 800);
  }, [recipientName, recipientPhoto]);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={user}
        isTyping={isTyping}
        placeholder="Type a message..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
