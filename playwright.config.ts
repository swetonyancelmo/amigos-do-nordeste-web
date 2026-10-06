import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de acessibilidade (axe + teclado). Não precisam da API: cada teste
 * intercepta `/api/*` no navegador e responde com dados inventados
 * (`e2e/api-falsa.ts`). Nenhum dado real de família entra aqui.
 *
 * Sobe o Next numa porta própria para não brigar com o `pnpm dev` aberto.
 */
const PORTA = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Recife',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\// },
    // Celular (e2e/mobile/): Android no Chrome e iPhone no Safari (WebKit), com toque.
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'], hasTouch: true, isMobile: true },
      testMatch: /mobile\/.*\.spec\.ts/,
    },
    {
      name: 'iphone-13',
      use: { ...devices['iPhone 13'], hasTouch: true, isMobile: true },
      testMatch: /mobile\/.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: `pnpm exec next dev -p ${PORTA}`,
    url: `http://localhost:${PORTA}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
