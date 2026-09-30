/**
 * Cloudflare Workers Builds builds every branch with the same variables: `main` is production and
 * any other branch (`dev`) is staging. The URLs live here; each environment's API key is a build
 * variable in Cloudflare (`PUBLIC_API_KEY_PRODUCTION`, `PUBLIC_API_KEY_STAGING`).
 * Variables already set (GitHub Pages, .env) always win.
 */
export const ENVIRONMENTS = {
  production: {
    SITE_URL: 'https://milimon.inzumer.workers.dev',
    PUBLIC_API_URL: 'https://milimon-backend-nest.onrender.com',
    apiKeyVariable: 'PUBLIC_API_KEY_PRODUCTION',
  },
  staging: {
    SITE_URL: 'https://dev-milimon.inzumer.workers.dev',
    PUBLIC_API_URL: 'https://milimon-backend-nest-staging.onrender.com',
    apiKeyVariable: 'PUBLIC_API_KEY_STAGING',
  },
};

/** The environment of a Cloudflare build (`WORKERS_CI_BRANCH`), or null outside Cloudflare. */
export const cloudflareEnvironment = (branch) =>
  branch ? (branch === 'main' ? 'production' : 'staging') : null;

/** Fills the missing build variables with the current Cloudflare environment's values. */
export const applyCloudflareEnvironment = (env = process.env) => {
  const name = cloudflareEnvironment(env.WORKERS_CI_BRANCH);
  if (!name) {
    return null;
  }
  const { apiKeyVariable, ...values } = ENVIRONMENTS[name];
  const fill = (key, value) => {
    if (!env[key] && value) {
      env[key] = value;
    }
  };
  Object.entries({ ...values, BASE_PATH: '/', PUBLIC_API_APP_ID: 'web' }).forEach(([key, value]) =>
    fill(key, value),
  );
  fill('PUBLIC_API_KEY', env[apiKeyVariable]);
  return name;
};
