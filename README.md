# 📚 Librería Patagonia — E-commerce SPA

Aplicación SPA de comercio electrónico para una librería especializada en libros, desarrollada con React 19, TypeScript y Vite. Cuenta con dos roles de usuario: cliente y administrador. Utiliza Firebase Authentication y Cloud Firestore, AWS S3 para almacenar imágenes y Vercel para el despliegue y las funciones serverless.

## 1. 🚀 Despliegue

🔗 **URL en producción:** https://libreria-m5-ft77.vercel.app/  
📦 **Repositorio:** https://github.com/jpatriciomaydana/Proyecto-M5-Juan-patricio-Maydana-FT78

## 🛒 2. Funcionalidades

### Clientes

- Registro e inicio de sesión con email y contraseña o cuenta de Google.
- Persistencia de sesión.
- Catálogo de productos con búsqueda, filtro por categoría y paginación.
- Detalle de cada libro.
- Carrito de compras: agregar productos, modificar cantidades y eliminar artículos.
- Checkout con compra simulada.
- Historial de pedidos y detalle de cada orden.
- Cancelación de pedidos según las condiciones implementadas.

### Administradores

- Acceso a un panel protegido con navegación propia.
- Visualización de indicadores de productos y pedidos.
- Alta, edición y eliminación de productos.
- Subida de imágenes a AWS S3.
- Listado de pedidos, filtro por estado y actualización de estados.

## 🛠️ 3. Tech stack

| Área | Tecnología |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8 |
| Navegación | React Router 7 |
| Estilos | Tailwind CSS 4 |
| Estado global | Context API y useReducer |
| Autenticación | Firebase Authentication |
| Base de datos | Cloud Firestore |
| Backend | Vercel Serverless Functions |
| Almacenamiento de imágenes | AWS S3, AWS SDK v3 |
| Testing | Vitest, React Testing Library, MSW |
| Calidad | ESLint, TypeScript |
| Deploy y CI | Vercel, GitHub Actions |

##📂  4. Arquitectura

### 4.1. Estructura del proyecto

La aplicación organiza el código por responsabilidades y funcionalidades. Esta es la estructura principal del repositorio:

## 📂 Arquitectura del Proyecto

