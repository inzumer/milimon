import { getTranslations } from '@i18n';
import { choicesToConsent, consentCategories, consentLabels, consentToChoices } from '../consent';

const labels = getTranslations('en', 'common').consent;

describe('consent', () => {
  it('should list the necessary cookies as required and analytics as optional', () => {
    expect(consentCategories(labels).map(({ id, required }) => [id, required === true])).toEqual([
      ['necessary', true],
      ['analytics', false],
    ]);
  });

  it.each([
    [null, null],
    ['granted', { analytics: true }],
    ['denied', { analytics: false }],
  ] as const)('should turn the stored consent %s into the answer %o', (consent, choices) => {
    expect(consentToChoices(consent)).toEqual(choices);
  });

  it.each([
    [{ analytics: true }, 'granted'],
    [{ analytics: false }, 'denied'],
    [{}, 'denied'],
  ])('should turn the answer %o into the stored consent %s', (choices, consent) => {
    expect(choicesToConsent(choices)).toBe(consent);
  });

  it('should map the translations to the component labels', () => {
    expect(consentLabels(labels, 'Text')).toMatchObject({
      title: labels.title,
      description: 'Text',
      preferencesTitle: labels['preferences-title'],
      required: labels.required,
    });
  });
});
