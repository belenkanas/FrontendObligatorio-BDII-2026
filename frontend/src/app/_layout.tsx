import { AuthProvider } from '@/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Drawer>
          <Drawer.Screen name="index" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="login" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="registro" options={{ headerShown: false, title: 'Crear cuenta', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="eventos" options={{ title: 'Eventos', drawerLabel: 'Ver eventos' }} />
          <Drawer.Screen name="mis-entradas" options={{ title: 'Mis entradas', drawerLabel: 'Mis entradas' }} />
          <Drawer.Screen name="solicitudes" options={{ title: 'Solicitudes', drawerLabel: 'Solicitudes' }} />
          <Drawer.Screen name="mis-transacciones" options={{ title: 'Transacciones', drawerLabel: 'Mis transacciones' }} />
          <Drawer.Screen name="perfil" options={{ title: 'Perfil', drawerLabel: 'Perfil' }} />
          <Drawer.Screen name="venta/[idVenta]" options={{ title: 'Detalle de compra', drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}