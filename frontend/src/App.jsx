import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api';
import NavBar from './components/NavBar';
import OmniWindow from './components/OmniWindow';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Settings from './components/Settings';
import Home from './components/Home';
import Credits from './components/Credits';
import UpdateLog from './components/UpdateLog';
import { playSound } from './utils/soundUtils';
import { languages } from './translations/languages';
import { ICONS } from './assets/assets'
import { useNotification } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import './styles/theme_variables.css';
import './styles/base.css';
import './styles/Chat.css';

const { ipcRenderer } = (window.require && window.require('electron')) || { ipcRenderer: null };

function App() {
  const { addNotification } = useNotification();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState('home'); // 'home', 'chat', or 'settings'
  const [hasSeenEntryAnim, setHasSeenEntryAnim] = useState(false);
  const [isEnteringChat, setIsEnteringChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedModel, setSelectedModel] = useState('Llama_3.2_3B_It_Q4_K_M'); // 預設 llama
  const [isModelLoading, setIsModelLoading] = useState(false); // Model是否Loading

  // Omni-Window States
  const [omniVisible, setOmniVisible] = useState(false);
  const [omniContent, setOmniContent] = useState('');
  const [omniType, setOmniType] = useState('code'); // 'code' or 'web'

  const abortControllerRef = useRef(null); // 中止機制
  const messagesEndRef = useRef(null);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('llama_config');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      temperature: 0.7,
      maxTokens: 512,
      soundEnabled: true,
      language: 'en',
    };
  });

  //取得當前語系
  const t = languages[config.language] || languages.zh;

  // --- 核心函數定義(Handlers)

  // 更新數據
  const fetchData = useCallback(async () => {
    try {
      const [gs, ss] = await Promise.all([api.getGroups(), api.getSessions()]);
      setGroups(gs);
      setSessions(ss);
    } catch (e) {
      console.error("更新數據失敗", e);
    }
  }, []);

  //切換畫面函數
  const handleNavigate = useCallback((target) => {
    playSound('click', config.soundEnabled);
    if (target === 'chat' && view === 'home' && !hasSeenEntryAnim) {
      setIsEnteringChat(true);
      setHasSeenEntryAnim(true);
      setTimeout(() => {
        setView('chat');
        setIsEnteringChat(false);
      }, 800);
    } else {
      setView(target);
    }
  }, [config.soundEnabled, view, hasSeenEntryAnim]);

  //新增聊天室
  const handleNewChat = useCallback(async (groupId = null) => {
    playSound('click', config.soundEnabled);
    try {
      const data = await api.createSession('New Chat', groupId);
      setSessionId(data.id);
      setMessages([]);
      await fetchData();
    } catch (e) {
      playSound('error', config.soundEnabled);
      addNotification(`${t.error || '錯誤'}: ${e.message}`, 'error');
      console.error("建立會話失敗", e);
    }
  }, [config.soundEnabled, fetchData, t.error]);

  //載入聊天室
  const handleLoadSession = useCallback(async (id) => {
    playSound('click', config.soundEnabled);
    try {
      setSessionId(id);
      const data = await api.getMessages(id);
      setMessages(data);
    } catch (e) {
      playSound('error', config.soundEnabled);
      addNotification(`${t.error || '錯誤'}: ${e.message}`, 'error');
      console.error("載入失敗", e);
    }
  }, [config.soundEnabled, t.error]);

  //刪除聊天室
  const handleDeleteSession = useCallback(async (id) => {
    if (!window.confirm('確定要刪除此對話紀錄嗎？')) return;
    playSound('click', config.soundEnabled);
    try {
      await api.deleteSession(id);
      playSound('success', config.soundEnabled);

      const [gs, ss] = await Promise.all([api.getGroups(), api.getSessions()]);
      setGroups(gs);
      setSessions(ss);

      if (sessionId === id) {
        if (ss.length > 0) {
          handleLoadSession(ss[0].id);
        } else {
          setMessages([]);
          handleNewChat();
        }
      }
    } catch (e) {
      playSound('error', config.soundEnabled);
      addNotification(`${t.error || '錯誤'}: ${e.message}`, 'error');
      console.error("刪除失敗", e);
    }
  }, [config.soundEnabled, handleLoadSession, handleNewChat, sessionId, t.error]);

  //重新命名聊天室
  const handleRenameSession = useCallback(async (id, newTitle) => {
    const targetTitle = newTitle.trim();
    if (!targetTitle || targetTitle === sessions.find(s => s.id === id)?.title) return;
    try {
      await api.updateSession(id, targetTitle);
      playSound('success', config.soundEnabled);
      fetchData();
    } catch (e) {
      playSound('error', config.soundEnabled);
      addNotification(`${t.error || '錯誤'}: ${e.message}`, 'error');
      console.error("更名失敗", e);
    }
  }, [config.soundEnabled, fetchData, sessions, t.error]);

  //新增聊天群組
  const handleNewGroup = async () => {
    playSound('click', config.soundEnabled);
    try {
      await api.createGroup('新群組');
      playSound('success', config.soundEnabled);
      fetchData();
    } catch (e) {
      playSound('error', config.soundEnabled);
      console.error("建立群組失敗", e);
    }
  };

  //重新命名聊天群組
  const handleRenameGroup = async (id, newName) => {
    try {
      await api.updateGroup(id, { name: newName });
      playSound('success', config.soundEnabled);
      fetchData();
    } catch (e) {
      playSound('error', config.soundEnabled);
      console.error("更名群組失敗", e);
    }
  };

  //刪除聊天群組
  const handleDeleteGroup = async (id) => {
    if (!window.confirm('確定要刪除此群組嗎？(會話會轉為未分類)')) return;
    playSound('click', config.soundEnabled);
    try {
      await api.deleteGroup(id);
      playSound('success', config.soundEnabled);
      fetchData();
    } catch (e) {
      playSound('error', config.soundEnabled);
      console.error("刪除群組失敗", e);
    }
  };

  //移動聊天室
  const handleMoveSession = async (sessionId, targetGroupId, targetSessionId, position) => {
    let newOrder = 0;
    if (targetSessionId) {
      const target = sessions.find(s => s.id === targetSessionId);
      newOrder = position === 'top' ? target.order : target.order + 1;
    }
    try {
      await api.moveSession(sessionId, targetGroupId, newOrder);
      fetchData();
    } catch (e) {
      console.error("移動失敗", e);
    }
  };

  //發送訊息
  const handleSendMessage = async (content) => {
    let finalContent = content;
    if (replyingTo) {
      finalContent = `[回覆內容: ${replyingTo}]\n\n${content}`;
      setReplyingTo(null);
    }
    const userMsg = { role: 'user', content: finalContent };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const data = await api.sendMessage(sessionId, content, abortControllerRef.current.signal);
      setMessages(prev => [...prev, data]);
      const htmlRegex = /```html\s+([\s\S]*?)```/;
      const codeRegex = /```(\w+)\s+([\s\S]*?)```/;
      const htmlMatch = data.content.match(htmlRegex);
      const codeMatch = data.content.match(codeRegex);
      if (htmlMatch) {
        setOmniContent(htmlMatch[1]);
        setOmniType('html');
        setOmniVisible(true);
      } else if (codeMatch) {
        const fullMatch = data.content.match(/```(\w+)\n/);
        const lang = fullMatch ? fullMatch[1] : 'code';
        setOmniContent(codeMatch[2]);
        setOmniType(lang);
        setOmniVisible(true);
      }
      addNotification(t.aiCompleteNotice || "AI 訊息輸出完成", "success");
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log("生成已停止");
      } else {
        console.error("發送失敗", e);
        addNotification(`${t.error || '錯誤'}: ${e.message}`, "error");
        setMessages(prev => [...prev, { role: 'assistant', content: "錯誤: 伺服器無回應。" }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  //停止AI生成訊息
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length > 0) {
        setInput(userMessages[userMessages.length - 1].content);
      }
    }
  };

  //複製AI生成訊息
  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      playSound('success', config.soundEnabled);
    });
  };

  //回覆AI生成訊息
  const handleReplyMessage = (content) => {
    setReplyingTo(content);
  };

  //開啟後台監管
  const handleOpenMonitor = () => {
    if (ipcRenderer) {
      ipcRenderer.send('open-monitor');
    } else {
      alert("僅在 Electron 環境支援此功能");
    }
  };

  //切換語言模型
  const handleModelChange = async (modelId) => {
    if (modelId === selectedModel) return;
    setIsModelLoading(true);
    setSelectedModel(modelId);
    try {
      await api.switchModel(modelId);
      playSound('success', config.soundEnabled);
    } catch (e) {
      console.error("切換失敗，請檢查後端控制台", e);
      playSound('error', config.soundEnabled);
    } finally {
      setIsModelLoading(false);
    }
  };

  // --- 2. 副作用處理 (Effects) ---

  // 使用 Ref 儲存最新 Handler，避免 Effect 頻繁重啟
  const handlersRef = useRef({ handleNavigate, addNotification, setConfig });
  useEffect(() => {
    handlersRef.current = { handleNavigate, addNotification, setConfig };
  }, [handleNavigate, addNotification, setConfig]);

  // 存檔設定
  useEffect(() => {
    localStorage.setItem('llama_config', JSON.stringify(config));
    document.body.dataset.theme = config.theme;
  }, [config]);

  // 初始化數據
  useEffect(() => {
    const init = async () => {
      try {
        const [gs, ss] = await Promise.all([api.getGroups(), api.getSessions()]);
        setGroups(gs);
        setSessions(ss);
        if (ss.length === 0) {
          await handleNewChat();
        } else {
          handleLoadSession(ss[0].id);
        }
        const status = await api.getStatus();
        if (status.model_loaded && status.current_model) {
          setSelectedModel(status.current_model);
        }
      } catch (e) {
        console.warn("初始化失敗 (後端可能未啟動)", e.message);
      }
    };
    init();
  }, [handleNewChat, handleLoadSession]);

  // Dev指令監聽與解析 (穩定版：僅註冊一次)
  useEffect(() => {
    if (!ipcRenderer) {
      console.warn("DevCommand: ipcRenderer is NOT available.");
      return;
    }

    console.log("DevCommand: [Mount] Establishing stable IPC listener...");

    const onExecuteCommand = (event, fullCmd) => {
      console.log("DevCommand: [IPC] Received ->", fullCmd);
      const { handleNavigate, addNotification, setConfig } = handlersRef.current;

      try {
        const parts = fullCmd.split(' ');
        const command = parts[0];
        const args = parts.slice(1);

        console.log(`DevCommand: Executing '${command}'...`);

        switch (command) {
          case '/notify':
            addNotification(args.join(' ') || "Hello!", 'info');
            break;
          case '/error':
            addNotification(args.join(' ') || "Error!", 'error');
            break;
          case '/success':
            addNotification(args.join(' ') || "Success!", 'success');
            break;
          case '/nav':
            const v = args[0];
            if (['home', 'chat', 'settings', 'credits'].includes(v)) {
              handleNavigate(v);
            } else {
              addNotification(`Unknown view: ${v}`, 'error');
            }
            break;
          case '/set':
            if (args.length >= 2) {
              const k = args[0]; let val = args[1];
              if (val === 'true') val = true; else if (val === 'false') val = false;
              else if (!isNaN(val) && val.trim() !== '') val = Number(val);
              setConfig(prev => ({ ...prev, [k]: val }));
              addNotification(`Set ${k} to ${val}`, 'success');
            }
            break;
          default:
            console.warn("DevCommand: No match for", command);
            addNotification(`Invalid command: ${command}`, 'error');
        }
      } catch (err) {
        console.error("DevCommand Runtime Error:", err);
      }
    };

    ipcRenderer.on('execute-dev-command', onExecuteCommand);
    return () => {
      console.log("DevCommand: [Unmount] Removing listener.");
      ipcRenderer.removeListener('execute-dev-command', onExecuteCommand);
    };
  }, []); // 空陣列確保只在載入時執行一次

  // 自動捲動
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <div className={`app-container ${isEnteringChat ? 'entering-transition' : ''}`}>
      <NotificationContainer />

      {/* 當畫面為主頁面時 */}
      {view === 'home' ? (
        <Home onNavigate={handleNavigate} t={t} />
      ) : view === 'credits' ? (
        <Credits onBack={() => handleNavigate('home')} t={t} />
      ) : view === 'updatelog' ? (
        <UpdateLog onBack={() => handleNavigate('home')} t={t} />
      ) : (
        <>
          <NavBar
            groups={groups}
            sessions={sessions}
            sessionId={sessionId}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onNewChat={handleNewChat}
            onLoadSession={(id) => { handleNavigate('chat'); handleLoadSession(id); }}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onNewGroup={handleNewGroup}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
            onMoveSession={handleMoveSession}
            onOpenSettings={() => { handleNavigate('settings'); }}
            onGoHome={() => { handleNavigate('home'); }}
            activeView={view}
            onPlayClick={(force = false) => playSound('click', force || config.soundEnabled)}
            handleNavigate={handleNavigate}
            onToggleOmni={() => setOmniVisible(!omniVisible)}
            t={t}
          />

          {/* 聊天與多視窗區域 */}
          <div className="content-area">
            <div className="main-chat">
              {view === 'chat' && (
                <>
                  <div className="messages-container">
                    {messages.length === 0 && (
                      <div className="empty-state">
                        <h2>X-SLM</h2>
                        <p>Powered by X_OO</p>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <ChatMessage
                        key={idx}
                        msg={msg}
                        onCopy={handleCopyMessage}
                        onReply={handleReplyMessage}
                        t={t}
                      />
                    ))}

                    {isLoading && (
                      <div className="message assistant loading">
                        <div className="avatar">
                          <img src={ICONS.account} alt="AI" className="avatar-img" />
                        </div>
                        <div className="message-content">...</div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <ChatInput
                    input={input}
                    setInput={setInput}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    isLoading={isLoading}
                    t={t}
                  />
                </>
              )}

              {/* 當畫面為設定時 */}
              {view === 'settings' && (
                <Settings
                  config={config}
                  onUpdateConfig={setConfig}
                  onBack={() => { handleNavigate('chat'); }}
                  onPlayClick={(force = false) => playSound('click', force || config.soundEnabled)}
                  onOpenMonitor={() => { playSound('click', config.soundEnabled); handleOpenMonitor(); }}
                  selectedModel={selectedModel}
                  isModelLoading={isModelLoading}
                  onModelChange={handleModelChange}
                  t={t}
                />
              )}
            </div>

            <OmniWindow
              content={omniContent}
              type={omniType}
              visible={omniVisible && view === 'chat'}
              onClose={() => setOmniVisible(false)}
              t={t}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
