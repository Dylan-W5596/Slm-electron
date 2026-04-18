import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ICONS } from '../assets/assets'

function ChatMessage({ msg, onCopy, onReply, onChart, t }) {
    return (
        <div className={`message ${msg.role}`}>
            <div className="avatar">
                {msg.role === 'assistant' ? (
                    <img src={ICONS.agent} alt="AI" className="avatar-img" />
                ) : '👤'}
            </div>
            <div className="message-body">
                <div className="message-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                </div>
                {msg.role === 'assistant' && (
                    <div className="message-actions">
                        <button className="action-btn" onClick={() => onReply(msg.content)} title={t.reply}>
                            <img src={ICONS.reply} alt={t.reply} />
                        </button>
                        <button className="action-btn" onClick={() => onCopy(msg.content)} title={t.copy}>
                            <img src={ICONS.copyAll} alt={t.copy} />
                        </button>
                        <button className="action-btn" onClick={() => onChart(msg.content)} title={t.chartOutput}>
                            <img src={ICONS.chartPie} alt={t.chartOutput} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(ChatMessage);
