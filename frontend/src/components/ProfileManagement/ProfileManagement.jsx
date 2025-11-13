import React, { useState, useEffect } from "react";
import { profileAPI } from "../../services/api";
import "./ProfileManagement.css";

const ProfileManagement = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        displayName: "",
        phoneNumber: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await profileAPI.getProfile();
            const profileData = response.data;

            setProfile(profileData);
            setFormData({
                displayName: profileData.displayName || "",
                phoneNumber: profileData.phoneNumber || "",
            });

            // If no profile exists yet, start in edit mode
            if (!profileData.profileExists) {
                setIsEditing(true);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Failed to load profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.displayName.trim()) {
            setError("Display name is required");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await profileAPI.updateProfile(formData);

            setProfile(response.data);
            setSuccess("Profile updated successfully!");
            setIsEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(
                err.response?.data?.message ||
                    "Failed to update profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form to current profile data
        setFormData({
            displayName: profile?.displayName || "",
            phoneNumber: profile?.phoneNumber || "",
        });
        setIsEditing(false);
        setError("");
    };

    if (loading) {
        return (
            <div className="profile-management-loading">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-management">
            <div className="profile-management-header">
                <h2>Profile Information</h2>
                {!isEditing && profile?.profileExists && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="edit-profile-btn"
                    >
                        ✏️ Edit Profile
                    </button>
                )}
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <span className="alert-icon">✅</span>
                    <span>{success}</span>
                </div>
            )}

            {!isEditing ? (
                // View Mode
                <div className="profile-view">
                    <div className="profile-field">
                        <label>Email</label>
                        <div className="profile-value">
                            {profile?.email || "N/A"}
                            <span className="readonly-badge">Read-only</span>
                        </div>
                        <small className="field-help">
                            Email cannot be changed
                        </small>
                    </div>

                    <div className="profile-field">
                        <label>Display Name</label>
                        <div className="profile-value">
                            {profile?.displayName || (
                                <span className="not-set">Not set</span>
                            )}
                        </div>
                    </div>

                    <div className="profile-field">
                        <label>Phone Number</label>
                        <div className="profile-value">
                            {profile?.phoneNumber || (
                                <span className="not-set">Not set</span>
                            )}
                        </div>
                    </div>

                    {!profile?.profileExists && (
                        <div className="info-message">
                            <p>
                                📝 Complete your profile to help other users
                                identify you!
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                // Edit Mode
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                            <span className="readonly-badge">Read-only</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={profile?.email || ""}
                            disabled
                            className="form-input readonly"
                        />
                        <small className="field-help">
                            Your email address cannot be changed
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="displayName">
                            Display Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            placeholder="Enter your name"
                            required
                            maxLength={100}
                            className="form-input"
                        />
                        <small className="field-help">
                            This name will be visible to other users
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                            maxLength={15}
                            className="form-input"
                        />
                        <small className="field-help">
                            Optional - for buyers/sellers to contact you
                        </small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Saving...
                                </>
                            ) : (
                                "💾 Save Changes"
                            )}
                        </button>

                        {profile?.profileExists && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={saving}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProfileManagement;
