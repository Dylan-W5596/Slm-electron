import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import '../styles/Notification.css';

const Notification = ({ id, message, type, duration, removeNotification }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsExiting(true);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
    };

    const handleAnimationEnd = (e) => {
        // 只有在退出動畫結束時才移除
        if (e.animationName === 'notification-slide-out') {
            removeNotification(id);
        }
    };

    return (
        <div
            className={`notification-item ${type} ${isExiting ? 'exit' : ''}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className="notification-content">{message}</div>
            <button className="notification-close" onClick={handleClose}>
                ×
            </button>
        </div>
    );
};

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="notification-container">
            {notifications.map((n) => (
                <Notification
                    key={n.id}
                    {...n}
                    removeNotification={removeNotification}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
