# Bitcoin Finances API

API REST para un sistema de trading de acciones con tiempo real.

## Requisitos

- Node.js 18+
- Supabase account

## Configuración

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Crear archivo `.env` con las variables:

```env
PORT=3000
SUPABASE_URL=tu_supabase_url
SUPABASE_SECRET_KEY=tu_secret_key
SUPABASE_ANON_KEY=tu_anon_key
NODE_ENV=development
```

4. Ejecutar el SQL en `src/database/schema.sql` en tu Supabase

## Scripts

- `npm start` - Iniciar servidor
- `npm run dev` - Iniciar con nodemon
- `npm test` - Ejecutar pruebas

## Endpoints

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |

### Acciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/acciones` | Listar todas las acciones |

### Órdenes (público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios/:userId/ordenes` | Listar órdenes de usuario |
| POST | `/api/ordenes` | Crear orden (compra/venta) |

### Usuario autenticado

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/mis-ordenes` | Ver mis órdenes |
| GET | `/api/mi-perfil` | Ver mi perfil |
| GET | `/api/mis-posiciones` | Ver mis posiciones |
| POST | `/api/ordenes` | Crear orden autenticado |

### Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/ordenes` | Ver todas las órdenes |
| GET | `/api/admin/usuarios` | Ver todos los usuarios |

## WebSocket

Conectar a `ws://localhost:3000` para recibir actualizaciones de precios en tiempo real.

## Ejemplos

### Registro
```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","nombre":"Juan"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Crear orden (autenticado)
```bash
curl -X POST http://localhost:3000/api/ordenes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"accion_id":1,"tipo":"compra","cantidad":10}'
```

## Roles

- `usuario` - Usuario regular
- `admin` - Administrador (acceso completo)