```text
├── api/
│   ├── _lib/                              # Utilidades compartidas de las funciones serverless
│   ├── create-order.ts                   # Función serverless para validar y crear pedidos
│   ├── cancel-order.ts                   # Función serverless para cancelar pedidos y restaurar stock
│   └── upload-url.ts                     # Función serverless para generar URLs prefirmadas de AWS S3
│
├── scripts/
│   └── seed.ts                           # Script para cargar productos iniciales en Firestore
│
├── src/
│   ├── components/
│   │   ├── cart/
│   │   │   ├── AddToCartButton.css        # Estilos del botón para agregar productos al carrito
│   │   │   ├── AddToCartButton.tsx        # Botón para agregar productos al carrito
│   │   │   ├── CartLink.css               # Estilos del acceso al carrito
│   │   │   └── CartLink.tsx               # Acceso al carrito desde la navegación
│   │   │
│   │   ├── common/
│   │   │   ├── Avatar.tsx                 # Componente de avatar de usuario
│   │   │   ├── Button.tsx                 # Botón reutilizable
│   │   │   ├── ButtonLink.tsx             # Enlace con apariencia de botón
│   │   │   ├── EmptyState.tsx             # Estado visual para contenidos vacíos
│   │   │   ├── ErrorMessage.tsx           # Visualización de mensajes de error
│   │   │   ├── GoogleButton.tsx           # Botón para autenticación con Google
│   │   │   ├── Icons.tsx                  # Iconos reutilizables
│   │   │   ├── Input.tsx                  # Campo de entrada reutilizable
│   │   │   └── Spinner.tsx                # Indicador de carga
│   │   │
│   │   ├── layout/
│   │   │   ├── AdminLayout.css             # Estilos de la estructura administrativa
│   │   │   ├── AdminLayout.tsx             # Estructura general del panel de administración
│   │   │   ├── Footer.css                  # Estilos del pie de página
│   │   │   ├── Footer.tsx                  # Pie de página
│   │   │   ├── MainLayout.tsx              # Estructura principal de la aplicación
│   │   │   ├── Navbar.css                  # Estilos de la barra de navegación
│   │   │   ├── Navbar.tsx                  # Barra de navegación
│   │   │   └── SearchBar.tsx               # Barra de búsqueda de productos
│   │   │
│   │   ├── orders/
│   │   │   ├── OrderCard.css               # Estilos de la tarjeta de pedido
│   │   │   └── OrderCard.tsx               # Tarjeta para mostrar información de un pedido
│   │   │
│   │   └── products/
│   │       ├── CategorySidebar.tsx         # Navegación y selección de categorías
│   │       ├── ProductCard.css             # Estilos de la tarjeta de producto
│   │       ├── ProductCard.tsx             # Tarjeta para mostrar un libro
│   │       ├── ProductForm.css             # Estilos del formulario de productos
│   │       └── ProductForm.tsx             # Formulario reutilizable de productos
│   │
│   ├── contexts/
│   │   ├── authContextObject.ts            # Definición del contexto de autenticación
│   │   ├── AuthProvider.tsx                # Provider y estado de autenticación
│   │   ├── cartContextObject.ts            # Definición del contexto del carrito
│   │   ├── CartProvider.tsx                # Provider y gestión del estado del carrito
│   │   ├── cartReducer.ts                  # Reducer para las acciones del carrito
│   │   ├── orderContextObject.ts           # Definición del contexto de pedidos
│   │   ├── OrderProvider.tsx               # Provider y gestión del estado de pedidos
│   │   ├── orderReducer.ts                 # Reducer para las acciones de pedidos
│   │   ├── productContextObject.ts         # Definición del contexto de productos
│   │   ├── ProductProvider.tsx             # Provider y gestión del estado de productos
│   │   └── productReducer.ts               # Reducer para las acciones de productos
│   │
│   ├── hooks/
│   │   ├── useAuthContext.ts               # Hook para acceder al contexto de autenticación
│   │   ├── useCart.ts                      # Hook para acceder a la lógica del carrito
│   │   ├── useDebounce.ts                  # Hook para controlar la frecuencia de búsqueda
│   │   ├── useOrders.ts                    # Hook para acceder a la gestión de pedidos
│   │   └── useProducts.ts                  # Hook para acceder al catálogo de productos
│   │
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx          # Panel principal de administración
│   │   │   ├── AdminOrders.css             # Estilos de la gestión administrativa de pedidos
│   │   │   ├── AdminOrders.tsx              # Visualización y gestión de pedidos
│   │   │   ├── AdminProductForm.tsx         # Gestión del formulario de productos
│   │   │   ├── AdminProducts.css            # Estilos de la administración de productos
│   │   │   └── AdminProducts.tsx            # Listado y gestión de productos
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.tsx                    # Inicio de sesión
│   │   │   └── Register.tsx                 # Registro de usuarios
│   │   │
│   │   └── customer/
│   │       ├── Cart.css                     # Estilos de la página del carrito
│   │       ├── Cart.tsx                     # Página del carrito de compras
│   │       ├── Catalog.css                  # Estilos del catálogo
│   │       ├── Catalog.tsx                  # Página de catálogo de libros
│   │       ├── Home.tsx                     # Página de inicio
│   │       ├── OrderDetail.tsx              # Detalle de un pedido
│   │       ├── Orders.css                   # Estilos del historial de pedidos
│   │       ├── Orders.tsx                   # Historial de pedidos del cliente
│   │       ├── ProductDetail.css            # Estilos del detalle del producto
│   │       └── ProductDetail.tsx            # Página de detalle de un libro
│   │
│   ├── providers/
│   │   └── AppProviders.tsx                # Organización y composición de los providers
│   │
│   ├── routes/
│   │   ├── AdminRoute.tsx                  # Protección de rutas administrativas
│   │   └── ProtectedRoute.tsx              # Protección de rutas que requieren autenticación
│   │
│   ├── services/
│   │   ├── authService.ts                  # Operaciones de autenticación con Firebase
│   │   ├── cartService.ts                  # Operaciones de persistencia del carrito
│   │   ├── firebase.ts                     # Configuración e inicialización de Firebase
│   │   ├── imageService.ts                 # Solicitud de URLs y carga de imágenes en S3
│   │   ├── orderService.ts                 # Operaciones relacionadas con pedidos
│   │   └── productService.ts               # Operaciones de acceso a productos en Firestore
│   │
│   ├── test/
│   │   ├── components/                     # Pruebas de componentes reutilizables
│   │   ├── contexts/                       # Pruebas de providers y reducers
│   │   ├── hooks/                          # Pruebas de hooks personalizados
│   │   ├── pages/                          # Pruebas de páginas
│   │   ├── routes/                         # Pruebas de rutas y protección de acceso
│   │   ├── services/                       # Pruebas de servicios
│   │   ├── utils/                          # Pruebas de funciones auxiliares
│   │   ├── App.test.tsx                    # Pruebas de integración de la aplicación
│   │   ├── renderWithProviders.tsx         # Utilidad para renderizar con los providers
│   │   ├── server.ts                       # Configuración del servidor de MSW
│   │   └── setup.ts                        # Configuración inicial de testing
│   │
│   ├── types/
│   │   ├── cart.ts                         # Tipos relacionados con el carrito
│   │   ├── order.ts                        # Tipos relacionados con los pedidos
│   │   ├── product.ts                      # Tipos y categorías de productos
│   │   └── user.ts                         # Tipos relacionados con los usuarios
│   │
│   ├── utils/
│   │   ├── navigation.ts                   # Funciones auxiliares de navegación
│   │   ├── orders.ts                        # Utilidades para el tratamiento de pedidos
│   │   ├── productForm.ts                  # Funciones auxiliares del formulario de productos
│   │   └── text.ts                         # Utilidades para el tratamiento de texto
│   │
│   ├── App.css                             # Estilos generales de la aplicación
│   ├── App.tsx                             # Configuración de rutas y estructura principal
│   ├── index.css                           # Estilos globales
│   └── main.tsx                            # Punto de entrada de React
│
├── .env.example                            # Ejemplo de variables de entorno necesarias
├── .gitignore                              # Archivos y carpetas excluidos de Git
├── firestore.rules                         # Reglas de seguridad de Cloud Firestore
├── index.html                              # Documento HTML principal
├── package.json                            # Dependencias y scripts del proyecto
├── package-lock.json                       # Versiones bloqueadas de dependencias
├── tsconfig.json                            # Configuración de TypeScript
├── tsconfig.node.json                       # Configuración de TypeScript para Node
├── vite.config.ts                           # Configuración de Vite y testing
└── vercel.json                              # Configuración de despliegue en Vercel


### 4.2. Modelo de datos de Firestore

Las principales colecciones son:

**users/{uid}**

- `email`
- `displayName` (cuando corresponde)
- `role`: `"customer"` o `"admin"`
- `createdAt`

**products/{id}**

- `title`
- `author`
- `description`
- `price`
- `categoryId`
- `stock`
- `imageUrl`
- `isbn`
- `publisher`
- `publicationYear`
- `firstEdition`
- `createdAt`

**carts/{uid}**

Almacena los artículos del carrito y la fecha de actualización del usuario autenticado.

**orders/{id}**

- `userId`
- `items`: productos comprados con información guardada como snapshot (`productId`, título, precio y cantidad).
- `total`
- `status`: `"pending"`, `"processing"`, `"completed"` o `"cancelled"`.
- `createdAt`

Las órdenes se almacenan en una colección raíz para facilitar su consulta y administración.

### 4.3. Flujo de comunicación

La aplicación sigue esta separación de responsabilidades:

**Pantalla → Hook → Provider → Service → Firebase o API**

- Las pantallas muestran la información y gestionan la interacción del usuario.
- Los hooks permiten acceder a la funcionalidad de la aplicación.
- Los providers administran el estado global y coordinan la lógica.
- Los reducers centralizan las transiciones del estado.
- Los servicios encapsulan la comunicación con Firebase o con las funciones serverless.
- Las funciones serverless realizan las operaciones que necesitan ejecutarse de forma segura en el servidor.

La interfaz no se comunica directamente con los servicios.

### 4.4. Decisiones de diseño

**Estado global: Context API y useReducer**

Se utilizaron providers para compartir el estado y la lógica entre componentes. Los reducers permiten centralizar las transiciones del estado mediante acciones definidas, manteniendo la lógica de actualización separada de la interfaz.

Se implementaron reducers para productos, carrito y órdenes.

**Roles y autorización**

Los perfiles se almacenan en `users/{uid}`. El rol se asigna desde el proceso de registro como `customer`; no se permite que el usuario elija o modifique su propio rol para convertirse en administrador.

Las rutas protegidas del frontend controlan el acceso a las pantallas según el rol, mientras que las reglas de Firestore y las operaciones del servidor protegen los datos y las acciones.

**Subida de imágenes**

Se utiliza una función serverless para generar URLs prefirmadas de S3. La función valida el token de Firebase y el rol del administrador. El navegador utiliza la URL temporal para subir la imagen directamente a S3, sin recibir las credenciales privadas de AWS.

**Creación de pedidos y control de stock**

La transacción de compra se ejecuta en `api/create-order.ts`, utilizando Firebase Admin. El servidor valida al usuario, consulta los productos y sus precios reales, verifica el stock, descuenta las unidades y crea la orden dentro de una transacción.

La cancelación también se procesa en el servidor y contempla la restitución del stock.

## 🔧 5. Instalación y ejecución local

### Requisitos

- Node.js
- npm
- Proyecto de Firebase configurado
- Recursos y credenciales de AWS S3 para las funciones de imágenes

### Instalación

```bash
git clone https://github.com/jpatriciomaydana/Proyecto-M5-Juan-patricio-Maydana-FT78.git
cd Proyecto-M5-Juan-patricio-Maydana-FT78
npm install
```

Crear un archivo `.env` a partir de `.env.example` y completar las variables necesarias con las credenciales propias.

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

### Variables de entorno

Consultar `.env.example` para conocer los nombres exactos y las variables requeridas.

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Frontend | Identificación de la aplicación Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend | Dominio de autenticación |
| `VITE_FIREBASE_PROJECT_ID` | Frontend | Identificador del proyecto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend | Bucket configurado en Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend | Identificador del emisor de mensajes |
| `VITE_FIREBASE_APP_ID` | Frontend | Identificador de la aplicación Firebase |

| `FIREBASE_PROJECT_ID` | Backend | Proyecto utilizado por Firebase Admin |
| `FIREBASE_CLIENT_EMAIL` | Backend | Cuenta de servicio de Firebase |
| `FIREBASE_PRIVATE_KEY` | Backend | Clave privada de Firebase Admin |

| `AWS_ACCESS_KEY_ID` | Backend | Identificador de acceso a AWS |
| `AWS_SECRET_ACCESS_KEY` | Backend | Clave privada de AWS |
| `AWS_REGION` | Backend | Región del bucket S3 |
| `S3_BUCKET` | Backend | Nombre del bucket de imágenes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Seeder | Ruta al JSON de credenciales, fuera del repositorio |

Las variables con prefijo `VITE_` quedan expuestas en el bundle del navegador. Por eso, las credenciales privadas de AWS y Firebase Admin deben permanecer exclusivamente en el backend.

**Importante:** nunca se deben subir archivos `.env`, claves privadas ni credenciales al repositorio.

🖼️ Almacenamiento de Imágenes con AWS S3

El administrador selecciona una imagen en el formulario del producto.
🔐 imageService.ts solicita una URL prefirmada a POST /api/upload-url.
🛡️ La función serverless verifica el token de Firebase y comprueba que el usuario tenga rol admin.
☁️ El backend genera una Presigned URL mediante AWS SDK.
📤 El frontend utiliza esa URL para subir la imagen directamente a S3 mediante una solicitud PUT.
🔗 S3 almacena la imagen y el frontend obtiene su URL pública.
💾 La URL pública se guarda como imageUrl del producto en Firestore.

## ⚙️ 6. Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Ejecuta TypeScript y genera el build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run lint` | Ejecuta ESLint |
| `npm run test` | Ejecuta las pruebas con Vitest |
| `npm run test:watch` | Ejecuta las pruebas en modo observación |
| `npm run test:coverage` | Ejecuta las pruebas y genera el informe de cobertura |
| `npm run seed` | Ejecuta la carga inicial de productos |

