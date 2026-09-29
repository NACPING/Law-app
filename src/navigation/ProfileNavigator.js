import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PrivacyScreen from '../screens/profile/PrivacyScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationListScreen from '../screens/notification/NotificationListScreen';

const Stack = createNativeStackNavigator();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E3A8A' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'แก้ไขข้อมูลส่วนตัว' }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ title: 'ความเป็นส่วนตัว' }}
      />
      <Stack.Screen
        name="NotificationList"
        component={NotificationListScreen}
        options={{ title: 'การแจ้งเตือน' }}
      />
    </Stack.Navigator>
  );
}
