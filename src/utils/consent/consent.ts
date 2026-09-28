import type { CookieCategory, CookieChoices, CookieConsentLabels } from '@inzumer/ui-library';
import type { Translations } from '@i18n/translations';
import type { AnalyticsConsent } from '@stores';

export type ConsentLabels = Translations<'common'>['consent'];

/** The cookie categories of the site: the necessary ones (always on) and analytics. */
export const consentCategories = (labels: ConsentLabels): CookieCategory[] => [
  {
    id: 'necessary',
    title: labels.categories.necessary.title,
    description: labels.categories.necessary.description,
    required: true,
  },
  {
    id: 'analytics',
    title: labels.categories.analytics.title,
    description: labels.categories.analytics.description,
  },
];

/** The `CookieConsent` answer for the stored consent (`null` while unanswered). */
export const consentToChoices = (consent: AnalyticsConsent | null): CookieChoices | null =>
  consent === null ? null : { analytics: consent === 'granted' };

/** The consent to store for a `CookieConsent` answer. */
export const choicesToConsent = (choices: CookieChoices): AnalyticsConsent =>
  choices.analytics ? 'granted' : 'denied';

/** `CookieConsent` labels from the site translations, with the banner text given apart. */
export const consentLabels = (
  labels: ConsentLabels,
  description: CookieConsentLabels['description'],
): CookieConsentLabels => ({
  title: labels.title,
  description,
  accept: labels.accept,
  reject: labels.reject,
  customize: labels.customize,
  preferencesTitle: labels['preferences-title'],
  preferencesDescription: labels['preferences-description'],
  save: labels.save,
  cancel: labels.cancel,
  required: labels.required,
});