## 🧪 7. Testing

Se implementaron pruebas unitarias y de integración utilizando Vitest y React Testing Library.

Entre los aspectos cubiertos se encuentran:

- Componentes que dependen de varios providers, mediante un wrapper de pruebas.
- Hooks y lógica de estado.
- Reducers y sus acciones.
- Componentes y páginas de las distintas funcionalidades.
- Flujos relacionados con el carrito y las compras.
- Servicios externos mediante mocks.
- Solicitudes a la API mediante MSW.

Los tests aíslan Firebase y otros servicios externos mediante mocks para que las pruebas sean reproducibles y no dependan de servicios reales.

### Resultados de cobertura

Última medición registrada:

| Métrica | Cobertura |
|---|---:|
| Statements | 91,34 % |
| Branches | 89,55 % |
| Functions | 93,58 % |
| Lines | 91,72 % |

**Resultado de la suite:** 444 tests aprobados en 48 archivos de prueba.

Estos porcentajes representan la cobertura del código medida por Vitest; no significan que todos los escenarios posibles estén probados.

## 🔐 8. Seguridad

- Los archivos `.env` se mantienen fuera del repositorio.
- Se utiliza `.env.example` como referencia de configuración.
- Las credenciales privadas de AWS permanecen en las funciones serverless.
- Los perfiles de usuario tienen reglas de acceso restringidas.
- El rol `customer` se asigna durante el registro y no puede ser modificado por el propio usuario.
- Las rutas administrativas están protegidas en el frontend.
- Las operaciones sensibles de pedidos y stock se ejecutan en el servidor.

