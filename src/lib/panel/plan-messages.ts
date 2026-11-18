// Dashboard copy for plans, trials, limits and paused guides (phase 3 of self-serve
// signup). Spanish is the source; see PANEL_TEXT in i18n.ts.
export const PANEL_PLAN_TEXT: Readonly<
  Record<string, { en: string; fr: string }>
> = {
  "En pausa por el plan": {
    en: "Paused by your plan",
    fr: "En pause (forfait)",
  },
  "1 guía está en pausa por el límite de tu plan.": {
    en: "1 guide is paused because of your plan’s limit.",
    fr: "1 guide est en pause en raison de la limite de votre forfait.",
  },
  "{count} guías están en pausa por el límite de tu plan.": {
    en: "{count} guides are paused because of your plan’s limit.",
    fr: "{count} guides sont en pause en raison de la limite de votre forfait.",
  },
  "Nada se borró y sus códigos QR abren tu guía activa. Cambia de plan para reactivarlas.":
    {
      en: "Nothing was deleted, and their QR codes open your active guide. Change your plan to reactivate them.",
      fr: "Rien n’a été supprimé et leurs codes QR ouvrent votre guide actif. Changez de forfait pour les réactiver.",
    },
  "Ver planes": { en: "See plans", fr: "Voir les forfaits" },
  "Ver mi plan": { en: "See my plan", fr: "Voir mon forfait" },
  "Usas {owned} de 1 hospedaje de tu plan.": {
    en: "You are using {owned} of the 1 property in your plan.",
    fr: "Vous utilisez {owned} sur 1 hébergement inclus dans votre forfait.",
  },
  "Usas {owned} de {limit} hospedajes de tu plan.": {
    en: "You are using {owned} of the {limit} properties in your plan.",
    fr: "Vous utilisez {owned} des {limit} hébergements inclus dans votre forfait.",
  },
  "Tu cuenta está en la versión básica: tu guía y tu código QR siguen funcionando.":
    {
      en: "Your account is on the basic version: your guide and QR code keep working.",
      fr: "Votre compte est passé à la version de base : votre guide et votre code QR continuent de fonctionner.",
    },
  "Te queda 1 día de prueba de {plan}.": {
    en: "1 day left in your {plan} trial.",
    fr: "Il vous reste 1 jour d’essai de {plan}.",
  },
  "Te quedan {days} días de prueba de {plan}.": {
    en: "{days} days left in your {plan} trial.",
    fr: "Il vous reste {days} jours d’essai de {plan}.",
  },
  "El {date} tu cuenta pasa a la versión básica; tu guía y tu código QR siguen funcionando.":
    {
      en: "On {date} your account moves to the basic version; your guide and QR code keep working.",
      fr: "Le {date}, votre compte passe à la version de base ; votre guide et votre code QR continuent de fonctionner.",
    },
  "Continuar con {plan}": {
    en: "Continue with {plan}",
    fr: "Continuer avec {plan}",
  },
  "Prueba gratis": { en: "Free trial", fr: "Essai gratuit" },
  "En prueba": { en: "On trial", fr: "En essai" },
  "Tu prueba termina": { en: "Your trial ends", fr: "Votre essai se termine" },
  "Si no continúas, tu cuenta pasa a la versión básica: tu guía y tu código QR siguen funcionando, con 1 hospedaje y 5 servicios.":
    {
      en: "If you don’t continue, your account moves to the basic version: your guide and QR code keep working, with 1 property and 5 services.",
      fr: "Si vous ne continuez pas, votre compte passe à la version de base : votre guide et votre code QR continuent de fonctionner, avec 1 hébergement et 5 services.",
    },
  "El pago en línea llega pronto. Por ahora te contactamos para el pago (tarjeta o SINPE Móvil).":
    {
      en: "Online payment is coming soon. For now we contact you to arrange payment (card or SINPE Móvil).",
      fr: "Le paiement en ligne arrive bientôt. Pour l’instant, nous vous contactons pour le paiement (carte ou SINPE Móvil).",
    },
  "Tenemos un pago pendiente de tu plan. Escríbenos para mantenerlo activo.": {
    en: "Your plan has a pending payment. Contact us to keep it active.",
    fr: "Un paiement de votre forfait est en attente. Contactez-nous pour le garder actif.",
  },
  Escribir: { en: "Contact us", fr: "Nous écrire" },
  Hospedajes: { en: "Properties", fr: "Hébergements" },
  "{used} (sin límite)": {
    en: "{used} (no limit)",
    fr: "{used} (sans limite)",
  },
  "{used} de {limit}": { en: "{used} of {limit}", fr: "{used} sur {limit}" },
  "Confirma tu correo antes de crear un hospedaje.": {
    en: "Confirm your email before creating a property.",
    fr: "Confirmez votre e-mail avant de créer un hébergement.",
  },
  "Creaste varios hospedajes seguidos. Espera un rato e intenta de nuevo.": {
    en: "You created several properties in a row. Wait a while and try again.",
    fr: "Vous avez créé plusieurs hébergements d’affilée. Patientez un moment puis réessayez.",
  },
};
