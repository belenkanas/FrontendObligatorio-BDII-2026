import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<any>(null);

export function obtenerUsuarioSesion(datos: any) {
  return datos?.usuario ?? datos?.user ?? datos?.data?.usuario ?? datos?.data?.user ?? datos?.payload?.usuario ?? datos?.payload?.user ?? datos;
}

export function esFuncionario(usuario: any) {
  const usuarioNormalizado = obtenerUsuarioSesion(usuario);
  let textoJson = '';

  try {
    textoJson = JSON.stringify(usuarioNormalizado ?? {});
  } catch (error) {
    textoJson = '';
  }

  const texto = [
    usuarioNormalizado?.rol,
    usuarioNormalizado?.role,
    usuarioNormalizado?.tipo,
    usuarioNormalizado?.perfil,
    usuarioNormalizado?.cargo,
    usuarioNormalizado?.tipoUsuario,
    usuarioNormalizado?.nombreRol,
    textoJson,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return texto.includes('funcionario') || texto.includes('operario') || texto.includes('staff') || texto.includes('control');
}

export function AuthProvider({ children }: any) {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    // cargar usuario guardado al iniciar
    AsyncStorage.getItem('usuario').then(data => {
      if (data) setUsuario(JSON.parse(data));
    });
  }, []);

  const login = (datos: any) => {
    setUsuario(datos);
    AsyncStorage.setItem('usuario', JSON.stringify(datos));
  };

  const logout = () => {
    setUsuario(null);
    AsyncStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}