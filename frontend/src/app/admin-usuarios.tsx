import api from '../../services/api';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';


type Usuario = {
  idPerfil: number;
  mail: string;
  rol: string;
};

type Administrador = {
  mail: string;
  password: string;
  paisSede: string;
};

const obtenerMensajeError = (err: any, fallback: string) => {
  const data = err?.response?.data;

  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;

  return fallback;
};


export default function AdminUsuariosScreen() {
  const [mail, setMail]       = useState('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [paisSede, setPaisSede] = useState('');
  const [adminMail, setAdminMail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPaisSede, setAdminPaisSede] = useState('');
  const [creandoAdmin, setCreandoAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [exito, setExito]     = useState('');

  const crearAdministrador = async (administrador: Administrador) => {
    setError('');
    setExito('');
    setCreandoAdmin(true);
    try {
      await api.post('/administradores', administrador);
      setExito('Administrador creado correctamente');
      setAdminMail('');
      setAdminPassword('');
      setAdminPaisSede('');
    } catch (err: any) {
      setError(obtenerMensajeError(err, 'Error al crear el administrador'));
    } finally {
      setCreandoAdmin(false);
    }
  };

  const handleCrearAdministrador = async () => {
    if (!adminMail.trim()) {
      setError('Ingresá el mail del administrador');
      return;
    }
    if (!adminPassword.trim()) {
      setError('Ingresá la contraseña del administrador');
      return;
    }
    if (!adminPaisSede.trim()) {
      setError('Ingresá el país sede');
      return;
    }

    await crearAdministrador({
      mail: adminMail.trim(),
      password: adminPassword,
      paisSede: adminPaisSede.trim(),
    });
  };

  //Buscar usuario por mail
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
      const perfiles  = Array.isArray(perfilRes.data) ? perfilRes.data : [];

      if (perfiles.length === 0) {
        setError('No existe un usuario registrado con ese correo electrónico');
        return;
      }

      const idPerfil = perfiles[0].id;

      // Determinar rol actual probando cada endpoint
      let rol = 'GENERAL';
      try {
        const adminRes = await api.get(`/administradores/${idPerfil}`);
        if (adminRes.data) rol = 'ADMINISTRADOR';
      } catch { /* no es admin */ }

      try {
        const funcRes = await api.get(`/funcionarios/${idPerfil}`);
        if (funcRes.data) rol = 'FUNCIONARIO';
      } catch { /* no es funcionario */ }

      // Verificar si es usuario GENERAL
      try {
        const generalRes = await api.get(`/generales/${idPerfil}`);
        if (generalRes.data) rol = 'GENERAL';
      } catch {
        // no es general
      }


      setUsuario({ idPerfil, mail: mail.trim(), rol });
      setNuevoRol(rol);
      setPaisSede('');
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
        rol:      nuevoRol,
        paisSede: nuevoRol === 'ADMINISTRADOR' ? paisSede.trim() : null,
      });
      setExito('Rol cambiado correctamente');
      setUsuario({ ...usuario!, rol: nuevoRol });
    } catch (err: any) {
      setError(obtenerMensajeError(err, 'Error al cambiar el rol'));
    }
  };

  const eliminarUsuario = async () => {
    Alert.alert(
      'Confirmar eliminación',  
      '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/perfiles/${usuario?.mail}`);
              setExito('Usuario eliminado correctamente');
              setUsuario(null);
              setMail('');
            } catch (err: any) {
              setError(obtenerMensajeError(err, 'Error al eliminar el usuario'));
            }
          } 
        }
      ]
    );
  };

 
  return (
    <ScrollView style={s.root} contentContainerStyle={s.contenedor}>
      <Text style={s.titulo}>Gestión de usuarios</Text>

      <Text style={s.descripcion}>
        Ingresá el correo electrónico del usuario para verificar sus datos
        y modificar su rol dentro del sistema.
        Esta acción solo está disponible para administradores.
      </Text>

      <View style={s.cardSeccion}>
        <Text style={s.subtitulo}>Crear administrador</Text>

        <TextInput
          style={s.input}
          placeholder="Mail del administrador"
          value={adminMail}
          onChangeText={setAdminMail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={s.input}
          placeholder="Contraseña"
          value={adminPassword}
          onChangeText={setAdminPassword}
          secureTextEntry
        />

        <View style={s.pickerContainer}>
          <Picker selectedValue={adminPaisSede} onValueChange={(v) => setAdminPaisSede(v)}>
            <Picker.Item label="Seleccioná un país sede" value="" />
            <Picker.Item label="México" value="México" />
            <Picker.Item label="Canadá" value="Canadá" />
            <Picker.Item label="Estados Unidos" value="Estados Unidos" />
          </Picker>
        </View>

        <TouchableOpacity
          style={s.botonCrearAdmin}
          onPress={handleCrearAdministrador}
          disabled={creandoAdmin}
        >
          <Text style={s.botonTexto}>{creandoAdmin ? 'Creando...' : 'Crear administrador'}</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={s.busqueda}>
        <TextInput
          style={s.input}
          placeholder="Ingresá el correo del usuario a modificar"
          value={mail}
          onChangeText={setMail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={s.botonBuscar} onPress={buscarUsuario}>
          <Text style={s.botonTexto}>{loading ? '...' : 'Buscar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      {!!error && <Text style={s.error}>{error}</Text>}
      {!!exito && <Text style={s.exito}>{exito}</Text>}

      {/* Card del usuario encontrado */}
      {usuario && (
        <View style={s.card}>
          <Text style={s.cardMail}>{usuario.mail}</Text>
          <Text style={s.cardRol}>Rol actual: <Text style={s.rolDestacado}>{usuario.rol}</Text></Text>

          {/* Selector de nuevo rol */}
          <Text style={s.label}>Nuevo rol</Text>
          <View style={s.pickerContainer}>
            <Picker selectedValue={nuevoRol} onValueChange={(v) => setNuevoRol(v)}>
              <Picker.Item label="GENERAL"        value="GENERAL"        />
              <Picker.Item label="ADMINISTRADOR"  value="ADMINISTRADOR"  />
              <Picker.Item label="FUNCIONARIO"    value="FUNCIONARIO"    />
            </Picker>
          </View>

          {/* Botón para eliminar usuario */}
          <TouchableOpacity style={s.botonEliminar} onPress={eliminarUsuario}>
            <Text style={s.botonTexto}>Eliminar usuario</Text>
          </TouchableOpacity>

          {/* País sede — solo si el nuevo rol es ADMINISTRADOR */}
          {nuevoRol === 'ADMINISTRADOR' && (
            <>
              <Text style={s.label}>País sede</Text>
              <View style={s.pickerContainer}>
                <Picker selectedValue={paisSede} onValueChange={(v) => setPaisSede(v)}>
                  <Picker.Item label="Seleccioná un país sede" value=""               />
                  <Picker.Item label="México"                  value="México"         />
                  <Picker.Item label="Canadá"                  value="Canadá"         />
                  <Picker.Item label="Estados Unidos"          value="Estados Unidos" />
                </Picker>
              </View>
            </>
          )}

          <TouchableOpacity style={s.botonCambiar} onPress={cambiarRol}>
            <Text style={s.botonTexto}>Confirmar cambio de rol</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}


const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f6f8fc' },
  contenedor: { padding: 24 },
  titulo:     { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  descripcion: { fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 20},
  cardSeccion: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 16 },
  subtitulo:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  descripcionSeccion: { fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 18 },
  busqueda:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input:      { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  botonBuscar:{ backgroundColor: '#1a73e8', padding: 12, borderRadius: 8, justifyContent: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700' },

  error: { color: '#b91c1c', marginBottom: 8 },
  exito: { color: '#15803d', marginBottom: 8 },

  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  cardMail:     { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardRol:      { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  rolDestacado: { fontWeight: '700', color: '#1a73e8' },

  label:          { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4, marginTop: 12 },
  pickerContainer:{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },

  botonCrearAdmin: { backgroundColor: '#1a73e8', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  botonCambiar: { backgroundColor: '#15803d', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  botonEliminar: { backgroundColor: '#b91c1c', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
});
