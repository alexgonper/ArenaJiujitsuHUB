import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { LucideHome, LucideCalendar, LucideCreditCard, LucideUser } from 'lucide-react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export const ThemeContext = createContext();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DEFAULT_THEME = {
  primary: '#FF6B00',
  secondary: '#000000',
  background: '#0F172A', // Slate 900
  card: '#1E293B',       // Slate 800
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#10B981',
  danger: '#EF4444'
};

export default function App() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateBranding = (brandConfig) => {
    if (brandConfig) {
      setTheme(prev => ({
        ...prev,
        primary: brandConfig.primaryColor || prev.primary,
        secondary: brandConfig.secondaryColor || prev.secondary
      }));
    }
  };

  if (loading) {
    return (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, updateBranding, user, setUser }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Main" component={StudentTabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}

function StudentTabNavigator() {
  const { theme } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Início" 
        component={StudentHomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <LucideHome size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Aulas" 
        component={ScheduleScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <LucideCalendar size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Financeiro" 
        component={FinanceScreen} 
        options={{
            tabBarIcon: ({ color, size }) => <LucideCreditCard size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{
            tabBarIcon: ({ color, size }) => <LucideUser size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
