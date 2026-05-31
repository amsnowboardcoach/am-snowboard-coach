import {
  BOOKING_BALANCE_ON_SLOPE,
  BOOKING_DEPOSIT_PERCENT,
} from "@/constants/booking-payment";
import { BOOKING_MEETING_POINT, BOOKING_NOT_INCLUDED } from "@/constants/booking-info";
import { LEGAL_CONTROLLER } from "@/constants/legal-site";
import type { LegalDocumentContent } from "@/content/legal/types";

const c = LEGAL_CONTROLLER;

export const termsOfUseDocument: LegalDocumentContent = {
  title: "Términos de uso y aviso legal",
  subtitle: `Condiciones de uso del sitio web y servicios digitales de ${c.tradeName}.`,
  sections: [
    {
      id: "aviso-legal",
      title: "1. Datos identificativos (LSSI-CE)",
      blocks: [
        {
          type: "p",
          text: `En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa que el titular de este sitio web es:`,
        },
        {
          type: "ul",
          items: [
            `Titular: ${c.legalName}`,
            `NIF: ${c.taxId}`,
            `Domicilio: ${c.address}`,
            `Correo electrónico: ${c.email}`,
            `Teléfono: ${c.phone}`,
            `Actividad: ${c.activity}`,
            `Sitio web: ${c.website}`,
          ],
        },
      ],
    },
    {
      id: "objeto",
      title: "2. Objeto y aceptación",
      blocks: [
        {
          type: "p",
          text: `El presente documento regula el acceso y uso del sitio web ${c.website} (en adelante, el «Sitio»), así como los servicios ofrecidos a través del mismo: información sobre clases de snowboard, reserva de clases y video corrección, área privada de alumno, comunidad «La Tribu», mercadillo entre usuarios registrados y demás funcionalidades que se incorporen.`,
        },
        {
          type: "p",
          text: "El acceso al Sitio o el uso de sus servicios implica la aceptación plena de estos Términos de Uso y de la Política de Privacidad y la Política de Cookies, que forman parte integrante del mismo. Si no estás de acuerdo, debes abstenerte de utilizar el Sitio.",
        },
      ],
    },
    {
      id: "servicios",
      title: "3. Descripción de los servicios",
      blocks: [
        {
          type: "ul",
          items: [
            "Clases de snowboard en Sierra Nevada (Granada): solicitud de reserva online con calendario de disponibilidad en tiempo real; la plaza en agenda se formaliza cuando el coach acepta la solicitud y se ha completado el pago con tarjeta acordado (señal o total), salvo acuerdo distinto.",
            "Video corrección: solicitud y pago tras confirmación del coach; el material se gestiona en el área de alumno.",
            "Cuenta de alumno: pasaporte de trucos, historial de vídeos, notificaciones push opcionales y contacto con el coach.",
            "La Tribu: publicación de fotos y vídeos por alumnos registrados (con moderación); interacción pública limitada según las reglas del Sitio.",
            "Mercadillo: anuncios entre usuarios registrados; las transacciones son directas entre particulares sin intermediación de pago por parte del titular.",
          ],
        },
        {
          type: "p",
          text: `${BOOKING_NOT_INCLUDED} El transporte no está incluido salvo indicación expresa. Punto de encuentro habitual: ${BOOKING_MEETING_POINT}. Las condiciones prácticas se detallan en el proceso de reserva y en las comunicaciones del coach.`,
        },
      ],
    },
    {
      id: "cuenta",
      title: "4. Registro y cuenta de usuario",
      blocks: [
        {
          type: "p",
          text: "Para reservar clases, publicar en La Tribu o en el mercadillo, y acceder al área de alumno, es necesario crear una cuenta (Google o email y contraseña). Debes facilitar datos veraces y mantener la confidencialidad de tus credenciales.",
        },
        {
          type: "p",
          text: "Eres responsable de toda actividad realizada con tu cuenta. El titular puede suspender o eliminar cuentas que incumplan estos términos, publiquen contenido ilícito o perjudiquen a otros usuarios o a la imagen del servicio.",
        },
        {
          type: "p",
          text: "Las reservas de clase en la web están limitadas a usuarios con cuenta de alumno autenticada, conforme al flujo técnico del Sitio.",
        },
      ],
    },
    {
      id: "reservas-pagos",
      title: "5. Reservas, disponibilidad, precios y pagos",
      blocks: [
        {
          type: "p",
          text: "El proceso de reserva de clases en pista requiere cuenta de alumno autenticada. La disponibilidad de días y turnos se muestra únicamente en el calendario del formulario de reserva, con carácter orientativo y en tiempo real según la agenda del coach; puede variar hasta que el coach acepte la solicitud y se formalice el pago cuando corresponda.",
        },
        {
          type: "p",
          text: "Al enviar una solicitud de reserva eliges duración, día(s), turno, estilo de clase, número de personas y forma de pago. La solicitud no garantiza plaza hasta que el coach la acepte expresamente y, cuando proceda, se haya completado el pago con tarjeta previsto (señal o importe total). Recibirás comunicaciones por email (y, en su caso, invitación de calendario) cuando la reserva quede confirmada.",
        },
        {
          type: "p",
          text: `Tras enviar la solicitud, cuando el pago online esté habilitado, podrás abonar con tarjeta a través de Stripe (proveedor externo de pagos seguros, distinto del titular del Sitio). Las modalidades habituales son: (a) señal del ${BOOKING_DEPOSIT_PERCENT} % del importe total de la reserva, con el resto en ${BOOKING_BALANCE_ON_SLOPE}; o (b) pago del importe total en el momento de la solicitud. El importe exacto a cargar con tarjeta se indica antes de completar el pago.`,
        },
        {
          type: "p",
          text: `El cobro con tarjeta en el momento de la solicitud registra el pago según la opción elegida (señal o pago total), pero la plaza en calendario se formaliza cuando el coach acepta la reserva. Si el coach rechaza la solicitud, se aplicará la política de devolución que corresponda al pago realizado. En el caso de señal, el saldo pendiente se abona en ${BOOKING_BALANCE_ON_SLOPE} el día acordado, salvo que hubieras pagado el importe total con tarjeta.`,
        },
        {
          type: "p",
          text: "Los precios publicados en el Sitio son orientativos; el importe definitivo de tu solicitud depende de la duración, número de días, turnos y personas en pista (incluidos suplementos por participantes adicionales según la modalidad). Reservas de varios días se gestionan como un conjunto vinculado en el proceso de pago cuando corresponda.",
        },
        {
          type: "p",
          text: "También puedes contactar con el coach por WhatsApp u otros canales indicados en el Sitio para consultas o gestiones; las condiciones de pago acordadas por esos medios deben ser coherentes con lo comunicado por el titular.",
        },
        {
          type: "p",
          text: "Las facturas simplificadas o completas, cuando proceda, se emiten conforme a la normativa fiscal española con los datos que facilites. Las condiciones de cancelación, cambio de fecha, no presentación o reembolso (total o parcial de señal o pago con tarjeta) se comunican en el proceso de reserva, por email o por los canales de contacto habituales, sin perjuicio de tus derechos como consumidor.",
        },
      ],
    },
    {
      id: "contenidos-usuario",
      title: "6. Contenidos aportados por usuarios",
      blocks: [
        {
          type: "p",
          text: "Al subir fotos, vídeos, comentarios, anuncios del mercadillo u otro contenido, declaras que tienes derecho a hacerlo (incluido consentimiento de personas identificables y de titulares de derechos de imagen), que el contenido no vulnera la ley ni derechos de terceros y que aceptas las condiciones específicas mostradas en el momento de la publicación.",
        },
        {
          type: "p",
          text: "Concedes al titular una licencia no exclusiva, gratuita y limitada al funcionamiento del Sitio (almacenar, mostrar, moderar y eliminar). El titular puede retirar contenido que considere inadecuado. Los anuncios del mercadillo se eliminan automáticamente al marcarlos como vendidos.",
        },
        {
          type: "p",
          text: "El mercadillo es un tablón entre usuarios: el titular no es parte en la compraventa, no verifica productos ni garantiza transacciones entre particulares.",
        },
      ],
    },
    {
      id: "propiedad",
      title: "7. Propiedad intelectual e industrial",
      blocks: [
        {
          type: "p",
          text: `Los contenidos del Sitio (textos, diseño, logotipos, vídeos del coach, estructura, software) son propiedad del titular o de sus licenciantes y están protegidos por la legislación de propiedad intelectual. Queda prohibida su reproducción o explotación sin autorización.`,
        },
        {
          type: "p",
          text: "Las marcas de terceros citadas en el Sitio pertenecen a sus respectivos titulares.",
        },
      ],
    },
    {
      id: "responsabilidad",
      title: "8. Responsabilidad",
      blocks: [
        {
          type: "p",
          text: "El snowboard es una actividad con riesgo inherente. El alumno debe disponer de seguro y material adecuados, seguir las indicaciones del coach y las normas de la estación. El titular no se hace responsable de lesiones derivadas del deporte cuando se hayan adoptado las medidas de seguridad razonables en clase.",
        },
        {
          type: "p",
          text: "El Sitio se ofrece «tal cual», con esfuerzos razonables de disponibilidad del servicio digital. La información del calendario de reservas puede contener errores puntuales de sincronización; prevalece la confirmación o rechazo expresa del coach. El titular no responde de fallos de proveedores externos (hosting, Firebase, Stripe, Google Calendar, operadores de red).",
        },
        {
          type: "p",
          text: "En la medida permitida por la ley, la responsabilidad del titular por daños derivados del uso del Sitio se limita a los importes abonados por el usuario al titular en los doce meses anteriores al hecho causante, salvo dolo o negligencia grave o daños a personas consumidoras no renunciables.",
        },
      ],
    },
    {
      id: "enlaces",
      title: "9. Enlaces y servicios de terceros",
      blocks: [
        {
          type: "p",
          text: "El Sitio puede enlazar a sitios o servicios de terceros (WhatsApp, Stripe, Google, etc.). Su uso se rige por las condiciones de esos terceros. El titular no controla ni asume responsabilidad por su contenido o políticas.",
        },
      ],
    },
    {
      id: "modificaciones",
      title: "10. Modificaciones",
      blocks: [
        {
          type: "p",
          text: "El titular puede modificar estos Términos, las tarifas y las funcionalidades del Sitio. Los cambios relevantes se publicarán en el Sitio con indicación de fecha de actualización. El uso continuado tras los cambios implica aceptación, salvo derechos irrenunciables del consumidor.",
        },
      ],
    },
    {
      id: "ley",
      title: "11. Ley aplicable y jurisdicción",
      blocks: [
        {
          type: "p",
          text: "Estos términos se rigen por la legislación española. Para consumidores residentes en España, serán competentes los tribunales del domicilio del consumidor. En otros supuestos, las partes se someten a los Juzgados y Tribunales de Granada, salvo norma imperativa en contrario.",
        },
      ],
    },
    {
      id: "contacto",
      title: "12. Contacto",
      blocks: [
        {
          type: "p",
          text: `Para consultas sobre estos términos: ${c.email} · ${c.phone}. Para protección de datos, consulta la Política de Privacidad.`,
        },
      ],
    },
  ],
};
