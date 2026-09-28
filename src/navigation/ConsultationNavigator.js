import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AwaitingReviewScreen from '../screens/chat/AwaitingReviewScreen';
import ChatBoxScreen from '../screens/chat/ChatBoxScreen';
import ConsultScreen from '../screens/chat/ConsultScreen';
import ConsultChatScreen from '../screens/chat/ConsultChatScreen';
import ChatRoomScreen from '../screens/consultation/ChatRoomScreen';
import ConsultationListScreen from '../screens/consultation/ConsultationListScreen';

const Stack = createNativeStackNavigator();

export default function ConsultationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1E3A8A' }, headerTintColor: '#FFF' }}>
      <Stack.Screen name="ConsultMain" component={ConsultScreen} options={{ title: 'ปรึกษาทนายความ' }} />
      <Stack.Screen name="ConsultationList" component={ConsultationListScreen} options={{ title: 'คำขอปรึกษาของฉัน' }} />
      <Stack.Screen name="AwaitingReview" component={AwaitingReviewScreen} options={{ title: 'รอการตอบรับ' }} />
      <Stack.Screen name="ChatBox" component={ChatBoxScreen} options={{ title: 'ห้องสนทนา' }} />
      <Stack.Screen name="ConsultChat" component={ConsultChatScreen} options={{ title: 'ห้องสนทนา' }} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'ปรึกษาทนายความ' }} />
    </Stack.Navigator>
  );
}
