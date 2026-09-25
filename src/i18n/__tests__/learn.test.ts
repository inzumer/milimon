import { FORMULA_IDS } from '@domain/registry';
import { LOCALES } from '@utils';
import {
  adjacentTopics,
  getLearnTopic,
  isLearnTopicId,
  LEARN_TOPIC_IDS,
  LEARN_TOPICS,
} from '../learn';

describe('learn topics', () => {
  it.each(LOCALES.flatMap((lang) => LEARN_TOPIC_IDS.map((id) => [lang, id] as const)))(
    'should load a valid %s translation for %s',
    (lang, id) => {
      const topic = getLearnTopic(lang, id);
      expect(topic.sections.length).toBeGreaterThan(0);
    },
  );

  it('should have the same number of sections in every language', () => {
    for (const id of LEARN_TOPIC_IDS) {
      const [es, en] = LOCALES.map((lang) => getLearnTopic(lang, id).sections);
      expect(en?.length).toBe(es?.length);
    }
  });

  it('should only relate topics to existing formulas', () => {
    for (const topic of LEARN_TOPICS) {
      expect(topic.related.length).toBeGreaterThan(0);
      for (const formula of topic.related) {
        expect(FORMULA_IDS).toContain(formula);
      }
    }
  });

  it('should recognize topic ids and fail loudly on missing translations', () => {
    expect(isLearnTopicId('storage')).toBe(true);
    expect(isLearnTopicId('marketing')).toBe(false);
    expect(() => getLearnTopic('es', 'marketing' as never)).toThrow('Missing translation');
  });

  it('should give the previous and next topic in reading order', () => {
    expect(adjacentTopics('purchasing-and-receiving')).toStrictEqual({
      previous: null,
      next: 'storage',
    });
    expect(adjacentTopics('storage')).toStrictEqual({
      previous: 'purchasing-and-receiving',
      next: 'waste-and-loss',
    });
    expect(adjacentTopics('premises-layout').next).toBeNull();
  });
});
