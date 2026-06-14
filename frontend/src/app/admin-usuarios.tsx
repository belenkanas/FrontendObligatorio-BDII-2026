import api from '../../services/api';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

type Usuario = {
  idPerfil: number;
  mail: string;
  rol: string;
};

export default function AdminUsuariosScreen() {
  const [mail, setMail] = useState('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [paisSede, setPaisSede] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const buscarUsuario = async () => {
    setError('');
    setExito('');
    setUsuario(null);
    if (!mail.trim()) {
      setError('Ingresá el correo electrónico del usuario');
      return;
    }
    setLoading(true);
    try {
      const perfilRes = await api.get(`/perfiles/usuario/${mail.trim()}`);
      const perfiles = Array.isArray(perfilRes.data) ? perfilRes.data : [];
      if (perfiles.length === 0) {
        setError('Usuario no encontrado');
        return;
      }
      const idPerfil = perfiles[0].id;

      // determinar rol actual
      let rol = 'GENERAL';
      try {
        const adminRes = await api.get(`/administradores/${idPerfil}`);
        if (adminRes.data) rol = 'ADMINISTRADOR';
      } catch {}
      try {
        const funcRes = await api.get(`/funcionarios/${idPerfil}`);
        if (funcRes.data) rol = 'FUNCIONARIO';
      } catch {}

      setUsuario({ idPerfil, mail: mail.trim(), rol });
      setNuevoRol(rol);
    } catch {
      setError('Error al buscar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const cambiarRol = async () => {
    setError('');
    setExito('');
    if (!nuevoRol) {
      setError('Seleccioná un rol');
      return;
    }
    if (nuevoRol === 'ADMINISTRADOR' && !paisSede.trim()) {
      setError('Ingresá el país sede');
      return;
    }
    try {
      await api.post('/administradores/cambiar-rol', {
        idPerfil: usuario?.idPerfil,
        rol: nuevoRol,
        paisSede: paisSede.trim() || null,
      });
      setExito('Rol cambiado correctamente');
      setUsuario({ ...usuario!, rol: nuevoRol });
    } catch (err: any) {
      setError(err.response?.data || 'Error al cambiar el rol');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Gestión de usuarios</Text>

      <View style={styles.busqueda}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico del usuario"
          value={mail}
          onChangeText={setMail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.botonBuscar} onPress={buscarUsuario}>
          <Text style={styles.botonTexto}>{loading ? '...' : 'Buscar'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {exito ? <Text style={styles.exito}>{exito}</Text> : null}

      {usuario && (
        <View style={styles.card}>
          <Text style={styles.cardMail}>{usuario.mail}</Text>
          <Text style={styles.cardRol}>Rol actual: {usuario.rol}</Text>

          <Text style={styles.label}>Nuevo rol</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={nuevoRol} onValueChange={v => setNuevoRol(v)}>
              <Picker.Item label="GENERAL" value="GENERAL" />
              <Picker.Item label="ADMINISTRADOR" value="ADMINISTRADOR" />
              <Picker.Item label="FUNCIONARIO" value="FUNCIONARIO" />
            </Picker>
          </View>

          {nuevoRol === 'ADMINISTRADOR' && (
            <>
                <Text style={styles.label}>País sede</Text>
                <View style={styles.pickerContainer}>
                <Picker selectedValue={paisSede} onValueChange={v => setPaisSede(v)}>
                    <Picker.Item label="Seleccioná un país sede" value="" />
                    <Picker.Item label="México" value="México" />
                    <Picker.Item label="Canadá" value="Canadá" />
                    <Picker.Item label="Estados Unidos" value="Estados Unidos" />
                </Picker>
                </View>
            </>
            )}

          <TouchableOpacity style={styles.botonCambiar} onPress={cambiarRol}>
            <Text style={styles.botonTexto}>Confirmar cambio de rol</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f6f8fc' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  busqueda: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  botonBuscar: { backgroundColor: '#1a73e8', padding: 12, borderRadius: 8, justifyContent: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700' },
  error: { color: '#b91c1c', marginBottom: 8 },
  exito: { color: '#15803d', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  cardMail: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardRol: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4, marginTop: 12 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },
  botonCambiar: { backgroundColor: '#15803d', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
});