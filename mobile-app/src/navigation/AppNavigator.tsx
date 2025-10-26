/**
 * Main App Navigator
 * Handles navigation between authenticated and unauthenticated states
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSession } from '../hooks/useSession';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import FindTutorsScreen from '../screens/FindTutorsScreen';
import TutorDashboardScreen from '../screens/TutorDashboardScreen';
import TutorProfileScreen from '../screens/TutorProfileScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import ChatScreen from '../screens/ChatScreen';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  MainTabs: undefined;
  TutorProfile: undefined;
  TutorDetail: { tutorId: string };
  Chat: { conversationId: string; recipientName: string; recipientPhoto: string };
};

export type TabParamList = {
  Home: undefined;
  FindTutors: undefined;
  Messages: undefined;
  TutorDashboard: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FindTutors') {
            iconName = focused ? 'account-search' : 'account-search-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'message' : 'message-outline';
          } else if (route.name === 'TutorDashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ea',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#6200ea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="FindTutors"
        component={FindTutorsScreen}
        options={{ title: 'Find Tutors' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesListScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        name="TutorDashboard"
        component={TutorDashboardScreen}
        options={{ title: 'My Tutoring' }}
      />
      <Tab.Screen
        name="Profile"
        component={TutorProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6200ea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {session ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
