import { defineConfig } from 'orval';

export default defineConfig({
  hrm: {
    input: './schema.yaml', // Path to your OpenAPI spec
    output: {
      mode: 'tags-split',
      target: 'src/generated',
      client: 'react-query',
    },
  },
});