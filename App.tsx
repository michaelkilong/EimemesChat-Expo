// App.tsx (Expo)
// v3.0 — Hybrid architecture: native screens + WebView chat
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './screens/ChatScreen';
// Future native screens will be imported here

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,            // use own headers for consistency
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="Chat" component={ChatScreen} />
        {/* More screens will be added here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}