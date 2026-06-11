import { AuthProvider } from '@/context/AuthContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack initialRouteName="login">
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="eventos" options={{ title: 'Eventos' }} />
        <Stack.Screen name="funcionario" options={{ title: 'Funcionario' }} />
      </Stack>
    </AuthProvider>
  );
}