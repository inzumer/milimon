import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    heading: {
      ...nodes.heading,
      render: component('./src/components/atoms/MarkdocHeading/markdoc-heading.astro'),
    },
    link: {
      ...nodes.link,
      render: component('./src/components/atoms/MarkdocLink/markdoc-link.astro'),
    },
    paragraph: {
      ...nodes.paragraph,
      render: component('./src/components/atoms/MarkdocParagraph/markdoc-paragraph.astro'),
    },
  },
  tags: {
    milicitos: {
      render: component('./src/components/molecules/MarkdocMilicitos/markdoc-milicitos.astro'),
      attributes: { rating: { type: Number, required: true, matches: [1, 2, 3, 4, 5] } },
    },
  },
});
