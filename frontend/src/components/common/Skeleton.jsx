export function Skeleton({ className = '' }) {
  return <div className={`animate-shimmer rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] ${className}`} />;
}