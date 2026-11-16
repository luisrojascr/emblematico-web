import { PANEL_EDITOR_TEXT } from "./editor-messages";

export const PANEL_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
] as const;

export type PanelLanguage = (typeof PANEL_LANGUAGES)[number]["value"];
export const PANEL_LANGUAGE_COOKIE = "emblematico-panel-language";
export const PANEL_LOCALES: Record<PanelLanguage, string> = {
  es: "es-CR",
  en: "en-US",
  fr: "fr-FR",
};

export function isPanelLanguage(value: unknown): value is PanelLanguage {
  return PANEL_LANGUAGES.some((language) => language.value === value);
}

export function panelLanguage(value: unknown): PanelLanguage {
  return isPanelLanguage(value) ? value : "es";
}

// Spanish source strings are also the fallback. Only interface copy belongs
// here: property names, guide content and other customer data stay verbatim.
export const PANEL_TEXT: Readonly<Record<string, { en: string; fr: string }>> =
  {
    ...PANEL_EDITOR_TEXT,
    "Idioma del panel": {
      en: "Dashboard language",
      fr: "Langue du tableau de bord",
    },
    Inicio: { en: "Home", fr: "Accueil" },
    "Mis hospedajes": { en: "My properties", fr: "Mes hébergements" },
    Productos: { en: "Products", fr: "Produits" },
    Configuración: { en: "Settings", fr: "Paramètres" },
    "Mi cuenta": { en: "My account", fr: "Mon compte" },
    Panel: { en: "Dashboard", fr: "Tableau de bord" },
    Administración: { en: "Administration", fr: "Administration" },
    Salir: { en: "Sign out", fr: "Déconnexion" },
    "Cerrar sesión": { en: "Sign out", fr: "Déconnexion" },
    "emblemático, inicio del panel": {
      en: "emblemático, dashboard home",
      fr: "emblemático, accueil du tableau de bord",
    },
    "Cargando...": { en: "Loading...", fr: "Chargement..." },
    "Buenos días": { en: "Good morning", fr: "Bonjour" },
    "Buenas tardes": { en: "Good afternoon", fr: "Bonjour" },
    "Buenas noches": { en: "Good evening", fr: "Bonsoir" },
    "Crea tu primera guía": {
      en: "Create your first guide",
      fr: "Créez votre premier guide",
    },
    "Una página que tus huéspedes abren al escanear un código en la pared. Empieza con el nombre: lo demás puede esperar.":
      {
        en: "A page your guests open by scanning a code on the wall. Start with the name: the rest can wait.",
        fr: "Une page que vos voyageurs ouvrent en scannant un code au mur. Commencez par le nom : le reste peut attendre.",
      },
    "+ Crear guía": { en: "+ Create guide", fr: "+ Créer un guide" },
    "Crear guía": { en: "Create guide", fr: "Créer un guide" },
    "Tu plan no incluye más hospedajes. Escríbenos para ampliarlo.": {
      en: "Your plan does not include more properties. Contact us to upgrade.",
      fr: "Votre forfait ne permet pas d’ajouter d’autres hébergements. Contactez-nous pour le modifier.",
    },
    "Toma cerca de un minuto. Tu código funciona desde que existe la guía.": {
      en: "It takes about a minute. Your code works as soon as the guide exists.",
      fr: "Cela prend environ une minute. Votre code fonctionne dès la création du guide.",
    },
    "Tus hospedajes": { en: "Your properties", fr: "Vos hébergements" },
    "Ver todos": { en: "View all", fr: "Tout voir" },
    "Aún no tienes hospedajes.": {
      en: "You don’t have any properties yet.",
      fr: "Vous n’avez pas encore d’hébergement.",
    },
    "{count} hospedajes. {live} publicados.": {
      en: "{count} properties. {live} published.",
      fr: "{count} hébergements. {live} publiés.",
    },
    "1 hospedaje. {live} publicados.": {
      en: "1 property. {live} published.",
      fr: "1 hébergement. {live} publié.",
    },
    "Tu plan incluye {limit} hospedajes propios (tienes {owned}).": {
      en: "Your plan includes {limit} owned properties (you have {owned}).",
      fr: "Votre forfait comprend {limit} hébergements dont vous êtes propriétaire (vous en avez {owned}).",
    },
    "+ Agregar hospedaje": {
      en: "+ Add property",
      fr: "+ Ajouter un hébergement",
    },
    "Agregar hospedaje": { en: "Add property", fr: "Ajouter un hébergement" },
    "Ya usaste los hospedajes de tu plan.": {
      en: "You have used all the properties included in your plan.",
      fr: "Vous avez atteint le nombre d’hébergements inclus dans votre forfait.",
    },
    "Escríbenos para ampliarlo": {
      en: "Contact us to upgrade",
      fr: "Contactez-nous pour modifier votre forfait",
    },
    Borrador: { en: "Draft", fr: "Brouillon" },
    Publicada: { en: "Published", fr: "Publié" },
    Despublicada: { en: "Unpublished", fr: "Non publié" },
    "Fuera de línea": { en: "Offline", fr: "Hors ligne" },
    Suspendido: { en: "Suspended", fr: "Suspendu" },
    Archivado: { en: "Archived", fr: "Archivé" },
    Activo: { en: "Active", fr: "Actif" },
    "Sin borrador": { en: "No draft", fr: "Aucun brouillon" },
    "Guía publicada": { en: "Guide published", fr: "Guide publié" },
    "Borrador sin publicar": {
      en: "Unpublished draft",
      fr: "Brouillon non publié",
    },
    Ruta: { en: "Breadcrumb", fr: "Fil d’Ariane" },
    "Abrir guía ↗": { en: "Open guide ↗", fr: "Ouvrir le guide ↗" },
    "Contenido de la guía": { en: "Guide content", fr: "Contenu du guide" },
    "Vista previa": { en: "Preview", fr: "Aperçu" },
    "Compartir y QR": { en: "Share and QR", fr: "Partage et QR" },
    "Secciones del hospedaje": {
      en: "Property sections",
      fr: "Sections de l’hébergement",
    },
    "Las piezas físicas de tus hospedajes y otras ideas para tus huéspedes.": {
      en: "Physical products for your properties and more ideas for your guests.",
      fr: "Les objets de vos hébergements et d’autres idées pour vos voyageurs.",
    },
    "Tus productos": { en: "Your products", fr: "Vos produits" },
    "Todavía no tienes productos físicos.": {
      en: "You don’t have any physical products yet.",
      fr: "Vous n’avez pas encore de produits physiques.",
    },
    "La pieza de bienvenida 3D con tu código QR es la favorita de los anfitriones. Cuando hagas un pedido, aquí verás su estado.":
      {
        en: "The 3D welcome piece with your QR code is a host favorite. Once you place an order, you can track its status here.",
        fr: "L’objet de bienvenue 3D avec votre code QR est le préféré des hôtes. Après une commande, vous pourrez suivre son état ici.",
      },
    Hospedaje: { en: "Property", fr: "Hébergement" },
    Solicitado: { en: "Requested", fr: "Demandé" },
    "En producción": { en: "In production", fr: "En production" },
    Enviado: { en: "Shipped", fr: "Expédié" },
    Entregado: { en: "Delivered", fr: "Livré" },
    "Recomendados para ti": {
      en: "Recommended for you",
      fr: "Recommandés pour vous",
    },
    "Ver catálogo completo": {
      en: "View full catalog",
      fr: "Voir tout le catalogue",
    },
    Solicitar: { en: "Request", fr: "Demander" },
    "Ver detalle": { en: "View details", fr: "Voir les détails" },
    CUENTA: { en: "ACCOUNT", fr: "COMPTE" },
    "Tu correo ({email}) lo cambia el equipo de emblemático: escríbenos si lo necesitas.":
      {
        en: "The emblemático team can change your email ({email}): contact us if needed.",
        fr: "L’équipe emblemático peut modifier votre adresse e-mail ({email}) : contactez-nous si nécessaire.",
      },
    Contraseña: { en: "Password", fr: "Mot de passe" },
    "Cambiar contraseña": {
      en: "Change password",
      fr: "Modifier le mot de passe",
    },
    SUSCRIPCIÓN: { en: "SUBSCRIPTION", fr: "ABONNEMENT" },
    "Plan actual": { en: "Current plan", fr: "Forfait actuel" },
    "Se renueva o vence": {
      en: "Renews or expires",
      fr: "Renouvellement ou expiration",
    },
    "LO QUE TIENES": { en: "WHAT’S INCLUDED", fr: "CE QUI EST INCLUS" },
    "CAMBIAR DE PLAN": { en: "CHANGE PLAN", fr: "CHANGER DE FORFAIT" },
    "Tu plan": { en: "Your plan", fr: "Votre forfait" },
    Cotiza: { en: "Get a quote", fr: "Demander un devis" },
    "al año": { en: "per year", fr: "par an" },
    "al mes": { en: "per month", fr: "par mois" },
    "Periodo de facturación": {
      en: "Billing period",
      fr: "Période de facturation",
    },
    Anual: { en: "Yearly", fr: "Annuel" },
    Mensual: { en: "Monthly", fr: "Mensuel" },
    "Ahorra hasta": { en: "Save up to", fr: "Économisez jusqu’à" },
    Ahorras: { en: "You save", fr: "Vous économisez" },
    "Por ahora los cambios de plan se confirman con nuestro equipo: elige uno y te contactamos para el pago (tarjeta o SINPE Móvil). Cambiar a un plan menor conserva todo lo que escribiste.":
      {
        en: "Plan changes are currently confirmed with our team: choose one and we’ll contact you for payment (card or SINPE Móvil). Downgrading keeps everything you’ve written.",
        fr: "Les changements de forfait sont confirmés avec notre équipe : choisissez-en un et nous vous contacterons pour le paiement (carte ou SINPE Móvil). Passer à un forfait inférieur conserve tous vos textes.",
      },
    Nombre: { en: "Name", fr: "Nom" },
    "Guardando...": { en: "Saving...", fr: "Enregistrement..." },
    Guardar: { en: "Save", fr: "Enregistrer" },
    "Tu contraseña": { en: "Your password", fr: "Votre mot de passe" },
    "Bienvenido. Crea una contraseña para entrar la próxima vez con tu correo.":
      {
        en: "Welcome. Create a password to sign in with your email next time.",
        fr: "Bienvenue. Créez un mot de passe pour vous connecter avec votre e-mail la prochaine fois.",
      },
    "Elige una contraseña nueva para entrar con tu correo.": {
      en: "Choose a new password to sign in with your email.",
      fr: "Choisissez un nouveau mot de passe pour vous connecter avec votre e-mail.",
    },
    "Contraseña nueva": { en: "New password", fr: "Nouveau mot de passe" },
    "Al menos 8 caracteres.": {
      en: "At least 8 characters.",
      fr: "Au moins 8 caractères.",
    },
    "Repite la contraseña": {
      en: "Repeat password",
      fr: "Confirmez le mot de passe",
    },
    "Guardar contraseña": {
      en: "Save password",
      fr: "Enregistrer le mot de passe",
    },
    "Escribe tu nombre.": {
      en: "Enter your name.",
      fr: "Saisissez votre nom.",
    },
    "Máximo 120 caracteres.": {
      en: "Maximum 120 characters.",
      fr: "120 caractères maximum.",
    },
    "No pudimos guardar tu nombre.": {
      en: "We couldn’t save your name.",
      fr: "Impossible d’enregistrer votre nom.",
    },
    "Nombre guardado.": { en: "Name saved.", fr: "Nom enregistré." },
    "Usa al menos 8 caracteres.": {
      en: "Use at least 8 characters.",
      fr: "Utilisez au moins 8 caractères.",
    },
    "Usa como máximo 72 caracteres.": {
      en: "Use no more than 72 characters.",
      fr: "Utilisez au maximum 72 caractères.",
    },
    "Las contraseñas no coinciden.": {
      en: "Passwords do not match.",
      fr: "Les mots de passe ne correspondent pas.",
    },
    "Esa ya es tu contraseña. Elige una distinta.": {
      en: "That is already your password. Choose a different one.",
      fr: "C’est déjà votre mot de passe. Choisissez-en un autre.",
    },
    "Esa contraseña es muy débil o aparece en filtraciones. Prueba otra.": {
      en: "That password is too weak or has appeared in data breaches. Try another.",
      fr: "Ce mot de passe est trop faible ou figure dans des fuites de données. Essayez-en un autre.",
    },
    "Por seguridad, cierra sesión y usa “¿Olvidaste tu contraseña?” para cambiarla.":
      {
        en: "For security, sign out and use “Forgot your password?” to change it.",
        fr: "Par sécurité, déconnectez-vous et utilisez « Mot de passe oublié ? » pour le modifier.",
      },
    "No pudimos guardar la contraseña. Intenta de nuevo.": {
      en: "We couldn’t save your password. Try again.",
      fr: "Impossible d’enregistrer le mot de passe. Réessayez.",
    },
  };

export type PanelTranslator = (
  text: string,
  values?: Record<string, string | number>,
) => string;

export function panelTranslator(language: PanelLanguage): PanelTranslator {
  return (text, values) => {
    const key = text.replace(/\s+/g, " ").trim();
    const maxCharacters = /^Máximo (\d+) caracteres$/.exec(key);
    if (maxCharacters)
      return panelTranslator(language)("Máximo {count} caracteres", {
        count: maxCharacters[1]!,
      });
    let translated =
      language === "es" ? text : (PANEL_TEXT[key]?.[language] ?? text);
    for (const [name, value] of Object.entries(values ?? {})) {
      translated = translated.replaceAll(`{${name}}`, () => String(value));
    }
    return translated;
  };
}
