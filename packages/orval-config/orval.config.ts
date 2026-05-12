import { defineConfig } from 'orval';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../apps/web/.env') });

export default defineConfig({
  auth: {
    input: `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/auth/endpoints.ts',
      schemas: 'src/api/auth/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },

  billing: {
    input: `${process.env.NEXT_PUBLIC_BILLING_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/billing/endpoints.ts',
      schemas: 'src/api/billing/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },

  tenant: {
    input: `${process.env.NEXT_PUBLIC_TENANT_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/tenant/endpoints.ts',
      schemas: 'src/api/tenant/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },

  employee: {
    input: `${process.env.NEXT_PUBLIC_EMPLOYEE_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/employee/endpoints.ts',
      schemas: 'src/api/employee/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },

  orchestrator: {
    input: `${process.env.NEXT_PUBLIC_ORCHESTRATOR_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/orchestrator/endpoints.ts',
      schemas: 'src/api/orchestrator/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },

  superadmin: {
    input: `${process.env.NEXT_PUBLIC_SUPERADMIN_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/superadmin/endpoints.ts',
      schemas: 'src/api/superadmin/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },

  job: {
    input: `${process.env.NEXT_PUBLIC_JOB_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/job/endpoints.ts',
      schemas: 'src/api/job/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },

  resume_parsing: {
    input: `${process.env.NEXT_PUBLIC_RESUME_PARSING_SERVICE_URL}/openapi.json`,
    output: {
      mode: 'tags-split',
      target: 'src/api/resume_parsing/endpoints.ts',
      schemas: 'src/api/resume_parsing/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/axios-setup.ts',
          name: 'customInstance',
        },
      },
    },
  },
});