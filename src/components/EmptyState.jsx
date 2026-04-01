/**
 * Reusable empty state component for lists, searches, etc.
 */
export default function EmptyState({ emoji = "🌿", title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <span className="text-6xl mb-4 block">{emoji}</span>
      <p className="text-foreground text-lg font-bold mb-2">{title}</p>
      {description && (
        <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">{description}</p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}