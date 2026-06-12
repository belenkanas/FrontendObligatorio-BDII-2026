import { useAuth } from '@/context/AuthContext';
import { esFuncionario, obtenerUsuarioSesion } from '@/context/AuthContext';
import api from '../../services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();


  const handleLogin = async () => {
    if (!mail || !password) {
      setError('Completá todos los campos');
      return;
    }
    try {
      const response = await api.post('/auth/login', { mail, password });
      const usuarioSesion = obtenerUsuarioSesion(response.data);
      login(usuarioSesion);
      const destino = esFuncionario(usuarioSesion) ? '/funcionario' : '/eventos';
      router.replace(destino as any);
    } catch (err) {
      setError('Correo electrónico o contraseña incorrectos');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mundial 2026 🏆</Text>
      <Text style={styles.subtitulo}>Inicia sesión para continuar</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={mail}
        onChangeText={setMail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.boton} onPress={handleLogin}>
        <Text style={styles.botonTexto}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/registro' as any)}>
        <Text style={styles.link}>¿No tenes cuenta? Registrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    width: '100%',
    alignSelf: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
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
    marginTop: 8,
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
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});