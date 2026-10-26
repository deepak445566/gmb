import { Suspense } from "react";
import FileTool from "./file-tool";

// params is awaited inside the Suspense boundary so the page shell can still prerender
export default function FilePage({ params }: PageProps<"/file/[id]">) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Loading…</p>}>
      {params.then(({ id }) => (
        <FileTool id={id} />
      ))}
    </Suspense>
  );
}
