import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<any>(null);

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