### Reglas de Firestore

Las reglas restringen las operaciones sobre perfiles, productos, carritos y pedidos.

- Los usuarios pueden consultar su propio perfil, pero no modificar su rol ni eliminarlo.
- Los productos tienen lectura pública y las escrituras están restringidas a administradores.
- Cada usuario accede a su propio carrito.
- Los pedidos tienen permisos diferenciados para clientes y administradores.
- Las operaciones de creación y cancelación de pedidos se realizan desde el backend con Firebase Admin.

El archivo `firestore.rules` contiene las reglas del proyecto.

## 🌐 9. Deploy y CI

- **Hosting:** Vercel.
- **Repositorio:** GitHub.
- **Integración continua:** GitHub Actions.
- **Funciones serverless:** directorio `api/`.
- **Variables de entorno:** configuradas en el panel de Vercel.

El workflow de GitHub Actions ejecuta los controles de calidad, las pruebas y el build ante los eventos configurados en el repositorio.

### Verificaciones

El proyecto cuenta con verificaciones de:

- ESLint.
- Compilación TypeScript y build de producción.
- Suite de pruebas automatizadas.
- Cobertura de código.

## 🤖 10. Bitácora de uso de IA

Durante el desarrollo utilicé ChatGPT como apoyo para analizar decisiones, revisar la arquitectura, resolver problemas y ampliar las pruebas. Las decisiones finales se tomaron considerando los requisitos del proyecto, la estructura existente y las verificaciones realizadas.

