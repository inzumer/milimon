import { z } from 'zod';
import type { FormulaId } from '@utils/formulas';
import type { Locale } from '@utils/locale';

/** "Learn" topics in reading order; the id is the route slug and `src/i18n/learn/<id>/`. */
export const LEARN_TOPICS = [
  { id: 'purchasing-and-receiving', related: ['clean-price', 'waste-percentage'] },
  { id: 'storage', related: ['cost-of-goods'] },
  {
    id: 'waste-and-loss',
    related: ['waste-percentage', 'waste-factor', 'gross-quantity', 'cooking-loss'],
  },
  { id: 'standard-recipes', related: ['recipe-costing', 'gross-quantity'] },
  { id: 'stock-control', related: ['cost-of-goods'] },
  { id: 'cost-classification', related: ['pricing', 'rent-check'] },
  { id: 'pricing', related: ['pricing', 'cost-of-goods', 'omnes-rules'] },
  { id: 'cost-structure', related: ['break-even', 'income-statement'] },
  { id: 'menu-balance', related: ['omnes-rules', 'pricing'] },
  { id: 'premises-layout', related: ['floor-area', 'seating-capacity', 'rent-check'] },
] as const satisfies readonly { id: string; related: readonly FormulaId[] }[];

export type LearnTopicId = (typeof LEARN_TOPICS)[number]['id'];

export const LEARN_TOPIC_IDS = LEARN_TOPICS.map((topic) => topic.id);

const text = z.string().trim().min(1);

const learnTopicSchema = z.object({
  title: text,
  summary: text,
  sections: z
    .array(
      z
        .object({
          heading: text,
          paragraphs: z.array(text).optional(),
          items: z.array(text).optional(),
        })
        .refine((section) => section.paragraphs ?? section.items, 'A section needs content'),
    )
    .min(1),
});

export type LearnTopic = z.infer<typeof learnTopicSchema>;

const files = import.meta.glob<unknown>('./learn/*/*.json', { eager: true, import: 'default' });

export const getLearnTopic = (lang: Locale, id: LearnTopicId): LearnTopic => {
  const raw = files[`./learn/${id}/${lang}.json`];
  if (raw === undefined) {
    throw new Error(`Missing translation src/i18n/learn/${id}/${lang}.json`);
  }
  return learnTopicSchema.parse(raw);
};

/** Previous and next topic in reading order (for the navigation at the end of a topic). */
export const adjacentTopics = (
  id: LearnTopicId,
): { previous: LearnTopicId | null; next: LearnTopicId | null } => {
  const index = LEARN_TOPIC_IDS.indexOf(id);
  return {
    previous: LEARN_TOPIC_IDS[index - 1] ?? null,
    next: LEARN_TOPIC_IDS[index + 1] ?? null,
  };
};
