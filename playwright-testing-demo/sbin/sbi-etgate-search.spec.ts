import { expect } from '@playwright/test';
import { test } from './fixture';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test.beforeEach(async ({ page }) => {
  page.setViewportSize({ width: 1280, height: 768 });
  await page.goto('https://www.sbisec.co.jp/ETGate');
  await sleep(3000);
});

test('SBI ETGate - 国内株式で4812を検索して選択', async ({
  ai,
  aiTap,
  aiAssert,
  aiWaitFor,
}) => {
  // Step 1: ページ上部銘柄検索の右側の入力欄に「4812」を入力する
  await ai('ページ上部銘柄検索の右側の入力欄に「4812」を入力する');
  await sleep(1000);

  // Step 2: 検索結果リストから「4812」の株式を選択
  await aiWaitFor('「ISID」や「4812」に関する検索結果リストが表示される');
  await ai('検索結果リストに表示される「4812」という株式コードの項目をクリックする');
  await sleep(1000);

  // Step 4: Enter を押下して検索実行
  await ai('キーボードの Enter キーを押す');
  await sleep(3000);

  // Step 5: 検索が正しく完了したことを確認
  await aiAssert('ページ上に「4812」や「ISID」に関連する株式情報が表示されている');

  // Step 6: 「PTS株価比較」リンクをクリックする
  await ai('「PTS」タブ右側の「PTS株価比較」リンクをクリックする');
  await sleep(2000);

  // Step 7: 確認する
  await aiAssert('');
});
