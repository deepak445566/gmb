"use client";

import { useActionState } from "react";
import { TargetIcon } from "@/components/icons";
import { btn, card, input } from "@/lib/ui";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, "");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <form action={action} className={`${card} flex w-full max-w-sm flex-col gap-5 p-8`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-fg">
            <TargetIcon className="size-6" />
          </span>
          <h1 className="text-xl font-semibold">Admin login</h1>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="username" autoFocus className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input name="password" type="password" required autoComplete="current-password" className={input} />
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={btn}>
          {pending ? "Login ho raha hai…" : "Login"}
        </button>
      </form>
    </main>
  );
}