### Entrada 1: Incorporación de autenticación con Google

- **Fecha:** [26/10/2026]
- **Herramienta de IA:** CLAUD 
- **Fase / contexto:** Autenticación e integración con Firebase.
- **Prompt que usé:** Quiero incorporar el inicio de sesión con Google a mi aplicación, respetando la arquitectura que ya tengo implementada. Necesito contemplar tanto los usuarios nuevos como los existentes, especialmente para conservar los roles almacenados en Firestore."
- **Qué respondió la IA:** Propuso incorporar `signInWithPopup`, mantener la arquitectura existente y crear el perfil de Firestore con rol `customer` únicamente para usuarios nuevos, conservando los roles de los perfiles existentes.
- **Decisión que tomé:** Incorporé el inicio de sesión con Google respetando la separación entre pantalla, hook, provider y servicio. Evité sobrescribir el rol de un administrador que ya tenía perfil.
- **Qué aprendí:** Agregar otro proveedor de autenticación no exige rehacer toda la arquitectura. También comprendí por qué es importante preservar los roles existentes.
- **Cómo lo verifiqué:** Probé el acceso con una cuenta nueva y con una cuenta administradora, comprobando que se conservara el rol existente.
- **Correcciones:** Durante las pruebas en producción aparecieron advertencias COOP y una respuesta HTTP 400. No atribuí esos mensajes directamente al login sin contar con evidencia suficiente.

