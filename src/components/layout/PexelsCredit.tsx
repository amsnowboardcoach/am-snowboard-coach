export function PexelsCredit({ photographer }: { photographer?: string }) {
  if (!photographer) return null;
  return (
    <p className="mt-2 text-right text-[10px] text-zinc-600">
      Foto: {photographer} / Pexels
    </p>
  );
}
