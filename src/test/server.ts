import { setupServer } from "msw/node";

// Servidor falso que intercepta los fetch de los tests. No tiene handlers
// por defecto: cada test declara los suyos con server.use(...), y cualquier
// pedido sin handler hace fallar el test en vez de salir a internet.
export const server = setupServer();