import { defineConfig } from 'orval';

export default defineConfig({
  hrm: {
    input: 'http://localhost:8000/openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/api/endpoints.ts',
      schemas: 'src/api/model',
      client: 'react-query',
      mock: false,
    },
  },
});