## Levantar el frontend

```bash
cd frontend
npm install
npx expo start
```

Opciones al iniciar Expo:
- Presionar `a` para abrir en emulador Android
- Presionar `i` para abrir en simulador iOS (solo macOS)
- Presionar `w` para abrir en navegador web
- Escanear el QR con la app **Expo Go** en tu celular

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/registro` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/eventos` | Listar eventos disponibles |
| GET | `/entradas` | Listar entradas |
| POST | `/ventas` | Crear una venta |
| GET | `/sectores` | Listar sectores |
| GET | `/estadios` | Listar estadios |
| GET | `/equipos` | Listar equipos |
| GET | `/partidos` | Listar partidos |

---