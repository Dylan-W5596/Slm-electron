import { ICONS } from '../assets/assets';
import '../styles/ChatInput.css';

function ChatInput({ input, setInput, replyingTo, onCancelReply, onSendMessage, onStopGeneration, isLoading, t }) {

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 自動調整高度
    const textareaRef = (el) => {
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    };

    return (
        <div className="input-area">
            <div className="input-container">
                {replyingTo && (
                    <div className="reply-preview">
                        <div className="reply-content">
                            回覆: {replyingTo}
                        </div>
                        <button className="cancel-reply-btn" onClick={onCancelReply}>
                            ×
                        </button>
                    </div>
                )}
                <div className="input-main">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t ? t.inputPlaceholder : "輸入訊息..."}
                        rows={1}
                    />
                    <div className="input-actions">
                        {isLoading ? (
                            <button className="stop-btn" onClick={onStopGeneration} title="停止生成">
                                <img src={ICONS.stop} alt="Stop" className="white-icon" />
                            </button>
                        ) : (
                            <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
                                <img src={ICONS.send} alt="Send" className="white-icon" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatInput;
