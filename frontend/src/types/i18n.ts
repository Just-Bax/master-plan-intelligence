/**
 * i18n types: supported locales.
 */

export const SUPPORTED_LOCALES = ["en", "ru", "uz"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
