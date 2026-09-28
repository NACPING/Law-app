import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import CommunityStackNavigator from './CommunityStackNavigator';
import EbookStackNavigator from './EbookStackNavigator';
import ConsultationNavigator from './ConsultationNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1E3A8A',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            CommunityTab: 'people-outline',
            EbookTab: 'book-outline',
            ConsultTab: 'chatbubbles-outline',
            ProfileTab: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="CommunityTab" component={CommunityStackNavigator} options={{ title: 'ชุมชน' }} />
      <Tab.Screen name="EbookTab" component={EbookStackNavigator} options={{ title: 'E-Book' }} />
      <Tab.Screen name="ConsultTab" component={ConsultationNavigator} options={{ title: 'ปรึกษาทนาย' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'โปรไฟล์' }} />
    </Tab.Navigator>
  );
}