### Entrada 2: Organización de productos mediante Context API

**Fecha:** [30/10/2026]

**Herramienta de IA:** ChatGPT
**Fase/contexto:** Refactorización y organización de la arquitectura de gestión de productos.
**Prompt que usé:**
"Quiero que la aplicación tenga una estructura clara, con las responsabilidades de cada capa bien separadas. Necesito saber qué alternativa es más conveniente para nuestro proyecto, que sea fácil de explicar, pero que también permita escalar. También quiero que el contexto maneje la lógica de negocio y no solamente almacene los datos."
**Qué respondió la IA:**
La IA recomendó implementar un contexto de productos completo, que centralizara las operaciones de agregar, editar y eliminar libros. Las pantallas administrativas utilizarían el hook `useProducts`, el contexto gestionaría el estado y las operaciones, y el servicio `productService` mantendría la comunicación con Firebase.
También se analizó la organización de los Providers y se aclaró que su orden depende de las relaciones entre ellos. Se propuso mantener `AuthProvider` por fuera de los demás, ya que el carrito depende de la sesión del usuario.
**Decisión que tomé:**
Elegí la alternativa completa de Context API porque permite centralizar la lógica de productos y mantener las pantallas desacopladas de Firebase. También decidí utilizar nombres de archivos `AuthProvider`, `CartProvider` y `ProductProvider`, siguiendo una organización similar a la trabajada en clase.
Respecto de la búsqueda, mantuve la consulta de texto en memoria para el alcance actual del proyecto y utilicé consultas e índices de Firestore para la combinación de categoría, ordenamiento y paginación.
**Qué aprendí:**
Comprendí mejor la separación de responsabilidades entre componentes, hooks, contextos y servicios. También aprendí que los Providers deben organizarse según sus dependencias y que utilizar Context API no significa colocar toda la lógica de Firebase dentro de las pantallas.
Además, entendí que una solución puede ser adecuada para el tamaño actual de una aplicación sin ser necesariamente la más conveniente para un crecimiento mucho mayor.
**Cómo lo verifiqué:**
Se revisó la estructura existente de los Providers y los imports del proyecto antes de realizar los cambios. La implementación se organizó en commits separados para facilitar su revisión.
**Correcciones:**
Inicialmente, la IA propuso ubicar `ProductProvider` dentro de `CartProvider`. Al analizar las dependencias, se corrigió esa recomendación: no existía una dependencia entre ambos y, si el carrito necesitaba acceder a los productos, el Provider de productos debía estar por fuera del carrito. Se estableció el orden `AuthProvider > ProductProvider > CartProvider`.

### Entrada 3: Encapsulación de Firebase y separación de responsabilidades

