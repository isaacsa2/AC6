// Cloudflare Worker que serve arquivos estáticos da pasta /public
// usando o binding nativo de Assets (configurado no wrangler.toml).

export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
