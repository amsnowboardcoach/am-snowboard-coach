import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src");

const replacements = [
  ['text-sky-400 hover:underline', 'link-accent underline-offset-2 hover:underline'],
  ['text-sky-400 hover:text-sky-300', 'link-accent'],
  ['className="text-sky-400"', 'className="brand-text"'],
  [
    'rounded-full bg-sky-500 px-4 py-2.5 font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 transition duration-200 hover:bg-sky-400 active:scale-[0.98]',
    'btn-primary-md',
  ],
  [
    'flex min-h-12 items-center justify-center rounded-full bg-sky-500 px-6 text-base font-semibold text-zinc-950 shadow-lg shadow-sky-500/25 transition active:scale-[0.98] active:bg-sky-400',
    'btn-primary-md w-full',
  ],
  [
    'rounded-full bg-sky-500 px-10 py-3.5 font-semibold text-zinc-950 hover:bg-sky-400',
    'btn-primary-lg',
  ],
  [
    'mt-8 inline-flex rounded-full bg-sky-500 px-10 py-3.5 font-semibold text-zinc-950 hover:bg-sky-400',
    'btn-primary-lg mt-8 inline-flex',
  ],
  [
    'w-full rounded-full bg-sky-500 py-3 font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50',
    'btn-primary-md w-full disabled:opacity-50',
  ],
  [
    'w-full rounded-full bg-sky-500 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50',
    'btn-primary-md w-full disabled:cursor-not-allowed',
  ],
  [
    'inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400',
    'btn-primary-md shrink-0',
  ],
  [
    'mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-sky-500 px-8 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400',
    'btn-primary-md mt-6',
  ],
  [
    'relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400',
    'btn-primary-md relative cursor-pointer',
  ],
  [
    'mt-4 rounded-full bg-violet-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-violet-400 disabled:opacity-50',
    'btn-primary-md mt-4 disabled:opacity-50',
  ],
  [
    'rounded-full bg-violet-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-violet-400',
    'btn-primary-md',
  ],
  [
    'rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-8 text-center sm:p-10',
    'alert-success p-8 text-center sm:p-10',
  ],
  [
    'rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm',
    'alert-success px-4 py-3',
  ],
  [
    'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200',
    'alert-success px-4 py-3',
  ],
  [
    'rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200',
    'alert-warning px-3 py-2',
  ],
  [
    'rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100',
    'alert-warning px-4 py-3',
  ],
  [
    'rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6',
    'alert-warning p-6',
  ],
  [
    'rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6',
    'alert-warning p-6',
  ],
  [
    'border-sky-500/45 bg-gradient-to-b from-sky-500/15 to-zinc-900/50 pt-8 shadow-lg shadow-sky-500/10',
    'panel-selected pt-8',
  ],
  [
    'border-sky-500/45 bg-gradient-to-b from-sky-500/15 to-zinc-900/50 shadow-lg shadow-sky-500/10',
    'panel-selected',
  ],
  [
    'rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30',
    'btn-success-soft',
  ],
  [
    'rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50',
    'btn-success-soft disabled:opacity-50',
  ],
  [
    'rounded-full bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 transition duration-200 hover:bg-sky-500/25',
    'btn-accent-soft',
  ],
  [
    'inline-flex size-8 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold text-sky-300 ring-1 ring-sky-500/30',
    'inline-flex size-8 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold brand-text ring-1 ring-sky-500/30',
  ],
  ['text-sm text-red-400', 'text-sm text-red-300'],
  ['text-red-400', 'text-red-300'],
  [
    'inline-flex min-h-12 items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 font-semibold text-zinc-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-400',
    'btn-primary-lg',
  ],
  [
    'flex min-h-12 w-full touch-manipulation items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 text-center font-semibold text-zinc-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-400 active:scale-[0.98] sm:w-auto',
    'btn-primary-lg w-full sm:w-auto',
  ],
  [
    'inline-flex min-h-12 w-full items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 font-semibold text-zinc-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-400 sm:w-auto',
    'btn-primary-lg w-full sm:w-auto',
  ],
  [
    'inline-flex rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400',
    'btn-primary-lg text-sm',
  ],
  [
    'inline-flex rounded-full bg-sky-500 px-10 py-3.5 font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400',
    'btn-primary-lg',
  ],
  [
    'mt-6 inline-flex rounded-full bg-sky-500 px-10 py-3.5 font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400',
    'btn-primary-lg mt-6 inline-flex',
  ],
  [
    'min-h-12 w-full touch-manipulation rounded-full bg-sky-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-[0.98] sm:min-h-11 sm:w-auto sm:py-3 sm:shadow-none',
    'btn-primary-md w-full sm:w-auto',
  ],
  [
    'mt-5 min-h-12 w-full touch-manipulation rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:opacity-50 sm:w-auto',
    'btn-primary-md mt-5 w-full disabled:opacity-50 sm:w-auto',
  ],
  [
    'min-h-11 flex-1 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50',
    'btn-primary-md min-h-11 flex-1 disabled:opacity-50',
  ],
  [
    'mt-8 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-sky-400',
    'btn-primary-md mt-8',
  ],
  [
    'mt-4 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50',
    'btn-primary-md mt-4 disabled:opacity-50',
  ],
  [
    'rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50',
    'btn-primary-sm disabled:opacity-50',
  ],
  [
    'rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50',
    'btn-primary-sm disabled:opacity-50',
  ],
  [
    'rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400',
    'btn-primary-sm',
  ],
  [
    'mt-6 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950',
    'btn-primary-md mt-6',
  ],
  ['border-violet-500/50', 'border-sky-500/40'],
  ['text-violet-200', 'text-sky-200'],
  ['text-violet-300', 'text-sky-300'],
  ['hover:bg-violet-500/10', 'hover:bg-sky-500/10'],
  ['border-violet-500/30 bg-violet-500/5', 'border-sky-500/30 bg-sky-500/5'],
  ['border-violet-500/30 bg-violet-500/10', 'border-sky-500/30 bg-sky-500/10'],
  ['bg-violet-500/20', 'bg-sky-500/20'],
  ['rounded-xl border border-violet-500/30 bg-violet-500/5 p-5', 'panel-highlight p-5'],
  ['border-t border-zinc-200 bg-violet-500/5', 'border-t border-zinc-800 bg-sky-500/5'],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  const before = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content !== before) {
    fs.writeFileSync(file, content);
    changed++;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log(`\nUpdated ${changed} files.`);
