export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-400/10 text-emerald-400",
    running: "bg-blue-400/10 text-blue-400",
    pending: "bg-gray-400/10 text-gray-400",
    failed: "bg-red-400/10 text-red-400",
    skipped: "bg-yellow-400/10 text-yellow-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}
    >
      {status === "running" && (
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
      )}
      {status}
    </span>
  );
}
