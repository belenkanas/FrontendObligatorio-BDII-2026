import { createContext, useContext, useState } from 'react';

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

  const login = (datos: any) => setUsuario(datos);
  const logout = () => setUsuario(null);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}