import { defineConfig } from 'orval';

export default defineConfig({
  hrm: {
    input: process.env.NEXT_PUBLIC_ORVAL_INPUT_URL,
    output: {
      mode: 'tags-split',
      target: 'src/api/endpoints.ts',
      schemas: 'src/api/model',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },
});