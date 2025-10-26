/**
 * Messages List Screen
 * Shows all conversations with tutors and students
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Card,
  Text,
  Avatar,
  Badge,
  Searchbar,
  Chip,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface Conversation {
  id: string;
  recipientName: string;
  recipientPhoto: string;
  recipientRole: 'student' | 'tutor';
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

export default function MessagesListScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'students' | 'tutors'>('all');

  // Mock data - will be replaced with real API data
  const conversations: Conversation[] = [
    {
      id: '1',
      recipientName: 'Sarah Johnson',
      recipientPhoto: 'SJ',
      recipientRole: 'student',
      lastMessage: 'Thanks for the session! See you next week.',
      timestamp: '2 min ago',
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: '2',
      recipientName: 'Dr. Michael Chen',
      recipientPhoto: 'MC',
      recipientRole: 'tutor',
      lastMessage: 'I can help you with calculus on Friday at 3 PM',
      timestamp: '15 min ago',
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: '3',
      recipientName: 'Emma Williams',
      recipientPhoto: 'EW',
      recipientRole: 'student',
      lastMessage: 'Can we reschedule tomorrow\'s session?',
      timestamp: '1 hour ago',
      unreadCount: 1,
      isOnline: false,
    },
    {
      id: '4',
      recipientName: 'David Rodriguez',
      recipientPhoto: 'DR',
      recipientRole: 'tutor',
      lastMessage: 'Here are the study materials I mentioned',
      timestamp: '3 hours ago',
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: '5',
      recipientName: 'Lisa Anderson',
      recipientPhoto: 'LA',
      recipientRole: 'student',
      lastMessage: 'Great explanation! I finally understand derivatives',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isOnline: false,
    },
  ];

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'students' && conv.recipientRole === 'student') ||
      (selectedFilter === 'tutors' && conv.recipientRole === 'tutor');
    return matchesSearch && matchesFilter;
  });

  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Chat', {
        conversationId: item.id,
        recipientName: item.recipientName,
        recipientPhoto: item.recipientPhoto,
      })}
    >
      <Card style={[styles.conversationCard, item.unreadCount > 0 && styles.unreadCard]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.avatarContainer}>
            <Avatar.Text size={56} label={item.recipientPhoto} style={styles.avatar} />
            {item.isOnline && <View style={styles.onlineBadge} />}
          </View>

          <View style={styles.messageInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, item.unreadCount > 0 && styles.unreadName]}>
                {item.recipientName}
              </Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>

            <View style={styles.messageRow}>
              <Text
                style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
              {item.unreadCount > 0 && (
                <Badge size={22} style={styles.badge}>
                  {item.unreadCount}
                </Badge>
              )}
            </View>

            <Chip
              compact
              mode="outlined"
              icon={item.recipientRole === 'tutor' ? 'school' : 'account'}
              style={styles.roleChip}
              textStyle={styles.roleChipText}
            >
              {item.recipientRole === 'tutor' ? 'Tutor' : 'Student'}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search conversations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
        />
        <IconButton
          icon="plus-circle"
          size={28}
          iconColor="#6200ea"
          onPress={() => {}}
          style={styles.newMessageButton}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          selected={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
          style={styles.filterChip}
          mode={selectedFilter === 'all' ? 'flat' : 'outlined'}
        >
          All ({conversations.length})
        </Chip>
        <Chip
          selected={selectedFilter === 'students'}
          onPress={() => setSelectedFilter('students')}
          style={styles.filterChip}
          mode={selectedFilter === 'students' ? 'flat' : 'outlined'}
          icon="account"
        >
          Students
        </Chip>
        <Chip
          selected={selectedFilter === 'tutors'}
          onPress={() => setSelectedFilter('tutors')}
          style={styles.filterChip}
          mode={selectedFilter === 'tutors' ? 'flat' : 'outlined'}
          icon="school"
        >
          Tutors
        </Chip>
      </View>

      {/* Unread Count Header */}
      {unreadCount > 0 && (
        <View style={styles.unreadHeader}>
          <Icon name="message-badge" size={18} color="#6200ea" />
          <Text style={styles.unreadHeaderText}>
            You have {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
          </Text>
        </View>
      )}

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="message-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No conversations found</Text>
          <Text style={styles.emptyStateSubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start a conversation with a tutor or student'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    height: 48,
  },
  newMessageButton: {
    margin: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  filterChip: {
    marginRight: 8,
    height: 36,
  },
  unreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3E5F5',
  },
  unreadHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6200ea',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingTop: 8,
  },
  conversationCard: {
    marginBottom: 10,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#FAFAFA',
    borderLeftWidth: 4,
    borderLeftColor: '#6200ea',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#6200ea',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  unreadName: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#000',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#6200ea',
  },
  roleChip: {
    alignSelf: 'flex-start',
    height: 26,
  },
  roleChipText: {
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
});
