import React, { useState, useRef, useEffect, memo } from 'react';
import { ICONS } from '../assets/assets';
import '../styles/NavBar.css';

function NavBar({
    groups,
    sessions,
    sessionId,
    sidebarOpen,
    onToggleSidebar,
    onNewChat,
    onLoadSession,
    onDeleteSession,
    onRenameSession,
    onNewGroup,
    onRenameGroup,
    onDeleteGroup,
    onMoveSession,
    onOpenSettings,
    onOpenInvestment,
    onOpenNewsMap,
    onGoHome,
    activeView,
    onPlayClick,
    handleNavigate,
    onToggleOmni,
    t
}) {
    const [editingId, setEditingId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [dragOverInfo, setDragOverInfo] = useState(null);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('sidebar_width');
        return saved ? parseInt(saved) : 320;
    });
    const [isResizing, setIsResizing] = useState(false);

    // Resize Logic
    const startResizing = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth >= 300 && newWidth <= 500) {
                setSidebarWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            localStorage.setItem('sidebar_width', sidebarWidth.toString());
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing, sidebarWidth]);

    const toggleGroup = (groupId) => {
        onPlayClick();
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const handleStartRename = (e, id, currentTitle) => {
        e.stopPropagation();
        setEditingId(id);
        setEditingTitle(currentTitle);
    };

    const handleRenameSubmit = (type, id, value) => {
        const targetTitle = value.trim();
        if (type === 'session') onRenameSession(id, targetTitle);
        else onRenameGroup(id, targetTitle);
        setEditingId(prev => (prev === `${type}-${id}` ? null : prev));
    };

    const handleKeyDown = (e, type, id) => {
        if (e.key === 'Enter') {
            handleRenameSubmit(type, id, e.currentTarget.value);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    const onDragStart = (e, session) => {
        e.dataTransfer.setData('sessionId', session.id);
    };

    const onDragOver = (e, targetId) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const md = rect.top + rect.height / 2;
        const position = e.clientY < md ? 'top' : 'bottom';
        setDragOverInfo({ id: targetId, position });
    };

    const onDrop = (e, targetGroupId, targetSessionId = null) => {
        e.preventDefault();
        const draggedSessionId = parseInt(e.dataTransfer.getData('sessionId'));
        setDragOverInfo(null);
        onMoveSession(draggedSessionId, targetGroupId, targetSessionId, dragOverInfo?.position);
    };

    const renderSessionItem = (s) => (
        <div
            key={s.id}
            draggable
            onDragStart={(e) => onDragStart(e, s)}
            onDragOver={(e) => onDragOver(e, `session-${s.id}`)}
            onDrop={(e) => onDrop(e, s.group_id, s.id)}
            className={`history-item ${sessionId === s.id ? 'active' : ''} ${editingId === `session-${s.id}` ? 'editing' : ''} 
                 ${dragOverInfo?.id === `session-${s.id}` ? `drag-${dragOverInfo.position}` : ''}`}
            onClick={() => editingId !== `session-${s.id}` && onLoadSession(s.id)}
        >
            {editingId === `session-${s.id}` ? (
                <input
                    autoFocus
                    className="rename-input"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={(e) => handleRenameSubmit('session', s.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'session', s.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <>
                    <span className="history-title">{s.title}</span>
                    <div className="history-actions">
                        <button title={t.rename} onClick={(e) => { onPlayClick(); handleStartRename(e, `session-${s.id}`, s.title); }}>
                            <img src={ICONS.rename} alt="" />
                        </button>
                        <button title={t.delete} onClick={(e) => { e.stopPropagation(); onPlayClick(); onDeleteSession(s.id); }}>
                            <img src={ICONS.delete} alt="" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div
            className={`navbar-container ${isResizing ? 'resizing' : ''}`}
            style={{ width: sidebarOpen && activeView === 'chat' ? `${sidebarWidth}px` : '68px' }}
        >
            <div className="global-nav">
                <div className="nav-top-actions">
                    <button className={`nav-btn ${activeView === 'home' ? 'active' : ''}`} onClick={onGoHome} title={t.goHome}>
                        <img src={ICONS.home} alt="Home" className="nav-icon" />
                    </button>
                    <button
                        className={`nav-btn ${activeView === 'chat' ? 'active' : ''}`}
                        onClick={() => {
                            if (activeView === 'chat') onToggleSidebar();
                            else {
                                handleNavigate('chat');
                                if (!sidebarOpen) onToggleSidebar();
                                if (sessionId) onLoadSession(sessionId);
                            }
                        }}
                        title={t.chat}
                    >
                        <img src={ICONS.account} alt="Chat" className="nav-icon" />
                    </button>
                    <button className={`nav-btn ${activeView === 'investment' ? 'active' : ''}`} onClick={onOpenInvestment} title={t.investment}>
                        <img src={ICONS.invest} alt="Investment" className="nav-icon" />
                    </button>
                    <button className={`nav-btn ${activeView === 'newsmap' ? 'active' : ''}`} onClick={onOpenNewsMap} title={t.news}>
                        <img src={ICONS.global} alt="News Map" className="nav-icon" />
                    </button>
                    <button className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`} onClick={onOpenSettings} title={t.settings}>
                        <img src={ICONS.settings} alt="Settings" className="nav-icon" />
                    </button>
                </div>
                <div className="nav-footer">
                    <button className={`nav-btn`} style={{ marginBottom: '1rem' }} onClick={() => { onPlayClick(); onToggleOmni(); }} title={t.Visualizer}>
                        <span><img src={ICONS.omniSys} alt="Omni System" className="nav-icon" /></span>
                    </button>
                    <div className="account-trigger" title={t.account}>
                        <img src={ICONS.account} alt={t.account} className="avatar-img" />
                    </div>
                </div>
            </div>

            {sidebarOpen && activeView === 'chat' && (
                <div className="sidebar-content">
                    <div className="sidebar-header">
                        <button className="new-chat-btn" onClick={() => { onPlayClick(); onNewChat(); }}>
                            <span>+</span> {t.newChat}
                        </button>
                        <button className="new-group-btn" onClick={() => { onPlayClick(); onNewGroup(); }} title={t.newGroup}>
                            <img src={ICONS.createFolder} alt="New Group" />
                        </button>
                    </div>

                    <div className="history-list">
                        {groups.map(g => (
                            <div key={g.id} className="group-container">
                                <div className="group-header" onClick={() => toggleGroup(g.id)} onDragOver={(e) => onDragOver(e, `group-${g.id}`)} onDrop={(e) => onDrop(e, g.id)}>
                                    <span className={`arrow ${collapsedGroups[g.id] ? '' : 'down'}`}>▶</span>
                                    {editingId === `group-${g.id}` ? (
                                        <input
                                            autoFocus
                                            className="rename-input group-rename"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onBlur={(e) => handleRenameSubmit('group', g.id, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, 'group', g.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="group-name">{g.name}</span>
                                    )}
                                    <div className="group-actions">
                                        <button title={t.rename} onClick={(e) => { onPlayClick(); handleStartRename(e, `group-${g.id}`, g.name); }}>
                                            <img src={ICONS.rename} alt="" />
                                        </button>
                                        <button title={t.delete} onClick={(e) => { e.stopPropagation(); onPlayClick(); onDeleteGroup(g.id); }}>
                                            <img src={ICONS.delete} alt="" />
                                        </button>
                                    </div>
                                </div>
                                {!collapsedGroups[g.id] && (
                                    <div className="group-content">
                                        {sessions.filter(s => s.group_id === g.id).map(renderSessionItem)}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="group-container">
                            <div className="group-header" onDragOver={(e) => onDragOver(e, 'group-uncategorized')} onDrop={(e) => onDrop(e, null)}>
                                <span className="group-name">{t.uncategorized}</span>
                            </div>
                            <div className="group-content">
                                {sessions.filter(s => s.group_id === null).map(renderSessionItem)}
                            </div>
                        </div>
                    </div>
                    <div className={`resize-handle ${isResizing ? 'active' : ''}`} onMouseDown={startResizing} />
                </div>
            )}
        </div>
    );
}

export default memo(NavBar);
