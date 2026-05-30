import { LEGAL_CONTROLLER } from "@/constants/legal-site";
import type { LegalDocumentContent } from "@/content/legal/types";

const c = LEGAL_CONTROLLER;

export const cookiePolicyDocument: LegalDocumentContent = {
  title: "Política de cookies",
  subtitle:
    "Información sobre el uso de cookies y tecnologías similares conforme a la LSSI-CE y el RGPD.",
  sections: [
    {
      id: "que-son",
      title: "1. ¿Qué son las cookies?",
      blocks: [
        {
          type: "p",
          text: "Las cookies son pequeños archivos que se almacenan en tu dispositivo al visitar un sitio web. También usamos tecnologías similares (almacenamiento local del navegador, tokens de sesión) con fines análogos.",
        },
      ],
    },
    {
      id: "tipos",
      title: "2. Tipos de cookies que utilizamos",
      blocks: [
        {
          type: "ul",
          items: [
            "Cookies técnicas o estrictamente necesarias: imprescindibles para que el Sitio funcione (sesión, seguridad, preferencias esenciales). No requieren consentimiento.",
            "Cookies de preferencias: recuerdan elecciones como el consentimiento de cookies.",
            "Cookies de terceros: pueden instalarse al usar pagos (Stripe), inicio de sesión con Google o servicios de Firebase; se rigen por las políticas de esos proveedores.",
          ],
        },
        {
          type: "p",
          text: "En la fecha de esta política, el Sitio no utiliza cookies de publicidad comportamental ni de analítica propia más allá de las que puedan instalar los proveedores técnicos indicados.",
        },
      ],
    },
    {
      id: "tabla",
      title: "3. Relación orientativa de almacenamiento",
      blocks: [
        {
          type: "table",
          headers: ["Nombre / origen", "Finalidad", "Duración", "Tipo"],
          rows: [
            [
              "am_cookie_consent_v1 (localStorage)",
              "Guardar tu elección sobre cookies",
              "Persistente hasta borrar",
              "Preferencia",
            ],
            [
              "Firebase Auth (Google)",
              "Mantener sesión iniciada",
              "Según proveedor",
              "Técnica / tercero",
            ],
            [
              "Firebase / Firestore (Google)",
              "Funcionamiento de la app",
              "Según proveedor",
              "Técnica / tercero",
            ],
            [
              "Stripe",
              "Proceso de pago con tarjeta",
              "Sesión de pago",
              "Tercero",
            ],
            [
              "admin_gate (si aplica)",
              "Acceso protegido al panel",
              "Sesión",
              "Técnica",
            ],
            [
              "Service Worker / PWA",
              "Instalación y notificaciones push",
              "Persistente",
              "Técnica",
            ],
          ],
        },
        {
          type: "p",
          text: "Los nombres exactos pueden variar según actualizaciones técnicas. Consulta las políticas de Google, Stripe y Vercel para más detalle.",
        },
      ],
    },
    {
      id: "consentimiento",
      title: "4. Consentimiento y gestión",
      blocks: [
        {
          type: "p",
          text: "Al entrar por primera vez, mostramos un aviso informativo. Las cookies estrictamente necesarias se instalan para prestar el servicio. Puedes aceptar el aviso o configurar tu navegador para bloquear o eliminar cookies; ten en cuenta que algunas funciones (inicio de sesión, reservas, pagos) dejarán de funcionar correctamente.",
        },
        {
          type: "p",
          text: "Puedes revocar el consentimiento eliminando las cookies desde la configuración de tu navegador y borrando el almacenamiento local del Sitio.",
        },
      ],
    },
    {
      id: "navegador",
      title: "5. Cómo gestionar cookies en el navegador",
      blocks: [
        {
          type: "p",
          text: "Los principales navegadores permiten bloquear o borrar cookies desde su menú de privacidad o seguridad (Chrome, Firefox, Safari, Edge, etc.). La ayuda oficial de cada navegador describe el procedimiento.",
        },
      ],
    },
    {
      id: "mas-info",
      title: "6. Más información",
      blocks: [
        {
          type: "p",
          text: `Responsable: ${c.legalName} · ${c.email}. Para el tratamiento de datos personales asociado, consulta la Política de Privacidad.`,
        },
      ],
    },
  ],
};
