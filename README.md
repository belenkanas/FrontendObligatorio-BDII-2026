# Mundial 2026 — Sistema de Ticketing Digital - Frontend

Sistema integral de ticketing para partidos del Mundial 2026. La aplicación móvil permite la compra, transferencia y visualización de entradas digitales, así como la gestión de usuarios y eventos según el rol asignado dentro del sistema.

---

## 1. Levantar el frontend

**Importante**: para utilizar la aplicación es necesario que el backend y la base de datos se encuentren previamente en ejecución.

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

1. Abrir la aplicación y registrarse con los datos solicitados.
2. El usuario queda automáticamente como **Usuario General**.
3. Una vez registrado, el usuario puede comprar entradas, transferirlas y visualizar sus tickets.

---

## 3. Configuración inicial del primer administrador

Al registrarse, todo usuario es creado inicialmente con el rol de Usuario General. Debido a que el sistema no contempla un mecanismo de creación automática del primer administrador, es necesario realizar una configuración inicial única para habilitar dicho rol.

Luego de registrarse siguiendo el procedimiento indicado en la sección anterior:

1. Conectarse a la base de datos con DataGrip.
2. Verificar el `id` del perfil creado en la tabla `perfil`.
3. Ejecutar los siguientes comandos reemplazando `{id}` con ese valor:

```sql
DELETE FROM general WHERE id_general = {id};

INSERT INTO administrador (id_administrador, fecha_asignado, pais_sede)
VALUES ({id}, CURDATE(), 'México'); -- o 'Canadá' / 'Estados Unidos'
```

Una vez realizado este procedimiento, el usuario podrá iniciar sesión nuevamente y acceder a las funcionalidades correspondientes al rol de Administrador. Este procedimiento solo es necesario para la creación del primer administrador del sistema; posteriormente, los administradores podrán gestionar los roles de otros usuarios directamente desde la aplicación.