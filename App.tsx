// App.tsx (Expo) — v3.2 (native ErrorBoundary to catch and display JS crashes)
// v3.1 — Native screens: Settings, Profile, EditProfile, Personalization
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './screens/ChatScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import PersonalizationScreen from './screens/PersonalizationScreen';

// ── Error Boundary ─────────────────────────────────────────────
class ErrorBoundary extends React.Component<any, { error: any }> {
  state = { error: null };

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    console.log('APP CRASH:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.err}>
          <Text style={styles.errTitle}>App crashed</Text>
          <ScrollView>
            <Text style={styles.errMsg}>
              {String((this.state.error as any)?.message || this.state.error)}
            </Text>
            <Text style={styles.errStack}>
              {String((this.state.error as any)?.stack || '')}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Stack Navigator ────────────────────────────────────────────
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#000000' },
          }}
        >
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Personalization" component={PersonalizationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  err: {
    flex: 1,
    backgroundColor: '#111',
    padding: 24,
    paddingTop: 60,
  },
  errTitle: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  errMsg: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  errStack: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
