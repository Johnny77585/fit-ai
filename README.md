<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Fit AI

AI 健身記錄 App：支援語音、照片與手動輸入。**React SPA** 前端 + **Laravel API** 後端。

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?style=flat&logo=google)](https://ai.google.dev/)

## 功能展示

> 將截圖放入 `docs/screenshots/` 後，下方圖片會自動顯示（檔名需一致）。

| 登入 / 首頁 | 語音或文字記錄 | AI 解析結果 |
|:---:|:---:|:---:|
| ![首頁](docs/screenshots/home.png) | ![記錄](docs/screenshots/record.png) | ![AI](docs/screenshots/ai-result.png) |

*尚未加入截圖時，可執行 App 後用 Win+Shift+S 截圖，存成上述檔名。*

## 專案亮點（面試用）

| 主題 | 說明 |
|------|------|
| **前後端分離** | React SPA + Laravel REST API，Vite 開發時代理 `/api` 至後端 |
| **認證與安全** | Laravel Sanctum、Fortify；Gemini API **僅在後端呼叫**，金鑰不進瀏覽器 |
| **OAuth 實務** | Google 登入；callback 以 Token 回傳前端，解決 localhost 不同 port 的 Cookie 限制 |
| **AI 整合** | 語音、器材照片、自然語言三種輸入，統一由後端呼叫 Gemini 結構化訓練資料 |
| **資料模型** | 訓練紀錄、動作分類、動作庫 metadata 分表設計，支援 CRUD 與擴充 |

**我負責的部分**（可依實際分工修改）：

- 前後端架構規劃、API 設計與實作
- 使用者註冊／登入、Google OAuth、Auth Context
- AI 解析端點（voice / image / text）與前端整合

## 架構

- **前端**：React 19、Vite、Tailwind CSS（`src/`）
- **後端**：Laravel 11、Sanctum、Fortify、Socialite（`api/`）
- **資料庫**：SQLite（預設）或 MySQL
- **AI**：Google Gemini（僅在後端呼叫，API Key 不暴露給瀏覽器）

## 環境需求

- Node.js 18+
- PHP 8.2+（擴充：`openssl`、`pdo`、`mbstring`、`tokenizer`、`xml`、`ctype`、`json`、`bcmath`）
- Composer 2.x
- （選用）Docker — 若本機未安裝 PHP，可用 Docker 跑 API

## 安裝與設定

### 1. 後端（Laravel API）

```bash
cd api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
```

編輯 `api/.env`：

| 變數 | 說明 |
|------|------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) 取得的 Gemini API 金鑰（語音／照片 AI 必填） |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google 登入（選用） |
| `GOOGLE_REDIRECT_URI` | 須與 Google Console 完全一致，預設：`http://localhost:8000/api/auth/google/callback` |

啟動 API：

```bash
php artisan serve
```

位址：http://localhost:8000

**使用 Docker（本機無 PHP 時）：**

```bash
cd api
composer install   # 或用 Docker：docker run --rm -v "%cd%:/app" -w /app composer:latest install
docker run -d --name fit-ai-api -p 8000:8000 -v "%cd%:/app" -w /app composer:latest php artisan serve --host=0.0.0.0 --port=8000
```

### 2. 前端（React）

```bash
# 在專案根目錄
cp .env.example .env.local
npm install
npm run dev
```

位址：http://localhost:3000  
Vite 會將 `/api`、`/sanctum` 代理到 Laravel（`http://127.0.0.1:8000`）。

`.env.local` 範例：

```env
VITE_API_URL=/api
VITE_OAUTH_URL=http://localhost:8000/api
```

## 本機開發

請在**兩個終端**分別啟動：

| 終端 | 指令 | 網址 |
|------|------|------|
| 1 | `cd api && php artisan serve`（或 Docker 容器） | http://localhost:8000 |
| 2 | `npm run dev` | http://localhost:3000 |

瀏覽器開啟：**http://localhost:3000**

## 登入方式

- **Email**：在登入頁註冊／登入
- **Google**：於 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立 OAuth 用戶端，並將 **Authorized redirect URIs** 設為：

  ```
  http://localhost:8000/api/auth/google/callback
  ```

  Google 登入完成後會以 Token 方式帶回前端（避免 localhost 不同 port 的 Cookie 問題）。

## 資料庫

預設使用 SQLite 檔案：

```
api/database/database.sqlite
```

可用 [DB Browser for SQLite](https://sqlitebrowser.org/) 或 DBeaver 開啟檢視。  
HeidiSQL 適用 MySQL；若要用 HeidiSQL，請將 `api/.env` 改為 `DB_CONNECTION=mysql` 並另行架設 MySQL。

查看資料（Docker API 容器）：

```bash
docker exec fit-ai-api php artisan migrate:status
docker exec -it fit-ai-api php artisan tinker
```

## API 一覽

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/register` | Email 註冊 |
| POST | `/api/login` | Email 登入 |
| POST | `/api/logout` | 登出 |
| GET | `/api/user` | 目前使用者 |
| GET | `/api/auth/google/redirect` | Google OAuth 導向 |
| GET | `/api/auth/google/callback` | Google OAuth 回呼 |
| CRUD | `/api/workouts` | 訓練紀錄 |
| CRUD | `/api/categories` | 動作分類 |
| CRUD | `/api/exercise-definitions` | 動作庫 metadata |
| POST | `/api/ai/extract-voice` | 解析語音 |
| POST | `/api/ai/extract-image` | 解析器材照片 |
| POST | `/api/ai/extract-text` | 解析自然語言 |

## 專案結構

```
fit-ai/
├── api/                 # Laravel 後端
├── src/                 # React 前端
│   ├── api/             # API 客戶端
│   └── contexts/        # Auth 等 Context
├── docs/screenshots/    # README 展示用截圖
├── vite.config.ts
└── package.json
```

## 作者

**JKUO** · [GitHub @Johnny77585](https://github.com/Johnny77585) · [jkuo2188@gmail.com](mailto:jkuo2188@gmail.com)

若此專案對你有幫助，歡迎 Star ⭐
