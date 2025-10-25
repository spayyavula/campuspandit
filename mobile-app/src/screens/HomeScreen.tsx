/**
 * Home Screen
 * Main dashboard for authenticated users
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { supabase } from '../config/supabase';

export default function HomeScreen() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.welcomeText}>Welcome to CampusPandit! 🎓</Text>
            <Text style={styles.subtitle}>
              Your platform for connecting students with tutors
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Find Tutors" />
          <Card.Content>
            <Text>
              Search for tutors based on subjects, availability, and ratings
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" disabled>
              Coming Soon
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="My Sessions" />
          <Card.Content>
            <Text>View and manage your upcoming tutoring sessions</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" disabled>
              Coming Soon
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Messages" />
          <Card.Content>
            <Text>Chat with your tutors and students</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" disabled>
              Coming Soon
            </Button>
          </Card.Actions>
        </Card>

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  signOutButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});
