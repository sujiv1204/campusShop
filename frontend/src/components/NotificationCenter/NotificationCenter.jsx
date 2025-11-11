import React, { useState, useEffect, useRef } from "react";
import { notificationsAPI } from "../../services/api";
import "./NotificationCenter.css";

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await notificationsAPI.getAll();
            setNotifications(data.notifications || []);
            setUnreadCount(
                data.notifications?.filter((n) => !n.isRead).length || 0
            );
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(
                notifications.map((n) =>
                    n._id === id ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await notificationsAPI.delete(id);
            const deleted = notifications.find((n) => n._id === id);
            setNotifications(notifications.filter((n) => n._id !== id));
            if (!deleted.isRead)
                setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(
                notifications.map((n) => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "bid_placed":
                return "💰";
            case "bid_accepted":
                return "✅";
            case "bid_rejected":
                return "❌";
            case "outbid":
                return "⚠️";
            case "item_sold":
                return "🎉";
            case "new_item":
                return "🆕";
            default:
                return "🔔";
        }
    };

    const getTimeAgo = (timestamp) => {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="notification-center" ref={dropdownRef}>
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="mark-all-read"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${
                                        !notification.read ? "unread" : ""
                                    }`}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-message">
                                            {notification.message}
                                        </p>
                                        <span className="notification-time">
                                            {getTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                    <div className="notification-actions">
                                        {!notification.isRead ? (
                                            <button
                                                onClick={() =>
                                                    markAsRead(notification._id)
                                                }
                                                title="Mark as read"
                                                className="action-btn"
                                            >
                                                ✓
                                            </button>
                                        ) : null}
                                        <button
                                            onClick={() =>
                                                deleteNotification(
                                                    notification._id
                                                )
                                            }
                                            title="Delete"
                                            className="action-btn delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
