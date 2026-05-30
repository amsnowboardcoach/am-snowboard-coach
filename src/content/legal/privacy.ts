import { LEGAL_CONTROLLER } from "@/constants/legal-site";
import type { LegalDocumentContent } from "@/content/legal/types";

const c = LEGAL_CONTROLLER;

export const privacyPolicyDocument: LegalDocumentContent = {
  title: "Política de privacidad",
  subtitle:
    "Información sobre el tratamiento de datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).",
  sections: [
    {
      id: "responsable",
      title: "1. Responsable del tratamiento",
      blocks: [
        {
          type: "ul",
          items: [
            `Responsable: ${c.legalName}`,
            `NIF: ${c.taxId}`,
            `Domicilio: ${c.address}`,
            `Correo de contacto y ejercicio de derechos: ${c.email}`,
            `Sitio web: ${c.website}`,
          ],
        },
      ],
    },
    {
      id: "delegado",
      title: "2. Delegado de protección de datos",
      blocks: [
        {
          type: "p",
          text: "No está previsto el nombramiento de Delegado de Protección de Datos. Para cualquier cuestión relativa a privacidad puedes contactar en la dirección de correo indicada.",
        },
      ],
    },
    {
      id: "finalidades",
      title: "3. Finalidades y bases jurídicas",
      blocks: [
        {
          type: "table",
          headers: ["Finalidad", "Datos", "Base jurídica"],
          rows: [
            [
              "Gestionar cuenta de usuario y área de alumno",
              "Identificación, email, nombre, foto, rol, progreso, vídeos",
              "Ejecución de contrato / relación precontractual (art. 6.1.b RGPD)",
            ],
            [
              "Reservas, pagos y facturación",
              "Datos de reserva, importe, email, nombre, NIF si factura",
              "Contrato y obligación legal fiscal (art. 6.1.b y 6.1.c)",
            ],
            [
              "Comunicaciones operativas (email, push)",
              "Email, tokens FCM, preferencias",
              "Contrato y consentimiento para push (art. 6.1.b y 6.1.a)",
            ],
            [
              "La Tribu y mercadillo",
              "Contenido publicado, comentarios, likes, datos de contacto en anuncios",
              "Contrato y consentimiento al publicar (art. 6.1.b y 6.1.a)",
            ],
            [
              "Moderación y seguridad",
              "Logs técnicos, contenido reportado",
              "Interés legítimo (art. 6.1.f) y obligación legal",
            ],
            [
              "Atención de consultas (WhatsApp, email)",
              "Datos que nos facilites",
              "Consentimiento o interés legítimo según el caso",
            ],
          ],
        },
      ],
    },
    {
      id: "categorias",
      title: "4. Categorías de datos y origen",
      blocks: [
        {
          type: "p",
          text: "Tratamos datos identificativos, de contacto, de perfil deportivo, de reservas y pago, contenido multimedia que subas, datos técnicos de dispositivo y cookies (ver Política de Cookies). Los datos proceden de ti, de tu uso del Sitio o de proveedores de autenticación (Google) cuando eliges iniciar sesión con ellos.",
        },
        {
          type: "p",
          text: "No es obligatorio facilitar datos más allá de los necesarios para cada servicio, pero sin ellos no podremos prestarlo (por ejemplo, sin email no hay cuenta ni confirmación de reserva).",
        },
      ],
    },
    {
      id: "destinatarios",
      title: "5. Destinatarios y encargados del tratamiento",
      blocks: [
        {
          type: "p",
          text: "Podemos comunicar datos a proveedores que nos prestan servicios, con contrato de encargo de tratamiento cuando proceda:",
        },
        {
          type: "ul",
          items: [
            "Google Firebase / Google Cloud (autenticación, base de datos, almacenamiento, mensajería push, calendario).",
            "Stripe (pagos con tarjeta).",
            "Vercel u otro proveedor de hosting del Sitio.",
            "Google (OAuth, Calendar API, Gmail SMTP para emails transaccionales).",
            "Proveedores de imágenes o APIs auxiliares si se utilizan en el Sitio.",
          ],
        },
        {
          type: "p",
          text: "También podremos comunicar datos a Administraciones públicas cuando exista obligación legal.",
        },
      ],
    },
    {
      id: "transferencias",
      title: "6. Transferencias internacionales",
      blocks: [
        {
          type: "p",
          text: "Algunos proveedores (p. ej. Google, Stripe, Vercel) pueden tratar datos en Estados Unidos u otros países. En esos casos se aplican garantías adecuadas reconocidas por la Comisión Europea (cláusulas contractuales tipo, decisiones de adecuación o certificaciones), según la información publicada por cada proveedor.",
        },
      ],
    },
    {
      id: "plazos",
      title: "7. Plazos de conservación",
      blocks: [
        {
          type: "ul",
          items: [
            "Cuenta de usuario: mientras mantengas la cuenta; tras baja, bloqueo o supresión en un plazo razonable salvo obligación de conservación.",
            "Reservas y facturación: plazos legales de conservación mercantil y fiscal (habitualmente hasta 6 años).",
            "Contenido de La Tribu / mercadillo: mientras esté publicado; los anuncios vendidos se eliminan del listado.",
            "Comentarios e interacciones anónimas de visitantes: mientras sean necesarios para el servicio.",
            "Logs y copias de seguridad: plazos técnicos limitados.",
          ],
        },
      ],
    },
    {
      id: "derechos",
      title: "8. Derechos de las personas interesadas",
      blocks: [
        {
          type: "p",
          text: "Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento, portabilidad (cuando aplique) y a no ser objeto de decisiones basadas únicamente en el tratamiento automatizado, enviando solicitud a " +
            c.email +
            " con copia de documento identificativo. Responderemos en el plazo máximo de un mes, prorrogable según complejidad.",
        },
        {
          type: "p",
          text: "Si consideras que no hemos atendido correctamente tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).",
        },
      ],
    },
    {
      id: "menores",
      title: "9. Menores de edad",
      blocks: [
        {
          type: "p",
          text: "Los servicios no están dirigidos a menores de 14 años sin consentimiento de padres o tutores. Las clases de snowboard en estación pueden requerir autorización parental según normativa de la estación. Si detectamos datos de menores sin base válida, procederemos a su eliminación.",
        },
      ],
    },
    {
      id: "seguridad",
      title: "10. Medidas de seguridad",
      blocks: [
        {
          type: "p",
          text: "Aplicamos medidas técnicas y organizativas apropiadas (acceso restringido, HTTPS, reglas de seguridad en base de datos, autenticación). Ningún sistema es 100 % invulnerable; te recomendamos usar contraseñas robustas y no compartir tus credenciales.",
        },
      ],
    },
    {
      id: "actualizacion",
      title: "11. Actualización de esta política",
      blocks: [
        {
          type: "p",
          text: "Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en el Sitio con la fecha de revisión. Te notificaremos cambios sustanciales cuando sea legalmente requerido.",
        },
      ],
    },
  ],
};
