import api from '../../services/api';
import { useState } from 'react';
import {
  Modal,
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

export default function AdminUsuariosScreen() {
  const [mail, setMail]       = useState('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [paisSede, setPaisSede] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [exito, setExito]     = useState('');
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);

  
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
      const payload = err.response?.data;
      const message = typeof payload === 'string'
          ? payload
          : payload?.message || payload?.error || JSON.stringify(payload) || 'Error al cambiar el rol';
      setError(message);
    }
  };

  const eliminarUsuario = () => {
    setError('');
    setExito('');
    setMostrarModalEliminar(true);
  }

  const confirmarEliminarUsuario = async () => {
    try {
      if (!usuario) {
        setError('No se encontró el usuario a eliminar');
        return;
      }
      if (usuario.rol === 'ADMINISTRADOR') {
        await api.delete(`/administradores/${usuario.idPerfil}`);
      }
      else if (usuario.rol === 'FUNCIONARIO') {
        await api.delete(`/funcionarios/${usuario.idPerfil}`);
      }
      else if (usuario.rol === 'GENERAL') {
        await api.delete(`/generales/${usuario.idPerfil}`);
      }
      setExito('Usuario eliminado correctamente');
      setUsuario(null);
      setMail('');
    } catch (err: any) {
      const payload = err.response?.data;
      const message = typeof payload === 'string'
          ? payload
          : payload?.message || payload?.error || JSON.stringify(payload) || 'Error al eliminar el usuario';
      setError(message);
    }
  };

  return (
    <>
    <Modal
      visible={mostrarModalEliminar}
      transparent
      animationType="fade"
    >
      <View style={s.modalFondo}>

        <View style={s.modalCaja}>

          <Text style={s.modalTitulo}>
            Confirmar eliminación
          </Text>


          <Text style={s.modalTexto}>
            ¿Estás seguro de que deseas eliminar este usuario?
            Esta acción no se puede deshacer.
          </Text>


          <View style={s.modalBotones}>

            <TouchableOpacity
              style={s.botonCancelar}
              onPress={() => setMostrarModalEliminar(false)}
            >
              <Text style={s.botonTexto}>
                Cancelar
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={s.botonConfirmarEliminar}
              onPress={confirmarEliminarUsuario}
            >
              <Text style={s.botonTexto}>
                Eliminar
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </View>
    </Modal>

    <ScrollView style={s.root} contentContainerStyle={s.contenedor}>
      <Text style={s.titulo}>Gestión de usuarios</Text>

      <Text style={s.descripcion}>
        Ingresá el correo electrónico del usuario para verificar sus datos
        y modificar su rol dentro del sistema.
        Esta acción solo está disponible para administradores.
      </Text>

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
                  <Picker.Item label="Seleccioná un país sede para este nuevo administrador" value=""               />
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
    </>
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
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCaja: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },

  modalTitulo: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },

  modalTexto: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 20,
  },

  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },

  botonCancelar: {
    backgroundColor: '#6b7280',
    padding: 12,
    borderRadius: 8,
  },

  botonConfirmarEliminar: {
    backgroundColor: '#b91c1c',
    padding: 12,
    borderRadius: 8,
  },

});
