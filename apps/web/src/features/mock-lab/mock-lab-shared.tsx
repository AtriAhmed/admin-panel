import type { MockOrder, MockOrderStatus } from "@/lib/mock/schemas";

const statusClasses: Record<MockOrderStatus, string> = {
  Failed: "border-danger/30 bg-danger/10 text-danger",
  Paid: "border-success/30 bg-success/10 text-success",
  Pending: "border-warning/30 bg-warning/10 text-warning",
  Refunded: "border-secondary/30 bg-secondary/10 text-secondary",
};

export function MockStatusBadge({ status }: { status: MockOrderStatus }) {
  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

export function MockOrderList({
  onSelect,
  orders,
  selectedOrderId,
}: {
  onSelect?: (id: string) => void;
  orders: MockOrder[];
  selectedOrderId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-divider bg-content1">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-content2 text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              className={
                selectedOrderId === order.id ? "bg-primary/10" : "border-t border-divider"
              }
              key={order.id}
            >
              <td className="px-4 py-3">
                <button
                  className="font-medium text-primary"
                  onClick={() => onSelect?.(order.id)}
                  type="button"
                >
                  {order.orderId}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">{order.customer.name}</span>
                  <span className="text-muted text-xs">{order.customer.email}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <MockStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {new Intl.NumberFormat("en-US", {
                  currency: order.currency,
                  style: "currency",
                }).format(order.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MockPanel({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-divider bg-content1 p-5">
      {eyebrow ? <p className="text-muted text-xs font-semibold uppercase">{eyebrow}</p> : null}
      <h2 className="text-foreground mt-1 text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function OperationsEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-divider bg-content2 px-3 py-4 text-sm text-muted">
      {message}
    </div>
  );
}
