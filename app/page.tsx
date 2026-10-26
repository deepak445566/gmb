"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon, SheetIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { deleteProfile, saveProfile, useProfiles } from "@/lib/profiles";
import { importNameSheet } from "@/lib/sheet";
import { card, input, timeAgo } from "@/lib/ui";

export default function Home() {
  const router = useRouter();
  const { profiles, loaded } = useProfiles();
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");

  const shown = profiles.filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()));

  async function onImport(file: File | undefined) {
    if (!file) return;
    setImportError("");
    if (!/\.xlsx$/i.test(file.name)) return setImportError("Sirf .xlsx file chalegi");
    setImporting(true);
    try {
      const { names, descriptions } = await importNameSheet(file);
      if (names.length === 0) throw new Error("File mein koi Name nahi mila");
      const title = file.name.replace(/\.xlsx$/i, "");
      // re-importing a file with the same name replaces the saved copy
      const id = profiles.find((p) => p.title === title)?.id ?? crypto.randomUUID();
      saveProfile({ id, title, names, descriptions });
      router.push(`/file/${id}`);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import fail ho gaya");
      setImporting(false);
    }
  }

  function remove(id: string, title: string) {
    if (confirm(`"${title}" delete karna hai?`)) deleteProfile(id);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Saved files</h1>
        <p className="max-w-2xl text-muted">
          Name aur Description wali xlsx ek baar import karo. Phir kabhi bhi file kholo, coordinate daalo aur My Maps ke
          liye Excel download karo.
        </p>
      </header>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onImport(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/60 hover:bg-accent-soft/50"
        }`}
      >
        <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
          <UploadIcon className="size-6" />
        </span>
        <span className="font-medium">
          {importing ? "Import ho raha hai…" : "xlsx file yahan drop karo ya click karke chuno"}
        </span>
        <span className="text-sm text-muted">
          Columns: <code className="rounded bg-surface-2 px-1">Name</code>,{" "}
          <code className="rounded bg-surface-2 px-1">Description</code> · Same naam ki file dobara import karoge to
          update ho jaayegi
        </span>
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          disabled={importing}
          onChange={(e) => {
            onImport(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {importError && (
        <p className="-mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {importError}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-lg font-semibold">
            Files <span className="text-muted">{loaded ? `(${profiles.length})` : ""}</span>
          </h2>
          {profiles.length > 3 && (
            <div className="relative w-full sm:w-64">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                className={`${input} pl-9`}
                placeholder="File dhundo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {!loaded ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${card} h-32 animate-pulse`} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <p className={`${card} p-10 text-center text-sm text-muted`}>
            Abhi koi file save nahi hai. Upar xlsx import karo.
          </p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted">&ldquo;{query}&rdquo; naam ki koi file nahi mili.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <div
                key={p.id}
                className={`${card} group relative transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md`}
              >
                <Link href={`/file/${p.id}`} className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start gap-3 pr-8">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                      <SheetIcon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.title}</p>
                      <p className="text-xs text-muted">{timeAgo(p.updatedAt)}</p>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted">{p.names.slice(0, 4).join(" · ")}</p>
                  <div className="mt-auto flex gap-2 text-xs">
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">{p.names.length} names</span>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
                      {p.descriptions.length === 1 ? "1 description" : `${p.descriptions.length} descriptions`}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => remove(p.id, p.title)}
                  title="Delete"
                  aria-label={`Delete ${p.title}`}
                  className="absolute top-4 right-4 cursor-pointer rounded-md p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100 dark:hover:bg-red-950/40"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
