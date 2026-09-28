import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';

import ChatNavigator from './ChatNavigator';
import CommunityStackNavigator from './CommunityStackNavigator';
import EbookNavigator from './EbookNavigator';
import PdfViewerScreen from '../screens/ebook/PdfViewerScreen';

const Tab = createBottomTabNavigator();

// Placeholder for Profile since it hasn't been created yet
const ProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Profile</Text>
  </View>
);

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Navigators handle their own headers
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Community') {
            iconName = focused ? 'earth' : 'earth-outline';
          } else if (route.name === 'E-Book') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#a3a3a3',
        tabBarStyle: {
          backgroundColor: '#1E2B58',
          borderTopWidth: 0,
        },
      })}
    >
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{ title: 'ชุมชน' }}
      />
      <Tab.Screen name="E-Book" component={EbookNavigator} />
      <Tab.Screen
        name="PdfViewer"
        component={PdfViewerScreen}
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="Chat" component={ChatNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E2B58',
  },
});
