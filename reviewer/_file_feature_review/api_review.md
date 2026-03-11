# API 介面說明文件 (API Review)

本文檔詳細列出了後端 FastAPI 提供的主要 API 端點資訊。

## 1. 對話會話 (Chat Sessions)

| 方法 | 路徑 | 功能 |
| :--- | :--- | :--- |
| `GET` | `/sessions` | 獲取所有對話紀錄 (依群組與順序排列) |
| `POST` | `/sessions` | 建立新的對話紀錄 (可指定 group_id) |
| `PATCH` | `/sessions/{id}` | 更新對話標題 |
| `DELETE` | `/sessions/{id}` | 刪除對話紀錄 (含訊息) |
| `PATCH` | `/sessions/{id}/move` | 移動會話至特定群組並設定排序 |

## 2. 聊天訊息 (Messages)

| 方法 | 路徑 | 功能 |
| :--- | :--- | :--- |
| `GET` | `/sessions/{id}/messages` | 獲取指定對話的所有訊息紀錄 |
| `POST` | `/chat` | 發送新訊息並獲取 AI 回應 |

## 3. 群組管理 (Groups)

| 方法 | 路徑 | 功能 |
| :--- | :--- | :--- |
| `GET` | `/groups` | 獲取所有群組清單 |
| `POST` | `/groups` | 建立新群組 |
| `PATCH` | `/groups/{id}` | 更新群組名稱或排序 |
| `DELETE` | `/groups/{id}` | 刪除群組 (關聯會話將轉為未分類) |

---

## 4. 系統狀態與串流 (System & Streaming)

| 方法 | 路徑 | 功能 |
| :--- | :--- | :--- |
| `GET` | `/status` | 獲取後端與模型載入狀態 (載入中/已載入/硬體設備) |
| `POST` | `/chat/stream` | [實驗性] AI 回應串流輸出 (目前僅回傳錯誤訊息) |

---

## 5. 全域開發者監控 (System Native)
- **非 HTTP 端點**: 透過 Electron 主進程捕獲後端的實體 STDOUT 串流。
- **資料格式**: 原始文本串流，包含 Rich 格式化日誌。

---
**最後更新**: 2026-02-14  
**狀態**: 已同步最新 FastAPI 路由。
