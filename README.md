# 工程用科學計算機・實體操作模擬器

這是一個純前端 HTML / CSS / JavaScript 專案，可直接部署到 GitHub Pages。

## 特色

- 用實體計算機外觀當作操作介面，而不是一般方格按鈕。
- 每顆按鍵上方都有實際可點擊的透明 hit area，位置與外觀圖中的實體鍵對齊。
- LCD 是真正的動態顯示區，不是圖片裡固定的數字。
- 10 位數一般顯示，超出時會以科學記號顯示。
- 支援 SHIFT 雙功能、COMP / SD、DEG / RAD / GRA、FIX / SCI / NORM。
- 科學函數依這類舊式工程計算機操作：通常先輸入數值，再按 sin / cos / tan / log / ln / √ 等函數鍵。
- 支援分數、度分秒、百分比、記憶、統計、排列組合、階乘、ENG、RAN#、座標轉換等。
- 完全在瀏覽器本機執行，不需要後端。

## GitHub Pages 部署

1. 建立新的 GitHub repository。
2. 將本資料夾內所有檔案上傳到 repository 根目錄：
   - `index.html`
   - `style.css`
   - `engine.js`
   - `app.js`
   - `calculator-shell.png`
3. 進入 GitHub repository 的 **Settings → Pages**。
4. `Build and deployment` 選擇 **Deploy from a branch**。
5. Branch 選 `main`，Folder 選 `/(root)`，按 **Save**。
6. 等待 GitHub 產生 Pages 網址即可。

## 本機測試

直接雙擊 `index.html` 即可使用。若瀏覽器限制本機檔案，也可在此資料夾執行：

```bash
python -m http.server 8000
```

然後開啟 `http://localhost:8000`。

## 測試

如果電腦有 Node.js：

```bash
node test-engine.js
node test-more.js
```
