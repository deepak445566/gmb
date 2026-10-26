"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeftIcon, DownloadIcon, ExternalIcon, PinIcon, TrashIcon } from "@/components/icons";
import { circlePoints, parseLatLng } from "@/lib/circle";
import { deleteProfile, useProfiles } from "@/lib/profiles";
import { buildRows, downloadManyXlsx, downloadXlsx, HEADERS } from "@/lib/sheet";
import { btn, btnLight, card, input, timeAgo } from "@/lib/ui";

// 9 radius sets, 5 radii each, 100 m apart: 50–400, 500–900, 1000–1400, ... 4000–4400.
// One set = one 1800-row file = one My Maps layer (a map allows 10 layers).
const RADIUS_SETS = [
  [50, 100, 200, 300, 400],
  ...Array.from({ length: 8 }, (_, k) => Array.from({ length: 5 }, (_, j) => 500 * (k + 1) + 100 * j)),
];
const setLabel = (radii: number[]) => `${radii[0]}–${radii.at(-1)} m`;

function StepTitle({ n, done, title, hint }: { n: number; done: boolean; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${
          done ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
          ok ? "bg-accent text-accent-fg" : "border border-line text-transparent"
        }`}
      >
        ✓
      </span>
      <span className={`min-w-0 ${ok ? "" : "text-muted"}`}>{children}</span>
    </li>
  );
}

export default function FileTool({ id }: { id: string }) {
  const router = useRouter();
  const { profiles, loaded } = useProfiles();
  const [coord, setCoord] = useState("");
  const [setIndex, setSetIndex] = useState(0);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const profile = profiles.find((p) => p.id === id);
  const center = parseLatLng(coord);
  const radii = RADIUS_SETS[setIndex];
  const points = center ? radii.flatMap((r) => circlePoints(center, r)) : [];
  const rows = profile ? buildRows(profile.names, profile.descriptions, points) : [];

  async function downloadAll() {
    if (!profile || !center) return;
    setDownloadingAll(true);
    try {
      const files = RADIUS_SETS.map((set, i) => ({
        name: `${i + 1}. ${profile.title} ${set[0]}-${set.at(-1)}m.xlsx`,
        rows: buildRows(profile.names, profile.descriptions, set.flatMap((r) => circlePoints(center, r))),
      }));
      await downloadManyXlsx(files);
    } finally {
      setDownloadingAll(false);
    }
  }

  function remove() {
    if (!profile || !confirm(`"${profile.title}" delete karna hai?`)) return;
    deleteProfile(profile.id);
    router.push("/");
  }

  const shell = "mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8";
  const back = (
    <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-foreground">
      <ArrowLeftIcon /> Saved files
    </Link>
  );

  if (!loaded) {
    return (
      <main className={shell}>
        <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-2" />
        <div className={`${card} h-64 animate-pulse`} />
      </main>
    );
  }
  if (!profile) {
    return (
      <main className={shell}>
        {back}
        <p className={`${card} p-10 text-center text-muted`}>Ye file nahi mili (shayad delete ho gayi).</p>
      </main>
    );
  }

  const mismatch = points.length > 0 && profile.names.length !== points.length;

  return (
    <main className={shell}>
      {/* Header */}
      <header className="flex flex-col gap-3">
        {back}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{profile.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">{profile.names.length} names</span>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
                {profile.descriptions.length === 1 ? "1 description" : `${profile.descriptions.length} descriptions`}
              </span>
              {profile.updatedAt && (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted">
                  Saved {timeAgo(profile.updatedAt)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={remove}
            title="File delete karo"
            aria-label="File delete karo"
            className="shrink-0 cursor-pointer rounded-lg border border-line p-2.5 text-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900 dark:hover:bg-red-950/40"
          >
            <TrashIcon />
          </button>
        </div>
      </header>

      {/* Settings + Download */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className={`${card} min-w-0 divide-y divide-line`}>
          <div className="p-5 sm:p-6">
            <StepTitle n={1} done={!!center} title="Business ka coordinate" hint="Google Maps se copy karo (lat, lng)" />
            <div className="relative">
              <PinIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <input
                className={`${input} pl-10 font-mono text-base ${coord && !center ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                value={coord}
                inputMode="decimal"
                placeholder="27.49407, 77.46502"
                onChange={(e) => setCoord(e.target.value)}
              />
            </div>
            <div className="mt-2 min-h-5 text-xs text-muted">
              {coord && !center ? (
                <span className="text-red-600">Format galat hai – latitude, longitude likho (jaise 27.49407, 77.46502)</span>
              ) : center ? (
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Lat <b className="font-mono text-foreground">{center.lat}</b>
                  </span>
                  <span>
                    Lng <b className="font-mono text-foreground">{center.lng}</b>
                  </span>
                  <a
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                    href={`https://www.google.com/maps?q=${center.lat},${center.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Map pe check karo <ExternalIcon className="size-3" />
                  </a>
                </span>
              ) : (
                "Google Maps pe jagah pe right-click → upar wala number copy → yahan paste."
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <StepTitle n={2} done={!!center} title="Radius set" hint="Har set = 5 radius × 360 points = 1 file" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RADIUS_SETS.map((set, i) => (
                <button
                  key={i}
                  onClick={() => setSetIndex(i)}
                  aria-pressed={i === setIndex}
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 text-left transition ${
                    i === setIndex
                      ? "border-accent bg-accent-soft ring-2 ring-accent/20"
                      : "border-line hover:border-accent/50 hover:bg-surface-2"
                  }`}
                >
                  <span className={`block text-[11px] ${i === setIndex ? "text-accent" : "text-muted"}`}>Set {i + 1}</span>
                  <span className={`text-sm font-medium ${i === setIndex ? "text-accent" : ""}`}>{setLabel(set)}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Rows ka order: {radii.map((r) => `${r} m`).join(" → ")}
            </p>
          </div>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <section className={`${card} p-5 sm:p-6`}>
            <StepTitle n={3} done={points.length > 0} title="Download" hint="Excel – Name, Description, longitude" />
            <ul className="mb-5 flex flex-col gap-2.5 text-sm">
              <Check ok={!!center}>
                {center ? (
                  <span className="font-mono text-xs">
                    {center.lat}, {center.lng}
                  </span>
                ) : (
                  "Coordinate daalo"
                )}
              </Check>
              <Check ok>Set {setIndex + 1} · {setLabel(radii)}</Check>
              <Check ok={points.length > 0}>{points.length > 0 ? `${points.length} rows ready` : "Rows banengi"}</Check>
            </ul>
            <div className="flex flex-col gap-2">
              <button
                className={btn}
                disabled={points.length === 0}
                onClick={() => downloadXlsx(`${profile.title} ${radii[0]}-${radii.at(-1)}m.xlsx`, rows)}
              >
                <DownloadIcon /> Download Set {setIndex + 1}
              </button>
              <button className={btnLight} disabled={!center || downloadingAll} onClick={downloadAll}>
                <DownloadIcon /> {downloadingAll ? "Download ho raha hai…" : "Download All (9 files)"}
              </button>
            </div>
            {center && (
              <p className="mt-3 text-xs text-muted">Download All pe Chrome “multiple files” poochhe to Allow karna.</p>
            )}
            {mismatch && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                File mein {profile.names.length} names hain, coordinates {points.length}.{" "}
                {profile.names.length < points.length
                  ? "Names upar se dobara repeat honge."
                  : `Aakhri ${profile.names.length - points.length} names chhoot jaayenge.`}
              </p>
            )}
          </section>
        </aside>
      </div>

      {/* Preview */}
      <section className={`${card} min-w-0 overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
          <h2 className="font-semibold">Preview</h2>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{rows.length} rows</span>
          <button
            onClick={() => setShowDesc((v) => !v)}
            className="ml-auto cursor-pointer text-sm text-accent hover:underline"
          >
            {showDesc ? "Description chhupao" : "Poora description dekho"}
          </button>
        </div>
        {showDesc && (
          <p className="max-h-72 overflow-auto border-b border-line bg-surface-2 px-5 py-4 text-sm whitespace-pre-wrap text-muted">
            {profile.descriptions[0]}
          </p>
        )}
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2 text-xs text-muted uppercase">
              <tr>
                <th className="w-12 px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">{HEADERS[0]}</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">{HEADERS[1]}</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">{HEADERS[2]}</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">{HEADERS[3]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([name, desc, lng, lat], i) => (
                <tr key={i} className="transition hover:bg-surface-2/60">
                  <td className="px-4 py-2 text-xs text-muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{name}</td>
                  <td className="hidden max-w-sm px-4 py-2 text-muted md:table-cell" title={desc}>
                    <span className="line-clamp-1">{desc.replace(/\s*\n\s*/g, " · ")}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
                    {lng || <span className="text-muted/50">—</span>}
                  </td>
                  <td className="hidden px-4 py-2 font-mono text-xs sm:table-cell">{lat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
