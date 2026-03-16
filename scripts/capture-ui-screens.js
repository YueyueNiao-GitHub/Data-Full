const path = require('path');
const { chromium } = require('playwright');

async function capture(page, name, selector = '#app') {
  await page.locator(selector).screenshot({
    path: path.join(process.cwd(), 'actual_ui_screens', name),
  });
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 420, height: 920 },
    deviceScaleFactor: 2,
  });

  await page.goto('http://127.0.0.1:8123/ui.html', { waitUntil: 'load' });
  await page.addStyleTag({
    content: `
      body {
        margin: 0;
        padding: 24px;
        background: #f3f6fb;
        display: flex;
        justify-content: center;
      }
      #app {
        box-shadow: 0 24px 60px rgba(16, 38, 74, 0.14);
        border-radius: 24px;
        overflow: hidden;
      }
    `,
  });
  await wait(1200);

  await capture(page, '01-text-home.png');

  await page.click('.tab[data-tab="image"]');
  await wait(600);
  await capture(page, '02-image-tab.png');

  await page.click('#searchInput');
  await page.fill('#searchInput', '头像');
  await wait(600);
  await capture(page, '03-search-results.png');

  await page.fill('#searchInput', '');
  await wait(300);
  await page.click('#newButton');
  await wait(300);
  await page.click('.add-menu-item[data-action="add-ai-field"]');
  await wait(500);
  await capture(page, '04-ai-modal.png', 'body');

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
