export type PassportUpdateMessageInput = {
  trickUpdateCount: number;
  sectionNoteCount: number;
  highlightTrickName?: string;
};

export type PassportUpdateCopy = {
  title: string;
  pushBody: string;
  emailBody: string;
};

const TITLE = "¡Tu pasaporte de trucos ha cambiado!";

function pluralTrucos(n: number): string {
  return `${n} truco${n > 1 ? "s" : ""}`;
}

function pluralSecciones(n: number): string {
  return `${n} sección${n > 1 ? "es" : ""}`;
}

/** Textos para push y email tras publicar cambios del coach. */
export function buildPassportUpdateMessage(
  input: PassportUpdateMessageInput,
): PassportUpdateCopy {
  const { trickUpdateCount, sectionNoteCount, highlightTrickName } = input;

  if (
    trickUpdateCount === 1 &&
    sectionNoteCount === 0 &&
    highlightTrickName?.trim()
  ) {
    const name = highlightTrickName.trim();
    return {
      title: TITLE,
      pushBody: `Alejandro ha actualizado «${name}». Entra en tu área para verlo.`,
      emailBody: `Alejandro ha actualizado el truco «${name}» en tu pasaporte de trucos. Ya puedes ver el nuevo estado y sus notas en tu área de alumno.`,
    };
  }

  const parts: string[] = [];
  if (trickUpdateCount > 0) {
    parts.push(pluralTrucos(trickUpdateCount));
  }
  if (sectionNoteCount > 0) {
    parts.push(
      sectionNoteCount === 1
        ? "notas de una sección"
        : `notas de ${pluralSecciones(sectionNoteCount)}`,
    );
  }

  const summary =
    parts.length > 0
      ? parts.join(" y ")
      : "novedades en tu pasaporte";

  return {
    title: TITLE,
    pushBody: `Alejandro ha publicado cambios (${summary}). Entra en tu área para verlos.`,
    emailBody: `Alejandro ha actualizado tu pasaporte de trucos: ${summary}. Entra en tu área de alumno para ver el progreso y las notas del coach.`,
  };
}
