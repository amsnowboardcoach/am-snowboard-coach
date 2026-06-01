import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src");

const replacements = [
  [
    'className="mb-8 grid grid-cols-2 gap-2 rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-2"',
    'className="nav-tabs mb-8 grid-cols-2"',
  ],
  [
    'tab === "pista"\n              ? "bg-sky-500 text-zinc-950"\n              : "text-zinc-600 hover:text-zinc-900"',
    'tab === "pista"\n              ? "nav-tab-active"\n              : "nav-tab-inactive"',
  ],
  [
    'tab === "video"\n              ? "bg-sky-500 text-zinc-950"\n              : "text-zinc-600 hover:text-zinc-900"',
    'tab === "video"\n              ? "nav-tab-active"\n              : "nav-tab-inactive"',
  ],
  [
    'border-b border-zinc-200 px-5 py-4',
    'border-b border-zinc-800/80 px-5 py-4',
  ],
  ['text-zinc-900">{video.title}', 'text-zinc-100">{video.title}'],
  ['border-t border-zinc-200 px-5 py-4 text-sm text-zinc-500', 'border-t border-zinc-800/80 px-5 py-4 text-sm text-zinc-500'],
  ['text-sm leading-relaxed text-zinc-800', 'text-sm leading-relaxed text-zinc-200'],
  [
    'max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-300 bg-white p-6 shadow-xl',
    'modal-panel',
  ],
  [
    'fixed inset-x-0 bottom-0 z-[90] border-t border-zinc-300 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:p-5',
    'fixed inset-x-0 bottom-0 z-[90] border-t border-zinc-800/90 bg-zinc-900/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:p-5',
  ],
  ['font-semibold text-zinc-900">', 'font-semibold text-zinc-100">'],
  ['leading-relaxed text-zinc-600">', 'leading-relaxed text-zinc-400">'],
  [
    'btn-outline btn-inline min-h-11 border-zinc-400 text-zinc-700 hover:border-zinc-500 hover:text-zinc-900',
    'btn-outline btn-inline min-h-11',
  ],
  [
    'mt-2 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 uppercase tracking-wider',
    'form-input mt-2 max-w-xs uppercase tracking-wider',
  ],
  [
    'rounded-full border border-zinc-400 px-5 py-2.5 text-sm text-zinc-600',
    'btn-outline btn-inline',
  ],
  [
    'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm',
    'form-input mt-1',
  ],
  [
    '<span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-950">',
    '<span className="featured-badge absolute -top-3 left-1/2 -translate-x-1/2">',
  ],
  [
    'mt-5 inline-flex w-full items-center justify-center rounded-full bg-sky-500/15 py-2.5 text-sm font-semibold text-sky-200 ring-1 ring-sky-500/30 transition hover:bg-sky-500 hover:text-zinc-950',
    'btn-warm-soft mt-5 w-full py-2.5',
  ],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith(".tsx")) files.push(p);
  }
  return files;
}

let n = 0;
for (const file of walk(root)) {
  let c = fs.readFileSync(file, "utf8");
  const before = c;
  for (const [from, to] of replacements) {
    c = c.split(from).join(to);
  }
  if (c !== before) {
    fs.writeFileSync(file, c);
    n++;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log(`\nFixed ${n} files.`);
