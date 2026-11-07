export interface OrderItemSnapshot {
    productId: string;
    title: string;
    description: string;
    price: number;
    quantity: number;
}

export type OrderStatus =
    | "pending"
    | "processing"
    | "completed"
    | "cancelled";

export interface Order {
    id: string;
    userId: string;
    items: OrderItemSnapshot[];
    total: number;
    status: OrderStatus;
    createdAt: Date;
}