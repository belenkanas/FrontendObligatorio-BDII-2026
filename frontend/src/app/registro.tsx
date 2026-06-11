import api from '../../services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { esFuncionario, obtenerUsuarioSesion, useAuth } from '@/context/AuthContext';

export default function RegistroScreen() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [form, setForm] = useState({
    mail: '',
    password: '',
    documentoTipo: '',
    documentoNumeroDoc: '',
    direccionCalle: '',
    direccionNumero: '',
    direccionCodigoPostal: '',
    direccionPais: '',
    direccionLocalidad: '',
  });
  const { login } = useAuth();


  const handleRegistro = async () => {
    setError('');
    setExito('');

    if (!form.mail || !form.password || !form.documentoTipo || !form.documentoNumeroDoc ||
        !form.direccionCalle || !form.direccionNumero || !form.direccionCodigoPostal ||
        !form.direccionPais || !form.direccionLocalidad) {
      setError('Todos los campos son obligatorios');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.mail)) {
      setError('El correo electrónico no es válido');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await api.post('/auth/registro', form);
      const loginResponse = await api.post('/auth/login', { mail: form.mail, password: form.password });
      const usuarioSesion = obtenerUsuarioSesion(loginResponse.data);
      login(usuarioSesion);
      setExito('Usuario registrado correctamente');
      setError('');
      setTimeout(() => router.replace(esFuncionario(usuarioSesion) ? '/funcionario' : '/eventos'), 1500);
    } catch (err: any) {
        const mensaje = err.response?.data;
        if (typeof mensaje === 'string' && mensaje.includes('ya está registrado')) {
            setError('El correo electrónico ya está registrado');
        } else {
            setError('Error al registrarse. Intentá de nuevo');
        }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Crear cuenta</Text>

      <Text style={styles.seccion}>Datos de acceso</Text>
      <TextInput style={styles.input} placeholder="Correo electrónico" value={form.mail} onChangeText={v => setForm({...form, mail: v})} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña" value={form.password} onChangeText={v => setForm({...form, password: v})} secureTextEntry />
      
      <Text style={styles.seccion}>Documento</Text>
      <View style={styles.input}>
      <Picker selectedValue={form.documentoTipo} onValueChange={v => setForm({...form, documentoTipo: v})}> 
        <Picker.Item label="Seleccioná tipo de documento" value="" />
        <Picker.Item label="Cédula de Identidad" value="CI" />
        <Picker.Item label="Pasaporte" value="Pasaporte" />
        <Picker.Item label="DNI" value="DNI" />
      </Picker>
      </View>
      <TextInput style={styles.input} placeholder="Número de documento" value={form.documentoNumeroDoc} onChangeText={v => setForm({...form, documentoNumeroDoc: v})} />

      <Text style={styles.seccion}>Dirección</Text>
      <TextInput style={styles.input} placeholder="País" value={form.direccionPais} onChangeText={v => setForm({...form, direccionPais: v})} />
      <TextInput style={styles.input} placeholder="Localidad" value={form.direccionLocalidad} onChangeText={v => setForm({...form, direccionLocalidad: v})} />
      <TextInput style={styles.input} placeholder="Calle" value={form.direccionCalle} onChangeText={v => setForm({...form, direccionCalle: v})} />
      <TextInput style={styles.input} placeholder="Número" value={form.direccionNumero} onChangeText={v => setForm({...form, direccionNumero: v})} />
      <TextInput style={styles.input} placeholder="Código Postal" value={form.direccionCodigoPostal} onChangeText={v => setForm({...form, direccionCodigoPostal: v})} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {exito ? <Text style={styles.exito}>{exito}</Text> : null}

      <TouchableOpacity style={styles.boton} onPress={handleRegistro}>
        <Text style={styles.botonTexto}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>¿Ya tenes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    width: '100%',
    alignSelf: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  seccion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#1a73e8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    marginTop: 16,
    color: '#1a73e8',
    marginBottom: 32,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  exito: {
    color: 'green',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
});