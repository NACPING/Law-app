import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EbookListScreen from '../screens/ebook/EbookListScreen';
import EbookDetailScreen from '../screens/ebook/EbookDetailScreen';
import FavoriteScreen from '../screens/ebook/FavoriteScreen';
import PdfViewerScreen from '../screens/ebook/PdfViewerScreen';

const Stack = createNativeStackNavigator();

export default function EbookStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1E3A8A' }, headerTintColor: '#FFF' }}>
      <Stack.Screen name="EbookMain" component={EbookListScreen} options={{ title: 'คลังหนังสือ E-Book' }} />
      <Stack.Screen name="EbookDetail" component={EbookDetailScreen} options={{ title: 'รายละเอียดหนังสือ' }} />
      <Stack.Screen name="Favorite" component={FavoriteScreen} options={{ title: 'รายการโปรดของฉัน' }} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}