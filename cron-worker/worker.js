// Cloudflare Worker "newukrainedaily-cron".
// Every hour it starts the GitHub Actions workflow that updates and deploys the
// site. GitHub's own `schedule:` trigger turned out to be unreliable (it skipped
// most hours), while Cloudflare cron triggers fire on time and are free.
//
// Setup (Cloudflare dashboard > Workers & Pages > newukrainedaily-cron):
//   - Settings > Variables and Secrets: secret GITHUB_TOKEN = fine-grained GitHub
//     token for VladislavKatin/newukrainedaily.com with "Actions: Read and write".
//   - Settings > Trigger events: cron "23 * * * *".
// The token has no expiry date; revoke it in GitHub settings if no longer needed.

const REPO = "VladislavKatin/newukrainedaily.com";
const WORKFLOW = "site.yml";

async function startHourlyRun(env) {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "newukrainedaily-cron"
      },
      body: JSON.stringify({ ref: "main", inputs: { scheduled: "true" } })
    }
  );

  if (response.status !== 204) {
    throw new Error(`GitHub workflow dispatch failed: ${response.status} ${await response.text()}`);
  }
}

export default {
  async scheduled(controller, env, ctx) {
    await startHourlyRun(env);
  },

  async fetch() {
    return new Response("newukrainedaily cron worker: starts the hourly site update on GitHub Actions.\n");
  }
};
