const minuteMs = 60 * 1000;
const hourMs = 60 * minuteMs;
const dayMs = 24 * hourMs;

export function formatRelativeTime(isoDate: string, now = new Date()): string {
  const elapsedMs = now.getTime() - new Date(isoDate).getTime();
  if (elapsedMs < minuteMs) {
    return 'just now';
  }
  if (elapsedMs < hourMs) {
    return `${Math.floor(elapsedMs / minuteMs)} min ago`;
  }
  if (elapsedMs < dayMs) {
    return `${Math.floor(elapsedMs / hourMs)} h ago`;
  }
  return new Date(isoDate).toLocaleDateString();
}
