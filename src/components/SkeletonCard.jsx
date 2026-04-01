export default function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse" aria-hidden="true">
      <div className="w-full h-28 bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-muted rounded-full" />
        <div className="h-4 w-full bg-muted rounded-full" />
        <div className="h-4 w-3/4 bg-muted rounded-full" />
        <div className="h-5 w-24 bg-muted rounded-full" />
        <div className="h-3 w-32 bg-muted rounded-full" />
        <div className="h-3 w-28 bg-muted rounded-full" />
        <div className="h-10 w-full bg-muted rounded-xl mt-1" />
      </div>
    </div>
  );
}