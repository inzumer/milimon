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
});
