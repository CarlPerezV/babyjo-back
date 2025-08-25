# Documentación del proyecto — `babyjo-back`

**Última actualización:** 2025-08-24

Este documento registra las dependencias instaladas, los requisitos cumplidos del desafío y extractos de las pruebas realizadas.

---

## ✅ Checklist de requisitos del desafío

**1) Crear un nuevo proyecto de npm e instalar dependencias — _Cumplido_**  
El proyecto cuenta con `package.json` y scripts de ejecución y pruebas (`start`, `dev`, `test`). Además, están declaradas las dependencias y devDependencies necesarias.

**2) Utilizar el paquete `pg` para gestionar la comunicación con PostgreSQL — _Cumplido_**  
Se utiliza el cliente `pg` (node-postgres) para ejecutar consultas. En el modelo de usuarios se usan consultas con `pool.query(...)` y `pg-format` para formateo seguro.

**3) Implementar autenticación y autorización con JWT — _Cumplido_**  
Se firma un token con `jsonwebtoken` en el controlador (`jwt.sign(...)`) y se retorna junto al usuario en el login/registro.

**4) Usar el paquete CORS para permitir orígenes cruzados — _Cumplido_**  
`cors` está habilitado a nivel de aplicación con `app.use(cors())`.

**5) Utilizar middlewares para validar credenciales/token en cabeceras — _Cumplido_**  
`requireAuth` extrae el token `Bearer`, lo verifica con `jwt.verify(...)` y anexa el payload en `req.user`. Se aplica, por ejemplo, en `/api/auth/me`.

**6) Realizar tests de al menos 4 rutas comprobando estados en distintos escenarios — _Cumplido_**  
Se cubren:

- `GET /` (200 OK) — ruta de salud de la app.
- `POST /api/auth/register` — escenarios 400/409/201.
- `POST /api/auth/login` — escenarios 400/401/200 con `bcrypt.compare`.
- `GET /api/auth/me` — protegido con `requireAuth` (401 sin token, 200 con token válido).

**Rutas montadas**  
El prefijo `/api/auth` está montado en la app principal, junto con otras rutas del proyecto.

---

### Cómo correr las pruebas

```bash
npm test
```

### Scripts configurados (referencia rápida)

```json
{
  "scripts": {
    "start": "node ./src/index.js",
    "dev": "nodemon index.js",
    "test": "cross-env NODE_ENV=test vitest run"
  }
}
```

### Dependencias de producción

| Paquete      | Versión | Estado       | Descripción breve                                          |
| ------------ | ------- | ------------ | ---------------------------------------------------------- |
| bcryptjs     | ^3.0.2  | ✅ Instalada | Hash de contraseñas en JS puro.                            |
| cors         | ^2.8.5  | ✅ Instalada | Habilita CORS para el servidor Express.                    |
| dotenv       | ^17.2.1 | ✅ Instalada | Carga variables de entorno desde `.env`.                   |
| express      | ^5.1.0  | ✅ Instalada | Framework web para Node.js.                                |
| jsonwebtoken | ^9.0.2  | ✅ Instalada | Firma y verificación de tokens JWT.                        |
| pg           | ^8.16.3 | ✅ Instalada | Cliente de PostgreSQL para Node.js.                        |
| pg-format    | ^1.0.4  | ✅ Instalada | Formateo seguro de strings SQL (placeholders estilo `%s`). |

```js
npm i bcryptjs@3.0.2 cors@2.8.5 dotenv@17.2.1 express@5.1.0 jsonwebtoken@9.0.2 pg@8.16.3 pg-format@1.0.4
```

## Fragmentos de pruebas (extractos)

> Fecha de inclusión: 2025-08-24

A continuación se muestran extractos representativos de las pruebas automatizadas (Vitest + Supertest). Cada fragmento conserva su estructura original.

**1. 400 si faltan campos**

```js
it("400 si faltan campos", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: "a@a.cl" });
  expect(res.statusCode).toBe(400);
});
```

**2. 409 si el usuario ya existe**

```js
it("409 si el usuario ya existe", async () => {
  UserModel.findUserByEmail.mockResolvedValueOnce({ id: 1, email: "a@a.cl" });
  const res = await request(app)
    .post("/api/auth/register")
    .send({ firstName: "A", lastName: "B", email: "a@a.cl", password: "123" });
  expect(res.statusCode).toBe(409);
});
```

**3. 201 si registro exitoso entrega token y user**

```js
it("201 si registro exitoso entrega token y user", async () => {
  UserModel.findUserByEmail.mockResolvedValueOnce(null);
  UserModel.createUser.mockResolvedValueOnce({
    id: 10,
    first_name: "A",
    last_name: "B",
    email: "a@a.cl",
    role_id: 2,
  });
  const res = await request(app)
    .post("/api/auth/register")
    .send({ firstName: "A", lastName: "B", email: "a@a.cl", password: "123" });
  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty("token");
  expect(res.body).toHaveProperty("user");
});
```

**4. 400 si faltan credenciales**

```js
it("400 si faltan credenciales", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "a@a.cl" });
  expect(res.statusCode).toBe(400);
});
```

**5. 401 si el usuario no existe**

```js
it("401 si el usuario no existe", async () => {
  UserModel.findUserByEmail.mockResolvedValueOnce(null);
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "a@a.cl", password: "123" });
  expect(res.statusCode).toBe(401);
});
```

**6. 401 si la contraseña es inválida**

```js
it("401 si la contraseña es inválida", async () => {
  UserModel.findUserByEmail.mockResolvedValueOnce({
    id: 1,
    email: "a@a.cl",
    password: "hashed",
  });
  bcrypt.compare.mockResolvedValueOnce(false);
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "a@a.cl", password: "mala" });
  expect(res.statusCode).toBe(401);
});
```

**7. 200 si login exitoso entrega token y user**

```js
it("200 si login exitoso entrega token y user", async () => {
  UserModel.findUserByEmail.mockResolvedValueOnce({
    id: 2,
    first_name: "A",
    last_name: "B",
    email: "a@a.cl",
    password: "hashed",
    role_id: 2,
  });
  bcrypt.compare.mockResolvedValueOnce(true);
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "a@a.cl", password: "123" });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("token");
  expect(res.body).toHaveProperty("user");
});
```

## 📊 Resumen de casos de prueba

| #   | Ruta / Endpoint           | Escenario probado                           | Código esperado |
| --- | ------------------------- | ------------------------------------------- | --------------- |
| 1   | `POST /api/auth/register` | Falta un campo requerido                    | 400             |
| 2   | `POST /api/auth/register` | Usuario ya existe                           | 409             |
| 3   | `POST /api/auth/register` | Registro exitoso, devuelve token y usuario  | 201             |
| 4   | `POST /api/auth/login`    | Faltan credenciales                         | 400             |
| 5   | `POST /api/auth/login`    | Usuario no encontrado                       | 401             |
| 6   | `POST /api/auth/login`    | Contraseña incorrecta                       | 401             |
| 7   | `POST /api/auth/login`    | Login exitoso, devuelve token y usuario     | 200             |
| 8   | `GET /`                   | Ruta de salud de la API                     | 200             |
| 9   | `GET /api/auth/me`        | Sin token en cabecera                       | 401             |
| 10  | `GET /api/auth/me`        | Con token válido, devuelve datos de usuario | 200             |
