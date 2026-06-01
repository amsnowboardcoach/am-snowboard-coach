import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src");

const replacements = [
  ["text-zinc-700", "text-zinc-400"],
  ["text-zinc-600", "text-zinc-500"],
  ["bg-zinc-100 ", "bg-zinc-900/50 "],
  ["bg-zinc-100\"", "bg-zinc-900/50\""],
  ["bg-zinc-100\n", "bg-zinc-900/50\n"],
  ['? "bg-sky-500 text-zinc-950"', '? "chip-toggle-active"'],
  ['? "bg-sky-500 text-zinc-950 shadow-sm shadow-sky-500/25"', '? "chip-toggle-active shadow-sm shadow-sky-950/25"'],
  ["border border-zinc-300 ", "border border-zinc-600/90 "],
  ["border border-zinc-400 ", "border border-zinc-600/90 "],
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
console.log(`\nUpdated ${n} files.`);
