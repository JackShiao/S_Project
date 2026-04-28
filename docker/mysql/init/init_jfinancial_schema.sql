-- 初始化 JFinancial 資料庫結構與測試資料
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS member_watchlist;
DROP TABLE IF EXISTS member_role;
DROP TABLE IF EXISTS market_index;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS role;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE role (
	id INT NOT NULL AUTO_INCREMENT,
	role_name VARCHAR(30) NOT NULL COMMENT '權限身分',
	PRIMARY KEY (id),
	UNIQUE KEY uk_role_role_name (role_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE member (
	id INT NOT NULL AUTO_INCREMENT,
	email VARCHAR(100) NOT NULL COMMENT '使用者的登入帳號',
	password_hash VARCHAR(100) NOT NULL COMMENT '加密密碼存放區',
	display_name VARCHAR(50) NOT NULL COMMENT '暱稱',
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建帳號時間',
	PRIMARY KEY (id),
	UNIQUE KEY uk_member_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE market_index (
	id INT NOT NULL AUTO_INCREMENT,
	symbol VARCHAR(20) NOT NULL COMMENT '指數代號',
	name VARCHAR(50) NOT NULL COMMENT '指數名稱',
	current_price DECIMAL(10,2) NOT NULL COMMENT '指數價格',
	change_point DECIMAL(10,2) NOT NULL COMMENT '指數漲跌點數',
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
	PRIMARY KEY (id),
	UNIQUE KEY uk_market_index_symbol (symbol)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE member_role (
	member_id INT NOT NULL,
	role_id INT NOT NULL,
	PRIMARY KEY (member_id, role_id),
	KEY fk_member_role_role (role_id),
	CONSTRAINT fk_member_role_member
		FOREIGN KEY (member_id) REFERENCES member (id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT,
	CONSTRAINT fk_member_role_role
		FOREIGN KEY (role_id) REFERENCES role (id)
		ON DELETE RESTRICT
		ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE member_watchlist (
	member_id INT NOT NULL,
	market_index_id INT NOT NULL,
	added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入時間',
	PRIMARY KEY (member_id, market_index_id),
	KEY fk_member_watchlist_market_index (market_index_id),
	CONSTRAINT fk_member_watchlist_market_index
		FOREIGN KEY (market_index_id) REFERENCES market_index (id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT,
	CONSTRAINT fk_member_watchlist_member
		FOREIGN KEY (member_id) REFERENCES member (id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE market_price_history (
	id BIGINT NOT NULL AUTO_INCREMENT,
	symbol VARCHAR(20) NOT NULL COMMENT '指數代號',
	price DECIMAL(15,4) NOT NULL COMMENT '快照價格',
	recorded_at DATETIME NOT NULL COMMENT '記錄時間',
	PRIMARY KEY (id),
	INDEX idx_market_price_history_symbol_recorded_at (symbol, recorded_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO role (id, role_name)
VALUES
	(1, 'ROLE_USER'),
	(2, 'ROLE_ADMIN');

INSERT INTO member (id, email, password_hash, display_name, created_at)
VALUES
	(1, 'test@example.com', '$2b$10$PbSOaSRqtzwMPGdKtHNUS.xjuTIAh/46O34/yLbTKPMdRZDHFpmyi', '測試會員', '2026-03-30 15:21:38');

INSERT INTO member_role (member_id, role_id)
VALUES
	(1, 1);

INSERT INTO market_index (id, symbol, name, current_price, change_point, updated_at)
VALUES
	(1, '^TWII', '台灣加權指數', 20345.67, 85.32, '2026-03-30 15:21:38'),
	(2, '^IXIC', '納斯達克綜合指數', 17890.45, -42.18, '2026-03-30 15:21:38'),
	(3, '^GSPC', 'S&P 500', 5298.21, 12.76, '2026-03-30 15:21:38');

INSERT INTO member_watchlist (member_id, market_index_id, added_at)
VALUES
	(1, 1, '2026-03-30 15:21:38'),
	(1, 2, '2026-03-30 15:21:38');

-- 驗證查詢：檢查各表筆數
-- SELECT 'role' AS table_name, COUNT(*) AS total_count FROM role
-- UNION ALL
-- SELECT 'member', COUNT(*) FROM member
-- UNION ALL
-- SELECT 'member_role', COUNT(*) FROM member_role
-- UNION ALL
-- SELECT 'market_index', COUNT(*) FROM market_index
-- UNION ALL
-- SELECT 'member_watchlist', COUNT(*) FROM member_watchlist;

-- 驗證查詢：檢查會員角色關聯
-- SELECT m.email, m.display_name, r.role_name
-- FROM member m
-- JOIN member_role mr ON mr.member_id = m.id
-- JOIN role r ON r.id = mr.role_id;

-- 驗證查詢：檢查會員追蹤清單
-- SELECT m.email, mi.symbol, mi.name, mi.current_price, mi.change_point, mw.added_at
-- FROM member_watchlist mw
-- JOIN member m ON m.id = mw.member_id
-- JOIN market_index mi ON mi.id = mw.market_index_id
-- ORDER BY mw.added_at DESC, mi.id ASC;