- **Fecha:** [04/11/2026]
- **Herramienta de IA:** Claude
- **Fase / contexto:** Refactorización y revisión de arquitectura.
- **Prompt que usé:** "Quiero revisar que la aplicación tenga una estructura clara, con las responsabilidades de cada capa bien separadas. Necesito saber qué alternativa es más conveniente para nuestro proyecto, que sea fácil de explicar, pero que también permita escalar. También quiero que el contexto maneje la lógica de negocio y no solamente almacene los datos."
- **Qué respondió la IA:** Detectó que algunos contextos todavía importaban directamente elementos de Firebase. Propuso trasladar la suscripción a los cambios de autenticación al servicio correspondiente y centralizar el tipo `User`.
- **Decisión que tomé:** Mantuve el criterio de que la interfaz no debía acceder directamente a los servicios. Encapsulé las operaciones de Firebase en `services/` y organicé la comunicación mediante hooks y providers.
- **Qué aprendí:** Cada capa tiene una responsabilidad concreta. La interfaz presenta la información, los hooks y providers exponen el estado y la lógica, y los servicios se encargan de comunicarse con Firebase o con la API.
- **Cómo lo verifiqué:** Ejecuté `npm run lint` y `npm run build`, ambos correctamente.
- **Correcciones:** La compilación correcta no demuestra por sí sola que todos los comportamientos de autenticación funcionen. Por eso distinguí entre la verificación estática y las pruebas funcionales.

### Entrada 4: Eliminación de una excepción en la separación de capas

- **Fecha:** 09/11/2026
- **Herramienta de IA:** Claude
- **Fase / contexto:** Refactorización de la arquitectura del catálogo.
- **Prompt que usé:**
  > Necesito chequear y refactorizar catalogo si es necesario, lo que hay que tener en cuenta por favor es que no hay excepxiones a la regla “la ui no habla con el servicio”. la ui nunca debe comunicarse con servicio
- **Qué respondió la IA:** Al revisar las dependencias detectó que `Catalog.tsx` importaba directamente funciones y tipos de `productService`. Propuso trasladar esa responsabilidad a la capa correspondiente.
- **Decisión que tomé:** Insistí en mantener la regla sin excepciones. Revisamos cómo integrar la lógica con el estado global de productos y elegimos utilizar `productReducer`, sin crear un contexto o reducer exclusivo para el catálogo.
- **Qué aprendí:** Una arquitectura no se respeta solamente por convención: también hay que revisar las dependencias reales. Aprendí a buscar imports directos de servicios en la interfaz y a comprobar que la refactorización haya eliminado esas dependencias.
- **Cómo lo verifiqué:** Repetí la búsqueda de imports de `services/` dentro de páginas y componentes. El resultado quedó vacío. También ejecuté lint, build y pruebas manuales en local y producción.
- **Correcciones:** La primera propuesta utilizaba estado local en `ProductProvider`. La revisamos teniendo en cuenta la organización del proyecto y el uso de reducers en otros contextos.

### Entrada 5: Protección de usuarios y roles mediante reglas de Firestore

- **Fecha:** 12/10/2026
- **Herramienta de IA:** 
- **Fase / contexto:** Seguridad de la aplicación y configuración de Firestore.
- **Prompt que usé:** Necesito revisar y reforzar la seguridad de mi aplicación utilizando las reglas de seguridad de Cloud Firestore. Quiero asegurarme de que un usuario registrado no pueda modificar su propio rol para convertirse en administrador ni acceder o modificar información de otros usuarios.
- **Qué respondió la IA:** Revisó las reglas de seguridad y señaló la importancia de impedir que un usuario pueda asignarse permisos de administrador. Se trabajó con reglas que permiten crear perfiles únicamente con el rol `customer`, restringen las actualizaciones a `displayName`, impiden eliminar perfiles y permiten leer únicamente el perfil propio. Para los productos se mantuvo la lectura pública y se bloquearon las escrituras directas desde el cliente.
- **Decisión que tomé:** Mantuve la asignación del rol de cliente durante el registro y reservé la asignación del rol administrador para una intervención controlada. También publiqué reglas que limitan las operaciones que puede realizar cada usuario.
- **Qué aprendí:** Ocultar opciones de administración en la interfaz no alcanza para proteger una aplicación. Los permisos deben controlarse también desde Firestore.
- **Cómo lo verifiqué:** Comprobé el registro y la lectura del catálogo, y revisé las reglas publicadas. La comprobación de intentos de modificar el rol desde el simulador quedó pendiente en el intercambio recuperado.
- **Correcciones:** La revisión permitió distinguir entre las operaciones permitidas para un usuario común y las que deben permanecer bloqueadas. No presento como verificada una prueba que no quedó confirmada.

