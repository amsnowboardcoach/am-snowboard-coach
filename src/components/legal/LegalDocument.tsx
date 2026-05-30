import Link from "next/link";
import {
  LEGAL_LAST_UPDATED,
  LEGAL_PATHS,
  LEGAL_PRIVACY_EMAIL,
} from "@/constants/legal-site";
import type { LegalDocumentContent } from "@/content/legal/types";

function formatLegalDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderBlock(block: LegalDocumentContent["sections"][0]["blocks"][0], key: number) {
  if (block.type === "p") {
    return (
      <p key={key} className="leading-relaxed text-zinc-300">
        {block.text}
      </p>
    );
  }
  if (block.type === "ul") {
    return (
      <ul key={key} className="list-disc space-y-2 pl-5 text-zinc-300">
        {block.items.map((item) => (
          <li key={item.slice(0, 40)}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <div key={key} className="overflow-x-auto">
      <table className="w-full min-w-[280px] border-collapse text-left text-sm text-zinc-300">
        <thead>
          <tr className="border-b border-zinc-700 text-zinc-400">
            {block.headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-zinc-800/80">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface LegalDocumentProps {
  doc: LegalDocumentContent;
}

export function LegalDocument({ doc }: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 pb-24 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
        Información legal
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-50">{doc.title}</h1>
      {doc.subtitle && (
        <p className="mt-3 text-zinc-400">{doc.subtitle}</p>
      )}
      <p className="mt-4 text-sm text-zinc-500">
        Última actualización: {formatLegalDate(LEGAL_LAST_UPDATED)}
      </p>

      <nav
        className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-b border-zinc-800 pb-6 text-sm"
        aria-label="Otras políticas"
      >
        <Link href={LEGAL_PATHS.terms} className="text-sky-400 hover:underline">
          Términos de uso
        </Link>
        <Link href={LEGAL_PATHS.privacy} className="text-sky-400 hover:underline">
          Privacidad
        </Link>
        <Link href={LEGAL_PATHS.cookies} className="text-sky-400 hover:underline">
          Cookies
        </Link>
      </nav>

      <div className="prose-legal mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold text-zinc-100">{section.title}</h2>
            {section.blocks.map((block, i) => renderBlock(block, i))}
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-zinc-500">
        Estos textos se redactan conforme a la normativa española y europea aplicable
        (RGPD, LOPDGDD, LSSI-CE y normativa de consumo). Si detectas un error o
        necesitas ejercer tus derechos, escríbenos a{" "}
        <a
          href={`mailto:${LEGAL_PRIVACY_EMAIL}`}
          className="text-sky-400 hover:underline"
        >
          {LEGAL_PRIVACY_EMAIL}
        </a>
        .
      </p>
    </article>
  );
}
