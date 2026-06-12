import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItem } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

function CustomDrawer(props: any) {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const rol = usuario?.rol;

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Text style={styles.mail}>{usuario?.mail}</Text>
        <Text style={styles.rol}>{rol}</Text>
      </View>

      {rol === 'GENERAL' && (
        <>
          <DrawerItem label="Eventos" onPress={() => router.push('/eventos')} />
          <DrawerItem label="Mis entradas" onPress={() => router.push('/mis-entradas')} />
          <DrawerItem label="Solicitudes" onPress={() => router.push('/solicitudes')} />
          <DrawerItem label="Mis transacciones" onPress={() => router.push('/mis-transacciones')} />
        </>
      )}

      {rol === 'ADMINISTRADOR' && (
        <>
          <DrawerItem label="Eventos" onPress={() => router.push('/eventos')} />
          <DrawerItem label="Usuarios" onPress={() => router.push('/admin-usuarios' as any)} />
          <DrawerItem label="Estadísticas" onPress={() => router.push('/admin-estadisticas' as any)} />
        </>
      )}

      {rol === 'FUNCIONARIO' && (
        <DrawerItem label="Mi panel" onPress={() => router.push('/funcionario' as any)} />
      )}

      <DrawerItem label="Perfil" onPress={() => router.push('/perfil')} />
      <DrawerItem label="Cerrar sesión" onPress={() => { logout(); router.replace('/login'); }} labelStyle={{ color: '#b91c1c' }} />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 8 },
  mail: { fontSize: 14, color: '#374151', fontWeight: '600' },
  rol: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}>
          <Drawer.Screen name="index" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="login" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="registro" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="eventos" options={{ title: 'Eventos' }} />
          <Drawer.Screen name="mis-entradas" options={{ title: 'Mis entradas' }} />
          <Drawer.Screen name="solicitudes" options={{ title: 'Solicitudes' }} />
          <Drawer.Screen name="mis-transacciones" options={{ title: 'Transacciones' }} />
          <Drawer.Screen name="perfil" options={{ title: 'Perfil' }} />
          <Drawer.Screen name="funcionario" options={{ title: 'Panel funcionario' }} />
          <Drawer.Screen name="admin-usuarios" options={{ title: 'Usuarios' }} />
          <Drawer.Screen name="admin-estadisticas" options={{ title: 'Estadísticas' }} />
          <Drawer.Screen name="venta/[idVenta]" options={{ title: 'Detalle de compra', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="entrada/[id]" options={{ title: 'Mi QR', drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}