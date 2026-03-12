Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

  https://nodejs.org/en/download/

Next, install TypeScript using the command:

  npm install -g typescript

Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

  npm install --save-dev @figma/plugin-typings

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code
is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code
to provide information about the Figma API while you are writing code, as well as help catch bugs
you previously didn't notice.

For more information, visit https://www.typescriptlang.org/

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js)
for the browser to run.

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
    then select "npm: watch". You will have to do this again every time
    you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.

## AI Release Guidance

This repository now uses a publishable architecture:

1. The Figma plugin never stores your DeepSeek key.
2. The plugin calls your own Cloudflare Workers proxy.
3. The Worker keeps the DeepSeek key in server-side secrets.

### Included in this repo

- Figma plugin client: [code.ts](/Users/yueyueniao/Desktop/Data%20Full%20_Codex/code.ts)
- Cloudflare Worker proxy: [ai-proxy/src/index.ts](/Users/yueyueniao/Desktop/Data%20Full%20_Codex/ai-proxy/src/index.ts)
- Worker config: [ai-proxy/wrangler.toml](/Users/yueyueniao/Desktop/Data%20Full%20_Codex/ai-proxy/wrangler.toml)

### What you need to do

1. Create a Cloudflare account.
2. In `ai-proxy/`, run `npm install`.
3. In `ai-proxy/`, run `npx wrangler login`.
4. In `ai-proxy/`, run `npx wrangler secret put DEEPSEEK_API_KEY`.
5. Paste your new DeepSeek key when prompted.
6. In `ai-proxy/`, run `npm run deploy`.
7. Cloudflare will return a Worker URL like `https://data-fill-ai-proxy.<your-subdomain>.workers.dev`.
8. Replace `AI_PROXY_ENDPOINT` in [code.ts](/Users/yueyueniao/Desktop/Data%20Full%20_Codex/code.ts) with:

```ts
const AI_PROXY_ENDPOINT = 'https://data-fill-ai-proxy.<your-subdomain>.workers.dev/api/ai/generate';
```

9. Run `npm run build` in the plugin root.
10. Reload the plugin in Figma.

### License system setup

Before selling the plugin, enable the built-in license check:

1. In `ai-proxy/`, create a KV namespace:

```bash
npx wrangler kv namespace create LICENSES
```

2. Copy the returned namespace `id`.
3. Open [ai-proxy/wrangler.toml](/Users/yueyueniao/Desktop/Data%20Full%20_Codex/ai-proxy/wrangler.toml) and uncomment the `[[kv_namespaces]]` block.
4. Replace `YOUR_KV_NAMESPACE_ID` with the real id.
5. Generate a license key:

```bash
npm run generate:license
```

6. Put that license into KV as an active license:

```bash
npx wrangler kv key put --binding=LICENSES "YOUR_LICENSE_KEY" "{\"status\":\"active\",\"plan\":\"pro\"}"
```

7. Redeploy the Worker:

```bash
npm run deploy
```

8. In the plugin UI, click the bottom badge and activate with that license key.

License record format in KV:

```json
{
  "status": "active",
  "plan": "pro",
  "expiresAt": "2027-12-31T23:59:59.000Z"
}
```

If `expiresAt` is omitted, the license does not expire.

### How the request works

Plugin request body:

```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "temperature": 0.8,
  "maxTokens": 256,
  "prompt": "生成20个中国大学",
  "count": 20,
  "preview": false
}
```

Worker response body:

```json
{
  "content": "北京大学\n清华大学\n复旦大学"
}
```

### Selling safely

Never do these:

1. Do not commit DeepSeek/OpenAI keys into the plugin source.
2. Do not let the plugin call DeepSeek directly with your seller key.
3. Do not trust hidden UI fields as security.

Do these instead:

1. Keep model keys only in Worker secrets.
2. Add purchase/license validation on the server before calling DeepSeek.
3. Add rate limits and usage logs on the server.
4. Rotate any key that has ever appeared in chat, screenshots, or git history.

### Important commercial risk

This repo includes a `validateLicense()` hook in the Worker, but it is still a placeholder integration. Before you sell the plugin, connect it to your own license system or checkout platform.

If you skip that step, anyone who discovers your Worker endpoint may consume your AI quota.
