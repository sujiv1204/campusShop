import React, { useState, useEffect } from "react";
import { preferencesAPI } from "../../services/api";
import "./EmailPreferences.css";

const EmailPreferences = () => {
    const [preferences, setPreferences] = useState({
        bidReceived: true,
        itemSold: true,
        bidWon: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const { data } = await preferencesAPI.get();
            setPreferences(data);
        } catch (error) {
            console.error("Error fetching preferences:", error);
            setMessage("Failed to load preferences");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key) => {
        const newPreferences = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPreferences);
        setSaving(true);
        setMessage("");

        try {
            await preferencesAPI.update(newPreferences);
            setMessage("Preferences saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error saving preferences:", error);
            setMessage("Failed to save preferences");
            setPreferences(preferences); // Revert on error
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="email-prefs-loading">Loading preferences...</div>
        );
    }

    return (
        <div className="email-preferences">
            <h3>Email Notifications</h3>
            <p className="email-prefs-desc">
                Choose which notifications you'd like to receive via email
            </p>

            {message && (
                <div
                    className={`email-prefs-message ${
                        message.includes("Failed") ? "error" : "success"
                    }`}
                >
                    {message}
                </div>
            )}

            <div className="preferences-list">
                <div className="preference-item">
                    <div className="preference-info">
                        <h4>New Bid on Your Item</h4>
                        <p>
                            Get notified when someone places a bid on your
                            listed item
                        </p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={preferences.bidReceived}
                            onChange={() => handleToggle("bidReceived")}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="preference-item">
                    <div className="preference-info">
                        <h4>Item Sold</h4>
                        <p>Get notified when your item is successfully sold</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={preferences.itemSold}
                            onChange={() => handleToggle("itemSold")}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="preference-item">
                    <div className="preference-info">
                        <h4>Bid Won</h4>
                        <p>Receive notification when you win a bid</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={preferences.bidWon}
                            onChange={() => handleToggle("bidWon")}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            {saving && <div className="saving-indicator">Saving...</div>}
        </div>
    );
};

export default EmailPreferences;
