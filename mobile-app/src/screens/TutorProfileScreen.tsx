/**
 * Tutor Profile Screen
 * View and edit tutor profile information
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  Avatar,
  Divider,
  List,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TutorProfileScreen() {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(
    'Experienced mathematics tutor with 5+ years helping students excel in Calculus and Algebra.'
  );
  const [hourlyRate, setHourlyRate] = useState('45');

  // Mock data
  const profileData = {
    name: 'John Doe',
    headline: 'Expert Math Tutor - Calculus & Algebra Specialist',
    rating: 4.8,
    totalReviews: 127,
    totalSessions: 342,
    yearsExperience: 5,
    subjects: ['Mathematics', 'Calculus', 'Algebra', 'Geometry'],
    gradeLevels: ['High School', 'College', 'AP/IB'],
    languages: ['English', 'Spanish'],
    teachingStyle: 'Patient & Interactive',
    certifications: [
      { name: 'Certified Math Educator', issuer: 'National Board', year: 2019 },
      { name: 'AP Calculus Certified', issuer: 'College Board', year: 2020 },
    ],
    degrees: [
      {
        degree: "Master's in Mathematics",
        institution: 'Stanford University',
        year: 2018,
      },
      {
        degree: "Bachelor's in Mathematics",
        institution: 'UC Berkeley',
        year: 2015,
      },
    ],
    availability: 'Mon-Fri: 3PM-8PM, Sat: 10AM-6PM',
    responseTime: '15 minutes',
    completionRate: 98,
  };

  const handleSave = () => {
    setEditing(false);
    // Save to API
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Text size={80} label="JD" style={styles.avatar} />
            <View style={styles.headerRight}>
              <Button
                mode={editing ? 'contained' : 'outlined'}
                icon={editing ? 'check' : 'pencil'}
                onPress={editing ? handleSave : () => setEditing(true)}
                style={styles.editButton}
              >
                {editing ? 'Save' : 'Edit Profile'}
              </Button>
            </View>
          </View>

          <Text style={styles.name}>{profileData.name}</Text>
          <Text style={styles.headline}>{profileData.headline}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="star" size={20} color="#FFB800" />
              <Text style={styles.statText}>
                {profileData.rating} ({profileData.totalReviews})
              </Text>
            </View>
            <View style={styles.stat}>
              <Icon name="calendar-check" size={20} color="#6200ea" />
              <Text style={styles.statText}>{profileData.totalSessions} sessions</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="briefcase" size={20} color="#03DAC6" />
              <Text style={styles.statText}>{profileData.yearsExperience}+ years</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Bio Section */}
      <Card style={styles.card}>
        <Card.Title
          title="About Me"
          left={(props) => <Icon {...props} name="text-box" size={24} />}
        />
        <Card.Content>
          {editing ? (
            <TextInput
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Tell students about yourself..."
            />
          ) : (
            <Text>{bio}</Text>
          )}
        </Card.Content>
      </Card>

      {/* Subjects & Expertise */}
      <Card style={styles.card}>
        <Card.Title
          title="Subjects & Expertise"
          left={(props) => <Icon {...props} name="school" size={24} />}
        />
        <Card.Content>
          <Text style={styles.sectionLabel}>Subjects</Text>
          <View style={styles.chipContainer}>
            {profileData.subjects.map((subject) => (
              <Chip key={subject} style={styles.chip} mode="outlined">
                {subject}
              </Chip>
            ))}
            {editing && (
              <Chip icon="plus" mode="outlined" style={styles.chip}>
                Add Subject
              </Chip>
            )}
          </View>

          <Text style={styles.sectionLabel}>Grade Levels</Text>
          <View style={styles.chipContainer}>
            {profileData.gradeLevels.map((level) => (
              <Chip key={level} style={styles.chip} mode="outlined">
                {level}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Pricing */}
      <Card style={styles.card}>
        <Card.Title
          title="Pricing"
          left={(props) => <Icon {...props} name="cash" size={24} />}
        />
        <Card.Content>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Hourly Rate:</Text>
            {editing ? (
              <TextInput
                value={hourlyRate}
                onChangeText={setHourlyRate}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Affix text="$" />}
                right={<TextInput.Affix text="/hr" />}
                style={styles.rateInput}
              />
            ) : (
              <Text style={styles.pricingValue}>${hourlyRate}/hour</Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Credentials */}
      <Card style={styles.card}>
        <Card.Title
          title="Education & Certifications"
          left={(props) => <Icon {...props} name="certificate" size={24} />}
        />
        <Card.Content>
          <Text style={styles.sectionLabel}>Degrees</Text>
          {profileData.degrees.map((degree, index) => (
            <List.Item
              key={index}
              title={degree.degree}
              description={`${degree.institution} • ${degree.year}`}
              left={(props) => <List.Icon {...props} icon="school-outline" />}
              style={styles.listItem}
            />
          ))}

          <Divider style={styles.divider} />

          <Text style={styles.sectionLabel}>Certifications</Text>
          {profileData.certifications.map((cert, index) => (
            <List.Item
              key={index}
              title={cert.name}
              description={`${cert.issuer} • ${cert.year}`}
              left={(props) => <List.Icon {...props} icon="medal" />}
              style={styles.listItem}
            />
          ))}

          {editing && (
            <Button mode="outlined" icon="plus" style={styles.addButton}>
              Add Credential
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Teaching Style */}
      <Card style={styles.card}>
        <Card.Title
          title="Teaching Approach"
          left={(props) => <Icon {...props} name="school" size={24} />}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teaching Style:</Text>
            <Text style={styles.infoValue}>{profileData.teachingStyle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Languages:</Text>
            <Text style={styles.infoValue}>
              {profileData.languages.join(', ')}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Availability & Performance */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Title
          title="Availability & Performance"
          left={(props) => <Icon {...props} name="clock-check" size={24} />}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Availability:</Text>
            <Text style={styles.infoValue}>{profileData.availability}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Avg Response:</Text>
            <Text style={styles.infoValue}>{profileData.responseTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Completion Rate:</Text>
            <Text style={styles.infoValue}>{profileData.completionRate}%</Text>
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  lastCard: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#6200ea',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  editButton: {
    marginLeft: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headline: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#666',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  pricingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  rateInput: {
    width: 150,
  },
  listItem: {
    paddingLeft: 0,
  },
  divider: {
    marginVertical: 16,
  },
  addButton: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
