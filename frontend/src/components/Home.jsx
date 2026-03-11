import { useState, useEffect } from 'react';
import { ICONS } from '../assets/assets';
import '../styles/Home.css';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

function Home({ onNavigate, t }) {
    const [isFocused, setIsFocused] = useState(true);
    const [isOpen, setIsOpen] = useState(false); // For account fab button

    // --- Typewriter Logic ---
    const [text, setText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    const phrases = [
        "Hello there.",
        "Future Intelligence Platform",
        "Powered by X_OO",
        "Advanced Agentic Systems",
        "Welcome",
        "你好"
    ];

    //subtitle animation
    useEffect(() => {
        const handleType = () => {
            const i = loopNum % phrases.length;
            const fullText = phrases[i];

            setText(isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1)
            );

            setTypingSpeed(isDeleting ? 100 : 150);

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), 1500); // Pause at end
            } else if (isDeleting && text === "") {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, typingSpeed]);

    useEffect(() => {
        const handleFocusChange = (e, focused) => setIsFocused(focused);
        if (ipcRenderer) {
            ipcRenderer.on('app-focus-changed', handleFocusChange);
        }
        return () => {
            if (ipcRenderer) {
                ipcRenderer.removeListener('app-focus-changed', handleFocusChange);
            }
        };
    }, []);

    return (
        <div className={`home-view ${!isFocused ? 'is-paused' : ''}`}>
            <div className="abstract-background">
                <div className="line line-1"><div className="streak"></div></div>
                <div className="line line-2"><div className="streak"></div></div>
                <div className="line line-3"><div className="streak"></div></div>
                <div className="line line-4"><div className="streak"></div></div>
                <div className="pulse-circle"></div>
            </div>

            <div className="home-content">
                <div className="logo-container">
                    <h1 className="main-title">X-<span>SLM</span></h1>
                    <div className="subtitle-container">
                        <p className="subtitle">
                            {text}<span className="cursor">█</span>
                        </p>
                    </div>
                </div>

                <div className="entry-buttons">
                    <button className="entry-btn chat-entry" onClick={() => onNavigate('chat')}>
                        <div className="btn-inner">
                            <span className="icon">
                                <img src={ICONS.send} alt="Chat" className="home-btn-icon" />
                            </span>
                            <span className="text">{t ? t.startChat : "開始對話"}</span>
                        </div>
                    </button>

                    <button className="entry-btn settings-entry" onClick={() => onNavigate('settings')}>
                        <div className="btn-inner">
                            <span className="icon">
                                <img src={ICONS.settings} alt="Settings" className="home-btn-icon" />
                            </span>
                            <span className="text">{t ? t.settings : "系統設定"}</span>
                        </div>
                    </button>

                    <button className="entry-btn updatelog-btn" onClick={() => onNavigate('updatelog')}>
                        <div className="btn-inner">
                            <span className="icon">
                                <img src={ICONS.update} alt="Update" className="home-btn-icon" />
                            </span>
                            <span className="text">{t ? t.updateLog : "更新日誌"}</span>
                        </div>
                    </button>

                    <button className="entry-btn credits-btn" onClick={() => onNavigate('credits')}>
                        <div className="btn-inner">
                            <span className="icon">
                                <img src={ICONS.coffee} alt="Thanks" className="home-btn-icon" />
                            </span>
                            <span className="text">{t ? t.credits : "開發鳴謝"}</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="home-account-fab">
                <button
                    className="fab-button"
                    onClick={() => setIsOpen(true)}
                    title="Account"
                >
                    <img src={ICONS.account} alt="Account" />
                </button>
            </div>

            {isOpen && (
                <div className="home-account-overlay" onClick={() => setIsOpen(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="home-account-modal"
                    >
                        <button className="modal-close-btn" onClick={() => setIsOpen(false)}>×</button>

                        <div className="account-header">
                            <div className="account-avatar-wrapper">
                                <img src={ICONS.account} alt="User Avatar" className="account-avatar" />
                                <div className="status-indicator online"></div>
                            </div>
                            <h2 className="account-name">Dylan_Dev</h2>
                            <p className="account-status">Premium Member</p>
                        </div>

                        <div className="account-body">
                            <div className="account-info-group">
                                <label>Email Address</label>
                                <div className="info-value">dylan.dev@example.com</div>
                            </div>
                            <div className="account-info-group">
                                <label>Current Plan</label>
                                <div className="info-value">Advanced Core v0.6</div>
                            </div>
                            <div className="account-info-group">
                                <label>Compute Access</label>
                                <div className="info-value">CUDA Accelerated</div>
                            </div>
                        </div>

                        <div className="account-footer">
                            <button className="account-action-btn primary">Manage Profile</button>
                            <button className="account-action-btn secondary">Switch Account</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="footer-info">
                <span>ALPHA Version 1.0.0</span>
                <span className="divider">|</span>
                <span>CUDA ACCELERATED</span>
                <span className="divider">|</span>
                <span>Powered by X_OO</span>
            </div>
        </div>
    );
}

export default Home;