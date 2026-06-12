import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<any>(null);

export function obtenerUsuarioSesion(data: any) {
  return {
    mail: data.mail,
    idPerfil: data.idPerfil,
    rol: data.rol,
  };
}

export function esFuncionario(usuario: any) {
  return usuario?.rol === 'FUNCIONARIO';
}

export function AuthProvider({ children }: any) {
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('usuario').then(data => {
      if (data) setUsuario(JSON.parse(data));
      setCargando(false);
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
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}