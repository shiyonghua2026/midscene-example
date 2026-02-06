import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import 'dotenv/config';

const sleep = (ms: number | undefined) => new Promise((r) => setTimeout(r, ms));

Promise.resolve(
  (async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewportSize({
      width: 1280,
      height: 768,
    });
    await page.goto('https://www.sbisec.co.jp/ETGate');
    await sleep(3000);

    const agent = new PlaywrightAgent(page);

    // 👀 プルダウン右側の入力ボックスに「ISID」を入力
    await agent.aiAct('ページ上部銘柄検索の右側の入力欄に「4812」を入力する');
    await sleep(1000);

    // 👀 検索結果リストが表示されるのを待機
    await agent.aiWaitFor('「ISID」や「4812」に関する検索結果リストが表示される');

    // 👀 検索結果リストから「4812」を選択
    await agent.aiTap('検索結果リストに表示される「4812」という株式コードの項目');
    await sleep(1000);

    // 👀 Enter キー押下で検索実行
    await agent.aiAct('キーボードの Enter キーを押す');
    await sleep(3000);

    // 👀 検索結果の確認
    await agent.aiAssert('ページ上に「4812」や「ISID」に関連する株式情報が表示されている');

    console.log('✓ SBI ETGate 銘柄検索テスト完了');

    await browser.close();
  })()
);
