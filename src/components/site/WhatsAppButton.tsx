import { whatsappLink } from "@/lib/site";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink(
        "Hola, me gustaría cotizar un producto de emblemático.",
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Cotizar por WhatsApp"
      className="bg-ink text-cream hover:bg-sand-dark fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-colors"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 fill-current"
      >
        <path d="M12.04 2a9.9 9.9 0 0 0-8.43 15.1L2 22l5.06-1.55A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.33-2 1.4-.5.07-1.13.1-1.82-.12a16.6 16.6 0 0 1-1.65-.61c-2.9-1.25-4.78-4.17-4.92-4.37-.14-.2-1.18-1.57-1.18-3s.75-2.12 1.02-2.41c.27-.3.58-.37.78-.37h.56c.18 0 .42-.07.65.5.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1 2.09 1.31 2.39 1.46.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42Z" />
      </svg>
      <span className="hidden sm:inline">Cotizar por WhatsApp</span>
    </a>
  );
}
