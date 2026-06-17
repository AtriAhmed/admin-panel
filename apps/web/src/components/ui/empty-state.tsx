export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-divider bg-content2 px-3 py-4 text-sm text-muted">
      {message}
    </div>
  );
}
