export type OrderStatus = "Paid" | "Pending" | "Refunded" | "Failed";

export type Order = {
  currency: string;
  customer: {
    avatar: string;
    email: string;
    name: string;
  };
  date: string;
  id: string;
  orderId: string;
  status: OrderStatus;
  total: number;
};

export const statusColors: Record<
  OrderStatus,
  "success" | "warning" | "default" | "danger"
> = {
  Failed: "danger",
  Paid: "success",
  Pending: "warning",
  Refunded: "default",
};

export const orders: readonly Order[] = [
  {
    currency: "USD",
    customer: {
      avatar: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue-light.jpg",
      email: "kate@acme.com",
      name: "Kate Moore",
    },
    date: "2025-11-28",
    id: "1",
    orderId: "#ORD-48291",
    status: "Paid",
    total: 1284.5,
  },
  {
    currency: "USD",
    customer: {
      avatar: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/sky.jpg",
      email: "john@acme.com",
      name: "John Smith",
    },
    date: "2025-11-27",
    id: "2",
    orderId: "#ORD-48290",
    status: "Pending",
    total: 429,
  },
  {
    currency: "USD",
    customer: {
      avatar: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/emerald.jpg",
      email: "sara@acme.com",
      name: "Sara Johnson",
    },
    date: "2025-11-26",
    id: "3",
    orderId: "#ORD-48289",
    status: "Refunded",
    total: 99,
  },
  {
    currency: "USD",
    customer: {
      avatar: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/rose.jpg",
      email: "emma@acme.com",
      name: "Emma Davis",
    },
    date: "2025-11-25",
    id: "4",
    orderId: "#ORD-48288",
    status: "Paid",
    total: 2495,
  },
  {
    currency: "USD",
    customer: {
      avatar: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/indigo.jpg",
      email: "alex@acme.com",
      name: "Alex Turner",
    },
    date: "2025-11-24",
    id: "5",
    orderId: "#ORD-48287",
    status: "Failed",
    total: 312.9,
  },
];
