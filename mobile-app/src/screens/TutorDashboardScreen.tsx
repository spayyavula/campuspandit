/**
 * Tutor Dashboard Screen
 * Main dashboard for tutors showing stats, sessions, and earnings
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Avatar, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TutorDashboardScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - will be replaced with real API data
  const tutorStats = {
    name: 'John Doe',
    rating: 4.8,
    totalReviews: 127,
    completedSessions: 342,
    activeStudents: 18,
    weeklyEarnings: 1250,
    monthlyEarnings: 5420,
    responseTime: 15, // minutes
    availability: 'Available',
  };

  const upcomingSessions = [
    {
      id: '1',
      studentName: 'Sarah Johnson',
      subject: 'Calculus',
      time: 'Today, 3:00 PM',
      duration: 60,
      type: 'Video Call',
    },
    {
      id: '2',
      studentName: 'Michael Chen',
      subject: 'Physics',
      time: 'Tomorrow, 10:00 AM',
      duration: 90,
      type: 'Video Call',
    },
    {
      id: '3',
      studentName: 'Emma Williams',
      subject: 'Chemistry',
      time: 'Tomorrow, 2:30 PM',
      duration: 60,
      type: 'In-Person',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Avatar.Text size={64} label="JD" style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.tutorName}>{tutorStats.name}</Text>
              <View style={styles.ratingRow}>
                <Icon name="star" size={20} color="#FFB800" />
                <Text style={styles.ratingText}>
                  {tutorStats.rating} ({tutorStats.totalReviews} reviews)
                </Text>
              </View>
              <Chip
                mode="flat"
                style={styles.statusChip}
                textStyle={styles.statusText}
              >
                {tutorStats.availability}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="calendar-check" size={32} color="#6200ea" />
            <Text style={styles.statNumber}>{tutorStats.completedSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="account-group" size={32} color="#03DAC6" />
            <Text style={styles.statNumber}>{tutorStats.activeStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Earnings Card */}
      <Card style={styles.card}>
        <Card.Title
          title="Earnings"
          left={(props) => <Icon {...props} name="cash-multiple" size={24} />}
        />
        <Card.Content>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>This Week</Text>
              <Text style={styles.earningAmount}>
                ${tutorStats.weeklyEarnings}
              </Text>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>This Month</Text>
              <Text style={styles.earningAmount}>
                ${tutorStats.monthlyEarnings}
              </Text>
            </View>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button mode="text" onPress={() => {}}>
            View Detailed Report
          </Button>
        </Card.Actions>
      </Card>

      {/* Upcoming Sessions */}
      <Card style={styles.card}>
        <Card.Title
          title="Upcoming Sessions"
          subtitle={`${upcomingSessions.length} sessions scheduled`}
          left={(props) => <Icon {...props} name="calendar-clock" size={24} />}
        />
        <Card.Content>
          {upcomingSessions.map((session, index) => (
            <View key={session.id}>
              {index > 0 && <Divider style={styles.sessionDivider} />}
              <View style={styles.sessionItem}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionStudent}>
                    {session.studentName}
                  </Text>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                  <View style={styles.sessionDetails}>
                    <Icon name="clock-outline" size={14} color="#666" />
                    <Text style={styles.sessionTime}> {session.time}</Text>
                    <Text style={styles.sessionDuration}>
                      {' '}
                      • {session.duration} min
                    </Text>
                  </View>
                </View>
                <Chip icon="video" mode="outlined" compact>
                  {session.type}
                </Chip>
              </View>
            </View>
          ))}
        </Card.Content>
        <Card.Actions>
          <Button mode="text" onPress={() => {}}>
            View All Sessions
          </Button>
        </Card.Actions>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Title title="Quick Actions" />
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="account-edit"
              style={styles.actionButton}
              onPress={() => navigation.navigate('TutorProfile')}
            >
              Edit Profile
            </Button>
            <Button
              mode="outlined"
              icon="calendar-plus"
              style={styles.actionButton}
              onPress={() => {}}
            >
              Set Availability
            </Button>
            <Button
              mode="outlined"
              icon="message-text"
              style={styles.actionButton}
              onPress={() => {}}
            >
              Messages
            </Button>
            <Button
              mode="outlined"
              icon="chart-line"
              style={styles.actionButton}
              onPress={() => {}}
            >
              Analytics
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Performance Insights */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Title
          title="Performance"
          left={(props) => <Icon {...props} name="chart-box" size={24} />}
        />
        <Card.Content>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Icon name="clock-fast" size={24} color="#6200ea" />
              <Text style={styles.performanceValue}>
                {tutorStats.responseTime} min
              </Text>
              <Text style={styles.performanceLabel}>Avg Response</Text>
            </View>
            <View style={styles.performanceItem}>
              <Icon name="check-circle" size={24} color="#03DAC6" />
              <Text style={styles.performanceValue}>98%</Text>
              <Text style={styles.performanceLabel}>Completion Rate</Text>
            </View>
            <View style={styles.performanceItem}>
              <Icon name="account-heart" size={24} color="#FF6B6B" />
              <Text style={styles.performanceValue}>4.8</Text>
              <Text style={styles.performanceLabel}>Student Satisfaction</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6200ea',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    color: '#2E7D32',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#6200ea',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 0,
    marginBottom: 8,
  },
  lastCard: {
    marginBottom: 24,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  earningItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  verticalDivider: {
    width: 1,
    height: 40,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sessionLeft: {
    flex: 1,
  },
  sessionStudent: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionSubject: {
    fontSize: 14,
    color: '#6200ea',
    marginBottom: 4,
  },
  sessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTime: {
    fontSize: 12,
    color: '#666',
  },
  sessionDuration: {
    fontSize: 12,
    color: '#666',
  },
  sessionDivider: {
    marginVertical: 4,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});
