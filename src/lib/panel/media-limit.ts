/**
 * Images a client can upload into one guide's storage folder. The database enforces it
 * (storage_can_insert() in migration 16); the panel checks first to show a clear
 * message. Admins have no limit.
 */
export const MEDIA_LIMIT_PER_BUSINESS = 20;

export const MEDIA_LIMIT_MESSAGE = `Esta guía llegó al máximo de ${MEDIA_LIMIT_PER_BUSINESS} imágenes. Escríbenos y la revisamos contigo.`;
