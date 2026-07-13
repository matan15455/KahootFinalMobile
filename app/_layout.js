import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Rubik_700Bold, Rubik_800ExtraBold,
} from '@expo-google-fonts/rubik';
import {
  Heebo_400Regular, Heebo_500Medium, Heebo_700Bold,
} from '@expo-google-fonts/heebo';
import {
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { AuthProvider } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [loaded] = useFonts({
    Rubik_700Bold,
    Rubik_800ExtraBold,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
    SpaceGrotesk_700Bold,
  });

  if (!loaded) 
    return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
