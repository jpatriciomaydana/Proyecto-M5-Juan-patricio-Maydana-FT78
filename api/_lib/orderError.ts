// Error con código HTTP, para cortar una transacción con una respuesta clara.
// Lo comparten las funciones de pedidos (create-order y cancel-order).
export class OrderError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}