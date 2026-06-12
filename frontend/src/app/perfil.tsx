import api from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<any>(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const response = await api.get(`/usuarios/${usuario.mail}`);
      setDatos(response.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (loading) return <View style={styles.centro}><ActivityIndicator size="large" color="#1a73e8" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Mi perfil</Text>
      <Text style={styles.mail}>{usuario?.mail}</Text>
      <Text style={styles.rol}>Rol: {usuario?.rol}</Text>

      <View style={styles.card}>
        <Text style={styles.seccion}>Documento</Text>
        <Text style={styles.label}>Tipo</Text>
        <Text style={styles.valor}>{datos?.documentoTipo || '—'}</Text>
        <Text style={styles.label}>Número</Text>
        <Text style={styles.valor}>{datos?.documentoNumeroDoc || '—'}</Text>

        <Text style={styles.seccion}>Dirección</Text>
        <Text style={styles.label}>País</Text>
        <Text style={styles.valor}>{datos?.direccionPais || '—'}</Text>
        <Text style={styles.label}>Localidad</Text>
        <Text style={styles.valor}>{datos?.direccionLocalidad || '—'}</Text>
        <Text style={styles.label}>Calle</Text>
        <Text style={styles.valor}>{datos?.direccionCalle || '—'}</Text>
        <Text style={styles.label}>Número</Text>
        <Text style={styles.valor}>{datos?.direccionNumero || '—'}</Text>
        <Text style={styles.label}>Código postal</Text>
        <Text style={styles.valor}>{datos?.direccionCodigoPostal || '—'}</Text>
      </View>

      <TouchableOpacity style={styles.botonLogout} onPress={handleLogout}>
        <Text style={styles.botonLogoutTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f6f8fc' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  mail: { fontSize: 16, color: '#6b7280', marginBottom: 2 },
  rol: { fontSize: 13, color: '#1a73e8', fontWeight: '700', marginBottom: 16, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  seccion: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 4 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 8, textTransform: 'uppercase', fontWeight: '700' },
  valor: { fontSize: 15, color: '#111827', marginTop: 2 },
  botonLogout: { backgroundColor: '#b91c1c', padding: 16, borderRadius: 12, alignItems: 'center' },
  botonLogoutTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});