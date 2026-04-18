const BACKEND_URL = 'http://127.0.0.1:8000';

export const api = {
    async getSessions() {
        const res = await fetch(`${BACKEND_URL}/sessions`);
        if (!res.ok) throw new Error('無法取得會話列表');
        return res.json();
    },

    async getGroups() {
        const res = await fetch(`${BACKEND_URL}/groups`);
        if (!res.ok) throw new Error('無法取得群組列表');
        return res.json();
    },

    async createGroup(name = '新群組') {
        const res = await fetch(`${BACKEND_URL}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('建立群組失敗');
        return res.json();
    },

    async updateGroup(id, data) {
        const res = await fetch(`${BACKEND_URL}/groups/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('更新群組失敗');
        return res.json();
    },

    async deleteGroup(id) {
        const res = await fetch(`${BACKEND_URL}/groups/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('刪除群組失敗');
        return res.json();
    },

    async createSession(title = 'New Chat', groupId = null) {
        const res = await fetch(`${BACKEND_URL}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, group_id: groupId })
        });
        if (!res.ok) throw new Error('建立會話失敗');
        return res.json();
    },

    async moveSession(sessionId, groupId, order) {
        const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id: groupId, order })
        });
        if (!res.ok) throw new Error('移動會話失敗');
        return res.json();
    },

    async deleteSession(id) {
        const res = await fetch(`${BACKEND_URL}/sessions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('刪除會話失敗');
        return res.json();
    },

    async updateSession(id, title) {
        const res = await fetch(`${BACKEND_URL}/sessions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        if (!res.ok) throw new Error('更新會話失敗');
        return res.json();
    },

    async getMessages(sessionId) {
        const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}/messages`);
        if (!res.ok) throw new Error('無法取得訊息紀錄');
        return res.json();
    },

    async sendMessage(sessionId, content, signal) {
        const res = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, content }),
            signal
        });
        if (!res.ok) throw new Error('發送訊息失敗');
        return res.json();
    },

    async switchModel(modelId) {
        const res = await fetch(`${BACKEND_URL}/switch_model`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_id: modelId })
        });
        if (!res.ok) throw new Error('切換模型失敗');
        return res.json();
    },

    async getStatus() {
        const res = await fetch(`${BACKEND_URL}/status`);
        if (!res.ok) throw new Error('無法取得系統狀態');
        return res.json();
    },

    async runPython(code) {
        const res = await fetch(`${BACKEND_URL}/run_python`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        if (!res.ok) throw new Error('執行 Python 代碼失敗');
        return res.json();
    },

    async getUpdateLog() {
        const res = await fetch(`${BACKEND_URL}/updatelog`);
        if (!res.ok) throw new Error('無法取得更新日誌');
        return res.json();
    },

    // --- Investment APIs ---
    async getNetworkStatus() {
        const res = await fetch(`${BACKEND_URL}/investment/network_status`);
        if (!res.ok) throw new Error('無法取得聯網狀態');
        return res.json();
    },

    async toggleNetwork(allowed) {
        const res = await fetch(`${BACKEND_URL}/investment/toggle_network`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowed })
        });
        if (!res.ok) throw new Error('切換聯網權限失敗');
        return res.json();
    },

    async getStockData(symbol) {
        const res = await fetch(`${BACKEND_URL}/investment/stock/${symbol}`);
        if (!res.ok) throw new Error('無法取得股票數據');
        return res.json();
    },

    async getFundamentals(symbol) {
        const res = await fetch(`${BACKEND_URL}/investment/fundamentals/${symbol}`);
        if (!res.ok) throw new Error('無法取得基本面數據');
        return res.json();
    },

    async getGlobalNews() {
        const res = await fetch(`${BACKEND_URL}/investment/global_news`);
        if (!res.ok) throw new Error('無法取得全球新聞');
        return res.json();
    },

    async analyzeStock(symbol) {
        const res = await fetch(`${BACKEND_URL}/investment/analyze/${symbol}`);
        if (!res.ok) throw new Error('AI 分析請求失敗');
        return res.json();
    }
};
