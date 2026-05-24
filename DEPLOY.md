# 上線指引（零成本組合）

| 角色 | 平台 | 月費 | 備註 |
|---|---|---:|---|
| 前端 | GitHub Pages | $0 | 公開 repo 免費，無流量上限 |
| 後端 | Render Web Service | $0 | 閒置 15 分鐘會冷啟動，首次喚醒約 30 秒 |
| 資料庫 | Render Postgres（Free） | $0 | **90 天會被刪**，建議到期前用 Supabase 替換 |
| AI | Google Gemini | $0 | 免費額度 15 RPM |

最終公開網址：

- 前端：`https://johnny77585.github.io/fit-ai/`
- 後端：`https://fit-ai-api.onrender.com`（名稱依你在 Render 設定的服務名）

---

## A. 後端先上線（Laravel → Render）

### 1. 推送本次設定到 GitHub

```bash
git add api/Dockerfile api/docker/ api/.dockerignore render.yaml \
        api/app/Http/Controllers/Api/AuthController.php \
        api/app/Http/Controllers/Api/GoogleAuthController.php \
        api/config/cors.php \
        src/api/auth.ts src/api/client.ts \
        vite.config.ts .env.production.example .gitignore \
        .github/workflows/deploy-frontend.yml DEPLOY.md
git commit -m "chore: setup GitHub Pages + Render deployment"
git push
```

### 2. 在 Render 建立服務

1. 註冊 / 登入 <https://render.com>（用 GitHub 帳號登入最快）。
2. 點 **New +** → **Blueprint**。
3. 選 `Johnny77585/fit-ai` repo（Render 會讀取 `render.yaml`，自動建立 Web Service + Postgres）。
4. 服務名建議命名為 `fit-ai-api`（影響網址 `https://fit-ai-api.onrender.com`）。
5. 按 **Apply**。Render 開始 build（首次約 5–8 分鐘）。

### 3. 設定環境變數（在 Render 服務頁 → Environment）

`render.yaml` 已設好大多數變數，只剩下需要你手動填的密鑰：

| 變數 | 值 |
|---|---|
| `APP_URL` | `https://fit-ai-api.onrender.com`（你的 Render 服務網址，不含尾斜線） |
| `FRONTEND_URL` | `https://johnny77585.github.io,http://localhost:3000`（可同時允許多個來源，用逗號隔開） |
| `SANCTUM_STATEFUL_DOMAINS` | `johnny77585.github.io,localhost:3000` |
| `GEMINI_API_KEY` | 你的 Gemini 金鑰（[取得](https://aistudio.google.com/apikey)） |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID（選用） |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret（選用） |
| `GOOGLE_REDIRECT_URI` | `https://fit-ai-api.onrender.com/api/auth/google/callback` |

存檔後 Render 會自動重新部署。

### 4. 驗證後端

- 開啟 `https://fit-ai-api.onrender.com/api/health` → 應該看到 `{"status":"ok"}`。
- 若 502/503，等 1–2 分鐘讓服務完整啟動；Logs 在 Render 服務頁右上 **Logs** 分頁。

### 5. Google OAuth Console 設定（選用）

到 [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)，編輯 OAuth 用戶端，**Authorized redirect URIs** 加上：

```
https://fit-ai-api.onrender.com/api/auth/google/callback
```

---

## B. 前端上線（React → GitHub Pages）

### 1. GitHub 設定 Pages

1. 進 repo Settings → **Pages**。
2. **Source** 選 **GitHub Actions**。

### 2. 加入 Secrets

Settings → **Secrets and variables** → **Actions** → New repository secret，新增兩個：

| Secret | 值 |
|---|---|
| `VITE_API_URL` | `https://fit-ai-api.onrender.com/api` |
| `VITE_OAUTH_URL` | `https://fit-ai-api.onrender.com/api` |

### 3. 觸發部署

推 commit 到 `main`，或進 **Actions** 分頁手動執行 `Deploy frontend to GitHub Pages` workflow。

完成後到：

```
https://johnny77585.github.io/fit-ai/
```

---

## C. 上線後常見問題

### 1. 第一次打開很慢
Render 免費方案閒置 15 分鐘會休眠，首次請求要等 ~30 秒喚醒。**正常現象**。

### 2. 90 天後 Postgres 被刪
Render 免費 Postgres 90 天會被自動刪除。建議在到期前換成 **Supabase**（永久免費 500MB）：

1. 到 <https://supabase.com> 建立專案。
2. 取得 Connection string（Settings → Database）。
3. 在 Render 服務環境變數改 `DB_*` 系列指向 Supabase（並將 `DB_CONNECTION=pgsql`）。

### 3. CORS 錯誤
確認 Render 上的 `FRONTEND_URL` 完整包含 `https://johnny77585.github.io`（**不要**加路徑 `/fit-ai`，CORS 只比對 origin）。

### 4. 想再加自訂網域
- 前端：在 repo Settings → Pages 設 Custom domain。
- 後端：Render 服務頁 → Settings → Custom Domains。
- 兩邊都加好後，把對應的 `FRONTEND_URL` / `APP_URL` / `VITE_API_URL` / Google `GOOGLE_REDIRECT_URI` 都改成新網域。

### 5. 本機開發還能用嗎？
可以。本機 `.env.local` 保持原樣，`vite.config.ts` 的 `base` 在沒設 `VITE_BASE_PATH` 時是 `/`，CORS 已允許 `localhost:3000`。

---

## D. 上線檢查清單

- [ ] Render 後端 `/api/health` 回 `{"status":"ok"}`
- [ ] GitHub Pages 首頁載得起來
- [ ] 在 Pages 上能 **註冊**新帳號（會看到 token 存進 localStorage 的 `fit_ai_auth_token`）
- [ ] 登入後能呼叫 `/api/user`、`/api/workouts` 等端點
- [ ] AI 端點 `/api/ai/extract-text` 能正常解析
- [ ] Google 登入完成後回到前端，URL 帶 `?auth=success&token=...`
- [ ] DevTools Network 沒有 CORS 紅字
