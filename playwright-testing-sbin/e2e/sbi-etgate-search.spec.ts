import { expect } from '@playwright/test';
import { test } from './fixture';
import { PlaywrightAgent } from '@midscene/web/playwright';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test.beforeEach(async ({ page }) => {
  page.setViewportSize({ width: 1280, height: 768 });
  await page.goto('https://www.sbisec.co.jp/ETGate');
  await sleep(3000);
});

test('SBI ETGate - 国内株式で4812を検索して選択', async ({
  page,
  ai,
  aiTap,
  aiAssert,
  aiWaitFor,
}) => {
  // Step 1: 銘柄・銘柄コードエリアに4812銘柄コードを入力する
  await ai('銘柄・銘柄コードエリアに4812銘柄コードを入力する');
  await sleep(1000);

  // Step 2: 検索結果リストから「4812」の株式を選択
  await aiWaitFor('「ISID」や「4812」に関する検索結果リストが表示される');
  await aiTap('電通総研');
  await sleep(1000);

  // Step 3: 表示内容の確認
  await aiAssert('「東証プライム（当社優先市場）」タブを選択されていること（背景色は水色）、「PTS」タブは選択されていないこと（背景色は白色）');
  await aiAssert('「PTS」タブの右側に「PTS株価比較」と表示されていること。');

  // Step 4: 「PTS」タブを選択
  await aiTap('「PTS」タブ');
  await sleep(1000);

  // Step 5: 表示内容の確認
  await aiAssert('「東証プライム（当社優先市場）」タブを選択されていない（背景色は白色）、「PTS」タブは選択されていること（背景色は水色）');
  await aiAssert('「PTS」タブの右側に「取引所株価比較」と表示されていること。');

  // Step 6: 取引所株価比較リンクをクリックしてポップアップを確認
  // 新しい Agent を作成（forceSameTabNavigation: false で新窓を許可）
  const popupAgent = new PlaywrightAgent(page, {
    forceSameTabNavigation: false,
  });

  // ポップアップを待機しながらリンクをクリック
  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    popupAgent.aiTap('「取引所株価比較」リンク'),
  ]);

  // ポップアップウィンドウの読み込みを待機
  await newPage.waitForLoadState('load');
  await sleep(2000);

  // ポップアップウィンドウのタイトルを確認
  const popupTitle = await newPage.title();
  console.log('Popup title:', popupTitle);

  expect(popupTitle).toContain('国内株式');
  expect(popupTitle).toContain('SBI証券');

  // ポップアップを閉じる
  await newPage.close();
});
