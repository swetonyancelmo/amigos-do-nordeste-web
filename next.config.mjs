/**
 * O navegador fala só com o Next, em `/api/...` na mesma origem, e o Next
 * repassa para a API. Assim o cookie de renovação (SameSite=Lax, caminho
 * /api/auth) viaja mesmo com a API hospedada em outro domínio, e o CORS sai do
 * caminho do painel. Ver ADR-0004 (adendo de 01/10/2026) no repositório da API.
 *
 * API_URL é lida quando o Next sobe (dev) ou no build (produção): trocou, suba
 * ou gere de novo.
 */
const API_URL = (process.env.API_URL ?? 'http://localhost:3333').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:caminho*', destination: `${API_URL}/api/:caminho*` }];
  },
};

export default nextConfig;