### Entrada 6: Ampliación de pruebas y medición de cobertura

- **Fecha:** 10 y 11/11/2026
- **Herramienta de IA:** ChatGPT
- **Fase / contexto:** Testing, revisión de calidad y cobertura.
- **Prompt que usé:**
Quiero conocer qué porcentaje de cobertura tienen los tests de mi proyecto, no solamente cuántos tests pasan. Necesito mejorar la cobertura de manera progresiva, priorizando los archivos importantes y sin agregar tests innecesarios solo para alcanzar un porcentaje. 
- **Qué respondió la IA:** Explicó que tener todos los tests aprobados no significa que todo el código esté cubierto. Indicó cómo ejecutar Vitest con cobertura mediante `npx vitest run --coverage` y ayudó a identificar archivos con cobertura baja o nula.
- **Decisión que tomé:** Decidí no conformarme con que los tests pasaran. Quise medir la cobertura y mejorarla, priorizando los archivos que tenían menos pruebas. Incorporé pruebas para distintas áreas y utilicé mocks para aislar servicios externos, además de MSW para simular solicitudes a la API.
- **Qué aprendí:** Aprendí a diferenciar entre cantidad de tests aprobados y porcentaje de cobertura. También comprendí que probar una aplicación implica comprobar distintos comportamientos, estados y posibles errores.
- **Cómo lo verifiqué:** Ejecuté las pruebas con Vitest y el informe de cobertura. La última medición registrada alcanzó 91,34 % de statements, 89,55 % de branches, 93,58 % de functions y 91,72 % de lines. El conjunto final registrado alcanzó 444 tests aprobados en 48 archivos.
- **Correcciones:** La primera medición recuperada fue de 53,75 % en statements. Continuamos ampliando las pruebas y volvimos a medir hasta alcanzar los porcentajes finales indicados.

### Reflexión final sobre el uso de IA

La IA fue una herramienta de apoyo durante el desarrollo, especialmente para analizar alternativas, detectar problemas de arquitectura, revisar código y ampliar la cobertura de pruebas.

Sin embargo, no tomé todas sus sugerencias como correctas. En varias ocasiones tuve que señalar que una propuesta no respetaba las decisiones del proyecto o que agregaba complejidad innecesaria. También aprendí a pedir verificaciones concretas en lugar de aceptar que un cambio estaba terminado solamente porque parecía correcto.

Uno de los aprendizajes más importantes fue entender la separación de responsabilidades entre pantallas, hooks, providers y servicios. También pude comprender por qué las operaciones sensibles, como crear una orden y descontar stock, deben ejecutarse del lado del servidor.

Considero que ahora puedo explicar mejor las decisiones de arquitectura, la protección de roles, el funcionamiento de las transacciones de Firestore y la diferencia entre tests aprobados y cobertura de código.

## 11. Mejoras futuras / Extra credit

- Ampliar los escenarios de pruebas de integración y los casos límite.
- Incorporar nuevas funcionalidades de búsqueda si el volumen de productos lo requiere.
- Mejorar los indicadores y reportes del panel administrativo.
- Mejorar progresivamente la accesibilidad y la experiencia de usuario.

👨‍💻 Autor
Juan Patricio Maydana

Proyecto Integrador — Henry
Identidad del proyecto: Patagonix Tech

📝 Estado del proyecto

Librería Patagonia se encuentra desplegada en producción y cuenta con las funcionalidades principales de un e-commerce de libros: autenticación con Firebase, catálogo de productos, carrito con persistencia, compras simuladas, historial de pedidos y panel de administración.

También incorpora almacenamiento de imágenes mediante AWS S3, operaciones seguras de pedidos mediante funciones serverless, reglas de seguridad en Firestore y una suite de testing automatizado.

El proyecto integra frontend, backend serverless y servicios cloud, aplicando separación de responsabilidades y control de acceso según los roles de usuario.

Estado: aplicación desplegada en Vercel, con funcionalidades principales implementadas y pruebas automatizadas desarrolladas.