# Mundial 2026 — Sistema de Ticketing Digital - Frontend

Sistema integral de ticketing para partidos del Mundial 2026. 

---

## 1. Levantar el frontend

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

## 2. Registrarse y usar la app

1. Abrí la app y registrate con tus datos
2. El usuario queda automáticamente como **Usuario General**
3. Podes comprar entradas, transferirlas y ver tus tickets

---

## 3. Configuración inicial del administrador

Al registrarse, todo usuario queda como Usuario General. Para asignar el rol de Administrador al primer usuario del sistema, seguir estos pasos **una única vez**:

Luego de registrarse en el paso 2.:

1. Conectarse a la base de datos con DataGrip
2. Verificar el `id` del perfil creado en la tabla `perfil`
3. Ejecutar los siguientes comandos reemplazando `{id}` con ese valor:

```sql
DELETE FROM general WHERE id_general = {id};

INSERT INTO administrador (id_administrador, fecha_asignado, paisSede)
VALUES ({id}, CURDATE(), 'México'); -- o 'Canadá' / 'Estados Unidos'
```

A partir de entonces, el administrador puede gestionar roles de otros usuarios directamente desde la aplicación.