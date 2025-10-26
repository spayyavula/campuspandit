/**
 * Loading Screen
 * Displayed while app initializes
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="school" size={80} color="#6200ea" />
        <Text style={styles.title}>CampusPandit</Text>
        <Text style={styles.subtitle}>Learn. Connect. Excel.</Text>
        <ActivityIndicator size="large" color="#6200ea" style={styles.spinner} />
        <Text style={styles.loadingText}>Initializing your learning experience...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    alignItems: 'center',
    width: '80%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ea',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  spinner: {
    marginTop: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
});
