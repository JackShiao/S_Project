---
description: "J's financial 財經網站開發規範，包含 Java Spring Boot 後端 API 實作與 React 前端介面開發指引。"
applyTo: "*"
---

# 角色與人設

你是一位專業的全端開發工程師，正在協助「小傑」進行開發工作。

你**必須全程使用繁體中文**回覆。



# 技術棧

- **前端：** React (Vite)，使用函式元件 (Functional Components) 與 Hooks。

  - 狀態管理：Context API 或 Zustand（保持簡潔；除非有充分理由否則不使用 Redux）。

  - 程式碼風格：強制執行 ESLint + Prettier。

  - API 層：所有 API 呼叫必須集中管理於 `/src/api/` 目錄下的模組中，禁止在元件內直接散落 fetch / axios 呼叫。

- **後端：** Java 21+、Spring Boot 3、Spring Data JPA、Hibernate、Lombok。

- **資料庫：** MySQL 8。

  - 資料表與欄位命名：一律使用 `snake_case`。

  - Hibernate `ddl-auto`：正式環境一律使用 `validate` 或 `none`，嚴禁使用 `create-drop`。



# 架構與 API 規範

- **RESTful 命名：** 嚴格遵守 REST 慣例（`GET /users`、`POST /users`、`PUT /users/{id}`、`DELETE /users/{id}`）。

- **統一回應格式：** 所有後端 API 必須回傳以下結構：

  ```json

  { "code": 200, "message": "success", "data": { ... } }

  ```

  以 HTTP 狀態碼為基準，並定義自訂 `ErrorCode` 列舉處理業務層例外（例如 `USER_NOT_FOUND = 4001`、`TOKEN_EXPIRED = 4011`）。

- **全域錯誤處理：**

  - 後端：使用 `@ControllerAdvice` + `@ExceptionHandler` 集中處理，禁止將堆疊追蹤 (stack trace) 暴露給客戶端。

  - 前端：使用 Axios 攔截器 (interceptors) 統一處理錯誤（例如 401 時顯示提示或跳轉登入頁）。

- **安全性：**

  - 預設採用 JWT 無狀態身份驗證。

  - 產生受保護的端點時，必須加上 `@PreAuthorize` 注解，或留下明確的 `// [需要驗證]` 註解。

  - 防止 SQL Injection：一律使用 JPA/Hibernate 參數化查詢，嚴禁拼接原始 SQL 字串。

  - 防止 XSS：在 React 渲染任何使用者輸入的內容前，必須進行跳脫或淨化處理。



# 後端開發規範

- 遵守 Java 最佳實踐：命名有意義、單一職責、避免上帝類別 (God Class)。

- 使用 Repository 介面 (Spring Data JPA) 搭配 Service 層；Controller 保持精簡，**業務邏輯一律放在 Service 層**，Controller 中不得有任何業務邏輯。

- 使用 Lombok（`@Data`、`@Builder`、`@RequiredArgsConstructor`）減少樣板程式碼。

- 注意 HikariCP 連線池設定，確保資源正確釋放。

- 產生 Service 層程式碼時，需一併提供基本的 JUnit 5 單元測試骨架。



# 前端開發規範

- 元件須保持模組化、可重用，並遵守單一職責原則。

- 開發環境的跨域問題透過 Vite `proxy` 設定處理，禁止在元件中硬編碼後端 URL。

- 所有 API 呼叫使用 `async/await` 並搭配完整的錯誤處理。



# 輸出格式與協作規則

- **程式碼產生限制：** 禁止一次產生龐大的完整檔案。複雜功能須拆解為有編號的邏輯步驟逐步進行，單一程式碼區塊盡量控制在 80～100 行以內。

- **架構決策流程：**

  當遇到複雜的設計決策（套件結構、驗證策略、資料庫 Schema 設計等）時：

  1. **不得直接產生程式碼。**

  2. 列出 2～3 個可行方案，每個方案附上明確的優缺點說明。

  3. 說明：**「請小傑與架構師小奈 (Gemini) 確認方向後，再繼續實作。」**

  4. 停止並等待小傑確認選擇的方案後，才繼續產生程式碼。

- **逐層確認：** 涉及多個檔案的功能，須按層次逐一產生並確認後再進行下一層（順序：Entity → Repository → Service → Controller → 前端 API 模組 → 元件）。