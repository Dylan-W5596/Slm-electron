import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ICONS } from '../assets/assets'

function ChatMessage({ msg, onCopy, onReply, t }) {
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
                        <button className="action-btn" onClick={() => onReply(msg.content)} title="回覆">
                            <img src={ICONS.reply} alt="Reply" />
                        </button>
                        <button className="action-btn" onClick={() => onCopy(msg.content)} title="複製">
                            <img src={ICONS.copyAll} alt="Copy" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatMessage;
