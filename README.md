# J's Financial — 財經資訊網站

個人全端練習專案，提供市場指數、財經新聞瀏覽，以及登入後的觀察名單與投資組合管理功能。

---

## 技術棧

| 層次 | 技術 |
|------|------|
| 前端 | React 19 (Vite)、Bootstrap 5、Chart.js、Zustand、React Router v7 |
| 後端 | Java 21、Spring Boot、Spring Security (JWT)、Spring Data JPA |
| 資料庫 | MySQL 8.4 |
| 容器 | Docker / Docker Compose |

---

## 功能

- **首頁** — 市場指數快覽、最新財經新聞摘要
- **市場** — 股市／債市／匯市即時指數與歷史折線圖（Navbar 搜尋可直接跳轉）
- **新聞** — Google News RSS 多分類，點擊開啟詳情 Modal
- **關於我** — 專案介紹
- **登入 / 註冊** — JWT 無狀態驗證
- **個人資料** — 修改顯示名稱
- **觀察名單** — 追蹤 / 移除指數
- **投資組合** — 新增／刪除持倉、成本 vs 現值損益長條圖

---

## 本地開發環境建置

### 前置需求

- Docker Desktop
- JDK 21+
- Node.js 20+
- Maven（或使用專案內的 `mvnw`）

### 1. 啟動 MySQL（Docker）

```bash
docker compose up -d
```

MySQL 會在 `localhost:3306`，資料庫名稱 `jfinancial`，並自動執行 `docker/mysql/init/init_jfinancial_schema.sql` 初始化 Schema。

### 2. 設定後端敏感設定

複製範本並填入實際值：

```bash
cp backend-api/src/main/resources/application-local.properties.example \
   backend-api/src/main/resources/application-local.properties
```

> `application-local.properties` 已加入 `.gitignore`，請勿提交至版本庫。

需填寫的設定項：

```properties
# FRED API Key（取得美國公債殖利率）
fred.api.key=YOUR_FRED_API_KEY

# JWT Secret（建議 256-bit 以上隨機字串）
jwt.secret=YOUR_JWT_SECRET
```

FRED API Key 可至 [https://fred.stlouisfed.org/](https://fred.stlouisfed.org/) 免費申請。

### 3. 啟動後端

```bash
cd backend-api
./mvnw spring-boot:run
```

後端預設監聽 `http://localhost:8080`。

### 4. 啟動前端

```bash
cd frontend-ui
npm install
npm run dev
```

前端預設於 `http://localhost:5173`，開發環境已設定 Vite Proxy，`/api` 請求自動轉發至後端。

---

## 專案結構

```
J-Financial-Workspace/
├── backend-api/          # Spring Boot 後端
│   └── src/main/java/com/jackshiao/financial/
│       ├── controller/   # REST API 端點
│       ├── service/      # 業務邏輯
│       ├── repository/   # Spring Data JPA
│       ├── entity/       # JPA 實體
│       ├── dto/          # 資料傳輸物件
│       ├── config/       # Security / CORS 設定
│       ├── scheduler/    # 定時資料更新任務
│       └── common/       # 統一回應格式、全域例外處理
├── frontend-ui/          # React 前端
│   └── src/
│       ├── api/          # Axios API 模組
│       ├── components/   # 共用元件（Navbar、Footer、Toast 等）
│       ├── pages/        # 頁面元件
│       └── store/        # Zustand 狀態管理
└── docker/
    └── mysql/init/       # MySQL 初始化 SQL
```

---

## API 回應格式

所有 API 均回傳統一結構：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

---

## 排程任務

後端每 30 分鐘自動更新以下資料：

| 資料 | 來源 |
|------|------|
| 台股加權指數 | TWSE Open API |
| 美股指數（SPX / IXIC / DJI） | Yahoo Finance |
| 日股指數（N225） | Yahoo Finance |
| 美國公債殖利率（2Y / 10Y） | FRED API |
| 日本公債殖利率 | Yahoo Finance |
| 匯率（USD/TWD、JPY/TWD、CNY/TWD） | Yahoo Finance |
