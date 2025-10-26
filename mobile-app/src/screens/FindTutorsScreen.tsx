/**
 * Find Tutors Screen
 * Browse and search for tutors based on subjects, ratings, and availability
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import {
  Card,
  Text,
  Searchbar,
  Chip,
  Avatar,
  Button,
  IconButton,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Tutor {
  id: string;
  name: string;
  photo: string;
  headline: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  subjects: string[];
  yearsExperience: number;
  responseTime: string;
  availability: string;
  completedSessions: number;
}

export default function FindTutorsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Mock data - will be replaced with real API data
  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Computer Science',
  ];

  const filters = ['Top Rated', 'Most Experienced', 'Quick Response', 'Affordable'];

  const tutors: Tutor[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      photo: 'SJ',
      headline: 'PhD in Mathematics - Specializing in Calculus & Algebra',
      rating: 4.9,
      reviews: 156,
      hourlyRate: 55,
      subjects: ['Mathematics', 'Calculus', 'Algebra'],
      yearsExperience: 8,
      responseTime: '10 min',
      availability: 'Available',
      completedSessions: 420,
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      photo: 'MC',
      headline: 'Physics Expert - AP & College Level',
      rating: 4.8,
      reviews: 203,
      hourlyRate: 50,
      subjects: ['Physics', 'Mathematics'],
      yearsExperience: 12,
      responseTime: '15 min',
      availability: 'Limited',
      completedSessions: 580,
    },
    {
      id: '3',
      name: 'Emma Williams',
      photo: 'EW',
      headline: 'Chemistry Tutor - Making Science Fun!',
      rating: 4.7,
      reviews: 98,
      hourlyRate: 45,
      subjects: ['Chemistry', 'Biology'],
      yearsExperience: 5,
      responseTime: '20 min',
      availability: 'Available',
      completedSessions: 210,
    },
    {
      id: '4',
      name: 'David Rodriguez',
      photo: 'DR',
      headline: 'Computer Science & Programming Mentor',
      rating: 4.9,
      reviews: 134,
      hourlyRate: 60,
      subjects: ['Computer Science', 'Programming', 'Mathematics'],
      yearsExperience: 6,
      responseTime: '5 min',
      availability: 'Available',
      completedSessions: 315,
    },
  ];

  const renderTutorCard = ({ item }: { item: Tutor }) => (
    <Card style={styles.tutorCard} onPress={() => navigation.navigate('TutorDetail', { tutorId: item.id })}>
      <Card.Content>
        <View style={styles.tutorHeader}>
          <Avatar.Text size={56} label={item.photo} style={styles.avatar} />
          <View style={styles.tutorInfo}>
            <Text style={styles.tutorName}>{item.name}</Text>
            <View style={styles.ratingRow}>
              <Icon name="star" size={16} color="#FFB800" />
              <Text style={styles.ratingText}>
                {item.rating} ({item.reviews})
              </Text>
              <Text style={styles.sessions}>• {item.completedSessions} sessions</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${item.hourlyRate}</Text>
            <Text style={styles.priceLabel}>/hour</Text>
          </View>
        </View>

        <Text style={styles.headline} numberOfLines={2}>
          {item.headline}
        </Text>

        <View style={styles.subjectsRow}>
          {item.subjects.slice(0, 3).map((subject) => (
            <Chip key={subject} compact mode="outlined" style={styles.subjectChip}>
              {subject}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="briefcase" size={14} color="#666" />
            <Text style={styles.metaText}>{item.yearsExperience}+ yrs</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="clock-fast" size={14} color="#666" />
            <Text style={styles.metaText}>Responds in {item.responseTime}</Text>
          </View>
          <Chip
            compact
            mode="flat"
            style={[
              styles.availabilityChip,
              item.availability === 'Available'
                ? styles.availableChip
                : styles.limitedChip,
            ]}
            textStyle={styles.availabilityText}
          >
            {item.availability}
          </Chip>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button mode="outlined" icon="message" onPress={() => {}}>
          Message
        </Button>
        <Button mode="contained" icon="calendar-plus" onPress={() => {}}>
          Book Session
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search tutors by name, subject..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
        />
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={() => {}}
          style={styles.filterButton}
        />
      </View>

      {/* Subject Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.subjectFilter}
        contentContainerStyle={styles.subjectFilterContent}
      >
        {subjects.map((subject) => (
          <Chip
            key={subject}
            selected={selectedSubject === subject}
            onPress={() =>
              setSelectedSubject(selectedSubject === subject ? null : subject)
            }
            style={styles.filterChip}
            mode={selectedSubject === subject ? 'flat' : 'outlined'}
          >
            {subject}
          </Chip>
        ))}
      </ScrollView>

      {/* Quick Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickFilters}
        contentContainerStyle={styles.quickFiltersContent}
      >
        {filters.map((filter) => (
          <Chip
            key={filter}
            selected={selectedFilter === filter}
            onPress={() =>
              setSelectedFilter(selectedFilter === filter ? null : filter)
            }
            icon={
              filter === 'Top Rated'
                ? 'star'
                : filter === 'Most Experienced'
                ? 'briefcase'
                : filter === 'Quick Response'
                ? 'clock-fast'
                : 'cash'
            }
            style={styles.filterChip}
            mode={selectedFilter === filter ? 'flat' : 'outlined'}
          >
            {filter}
          </Chip>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          Found {tutors.length} tutors
          {selectedSubject && ` for ${selectedSubject}`}
        </Text>
      </View>

      {/* Tutors List */}
      <FlatList
        data={tutors}
        renderItem={renderTutorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  filterButton: {
    margin: 0,
  },
  subjectFilter: {
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  subjectFilterContent: {
    paddingHorizontal: 12,
  },
  quickFilters: {
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  quickFiltersContent: {
    paddingHorizontal: 12,
  },
  filterChip: {
    marginRight: 8,
    height: 36,
  },
  resultsHeader: {
    padding: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    paddingTop: 8,
  },
  tutorCard: {
    marginBottom: 12,
    elevation: 2,
  },
  tutorHeader: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  avatar: {
    backgroundColor: '#6200ea',
  },
  tutorInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  tutorName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  sessions: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    lineHeight: 28,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headline: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  subjectChip: {
    marginRight: 6,
    marginBottom: 6,
    height: 32,
  },
  divider: {
    marginBottom: 12,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  availabilityChip: {
    height: 28,
  },
  availableChip: {
    backgroundColor: '#E8F5E9',
  },
  limitedChip: {
    backgroundColor: '#FFF3E0',
  },
  availabilityText: {
    fontSize: 12,
  },
});
