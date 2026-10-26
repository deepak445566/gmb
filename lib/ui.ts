// Shared Tailwind class strings (colors come from the tokens in app/globals.css)
export const card = "rounded-xl border border-line bg-surface shadow-sm";
export const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";
export const btn =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40";
export const btnLight =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40";
export const btnDanger =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:hover:border-red-900 dark:hover:bg-red-950/40";

// "2 ghante pehle" style relative time
export function timeAgo(iso?: string) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "abhi";
  if (s < 3600) return `${Math.floor(s / 60)} min pehle`;
  if (s < 86400) return `${Math.floor(s / 3600)} ghante pehle`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} din pehle`;
  return new Date(iso).toLocaleDateString("en-IN");
}
