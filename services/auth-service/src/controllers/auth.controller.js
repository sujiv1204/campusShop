const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
// const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const User = db.User;
const COLLEGE_DOMAIN = "iitj.ac.in";

// Helper for sending email
async function sendVerificationEmail(userEmail, token) {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    const verificationLink = `${process.env.CLIENT_URL}/api/auth/verify-email?token=${token}`;
    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: "Verify Your Email Address",
        html: `<b>Please click the link to verify:</b><br/><a href="${verificationLink}">${verificationLink}</a>`,
    });
    console.log(
        "Verification email sent successfully. Message ID: %s",
        info.messageId
    );
}

// Controller Methods
exports.register = async (req, res) => {
    const {
        email,
        password,
        // , role
    } = req.body;
    if (!email.endsWith(`@${COLLEGE_DOMAIN}`)) {
        return res.status(400).json({
            message: `Registration is for @${COLLEGE_DOMAIN} emails only.`,
        });
    }
    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser)
            return res.status(409).json({ message: "User already exists." });
        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const newUser = await User.create({
            email,
            passwordHash,
            // role,
            verificationToken,
        });
        await sendVerificationEmail(email, verificationToken);
        res.status(201).json({
            message: "Registration successful! Check your email to verify.",
            userId: newUser.id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during registration." });
    }
};

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({
            where: { verificationToken: token },
        });
        if (!user)
            return res
                .status(400)
                .send("Invalid or expired verification token.");
        user.isVerified = true;
        user.verificationToken = null;
        await user.save();
        res.status(200).send(
            "<h1>Email successfully verified!</h1><p>You can now close this tab and log in.</p>"
        );
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error during email verification.");
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials." });
        if (!user.isVerified)
            return res.status(403).json({
                message: "Please verify your email before logging in.",
            });
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials." });
        const payload = {
            userId: user.id,
            email: user.email,
            // role: user.role
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login." });
    }
};

exports.logout = (req, res) => {
    res.status(200).json({
        message: "Logout successful. Please delete your token.",
    });
};

exports.getUserById = async (req, res) => {
    try {
        // This endpoint is for internal service-to-service communication,
        // so we don't need heavy validation.
        const user = await User.findByPk(req.params.id, {
            attributes: ["id", "email"], // Only return non-sensitive info
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// This function is INSECURE and not recommended for production.
// It allows anyone to change any user's password if they know their email.
exports.resetPasswordWithoutEmail = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({
            message: "Email, new password, and confirmation password are all required.",
        });
    }

    // 1. Check if the new password and confirmation match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    try {
        // 2. Find the user by their email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // If no user is found, we send a 404.
            return res.status(404).json({ message: "User not found." });
        }

        // 3. Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // 4. Save the new password to the database
        user.passwordHash = passwordHash;
        await user.save();

        res.status(200).json({ message: "Password has been reset successfully." });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during password reset." });
    }
};

// NEW helper function for sending a JWT reset link
async function sendPasswordResetEmail(userEmail, token) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // This link should point to your FRONTEND page that will handle the reset
    // Your frontend will get the token from the URL and send it to the API
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: "Password Reset Request",
        html: `
            <b>You requested a password reset.</b><br/>
            <p>If you did not request this, please ignore this email.</p>
            <p>Click the link below to set a new password (link expires in 15 minutes):</p>
            <a href="${resetLink}">${resetLink}</a>
        `,
    });

    console.log(
        "Password reset email sent successfully. Message ID: %s",
        info.messageId
    );
}

/**
 * STEP 1: Request a password reset.
 * Creates a short-lived JWT and emails it to the user.
 */
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        const user = await User.findOne({ where: { email } });

        // Always send a generic success message to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                message:
                    "If your email is registered, you will receive a password reset link.",
            });
        }

        // 1. Create a payload containing only the user's ID
        const payload = {
            userId: user.id,
        };

        // 2. Sign a short-lived token (e.g., 15 minutes)
        //    Use the DEDICATED reset secret!
        const resetToken = jwt.sign(payload, process.env.JWT_RESET_SECRET, {
            expiresIn: "15m", // 15 minutes
        });

        // 3. Email this token to the user
        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({
            message:
                "If your email is registered, you will receive a password reset link.",
        });

    } catch (error) {
        console.error(error);
        res.status(200).json({
            message:
                "If your email is registered, you will receive a password reset link.",
        });
    }
};

/**
 * STEP 2: Reset the password using the JWT.
 * Verifies the token and updates the password.
 */
exports.resetPassword = async (req, res) => {
    // The token can come from the URL (req.query) or the body (req.body)
    const { token, newPassword, confirmPassword } = req.body;

    // 1. Validate input
    if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    try {
        // 2. Verify the token using the DEDICATED reset secret
        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
        
        // 3. If token is valid, 'decoded' will contain our payload: { userId: ... }
        //    Find the user from the ID in the token
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // 4. Hash the new password and save it
        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = passwordHash;
        await user.save();

        res.status(200).json({ message: "Password has been reset successfully." });

    } catch (error) {
        // 5. If jwt.verify fails, it will throw an error (e.g., "invalid signature", "jwt expired")
        console.error(error);
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
             return res.status(400).json({ message: "Password reset token is invalid or has expired." });
        }
        res.status(500).json({ message: "Server error during password reset." });
    }
};

// NEW helper function for sending an OTP
// async function sendPasswordResetOtpEmail(userEmail, otp) {
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         secure: false, // true for 465, false for other ports
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS,
//         },
//     });

//     const info = await transporter.sendMail({
//         from: process.env.EMAIL_FROM,
//         to: userEmail,
//         subject: "Your Password Reset OTP",
//         html: `
//             <b>You requested a password reset.</b><br/>
//             <p>Your One-Time Password (OTP) is:</p>
//             <h1 style="color: #333;">${otp}</h1>
//             <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
//         `,
//     });

//     console.log(
//         "Password reset OTP email sent successfully. Message ID: %s",
//         info.messageId
//     );
// }

// /**
//  * STEP 1: Request a password reset OTP.
//  * Generates an OTP, saves it to the DB, and emails it to the user.
//  */
// exports.forgotPassword = async (req, res) => {
//     const { email } = req.body;
//     if (!email) {
//         return res.status(400).json({ message: "Email is required." });
//     }

//     try {
//         const user = await User.findOne({ where: { email } });

//         // Always send a generic success message to prevent email enumeration
//         if (!user) {
//             return res.status(200).json({
//                 message:
//                     "If your email is registered, you will receive a password reset OTP.",
//             });
//         }

//         // 1. Generate a 6-digit numeric OTP
//         const otp = crypto.randomInt(100000, 999999).toString();
        
//         // 2. Set an expiry for 10 minutes from now
//         const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

//         // 3. Save the hashed OTP and expiry to the user record
//         //    (Hashing the OTP is best practice, but for simplicity we'll store it plain for now)
//         user.otp = otp; 
//         user.otpExpires = otpExpires;
//         await user.save();

//         // 4. Send the email with the plain-text OTP
//         await sendPasswordResetOtpEmail(user.email, otp);

//         res.status(200).json({
//             message:
//                 "If your email is registered, you will receive a password reset OTP.",
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(200).json({
//             message:
//                 "If your email is registered, you will receive a password reset OTP.",
//         });
//     }
// };

// /**
//  * STEP 2: Reset the password using the OTP.
//  * Verifies the OTP and updates the password.
//  */
// exports.resetPassword = async (req, res) => {
//     const { email, otp, newPassword, confirmPassword } = req.body;

//     // 1. Validate input
//     if (!email || !otp || !newPassword || !confirmPassword) {
//         return res.status(400).json({ message: "All fields are required (email, otp, newPassword, confirmPassword)." });
//     }

//     if (newPassword !== confirmPassword) {
//         return res.status(400).json({ message: "Passwords do not match." });
//     }

//     try {
//         // 2. Find user AND validate OTP in one query
//         //    We check the email, the OTP, and that the OTP is not expired.
//         const user = await User.findOne({
//             where: {
//                 email: email,
//                 otp: otp,
//                 otpExpires: { [Op.gt]: Date.now() }, // Op.gt means "greater than"
//             },
//         });

//         // 3. If no user, the OTP is invalid or expired
//         if (!user) {
//             return res
//                 .status(400)
//                 .json({ message: "Invalid or expired OTP." });
//         }

//         // 4. Hash the new password
//         const passwordHash = await bcrypt.hash(newPassword, 10);

//         // 5. Update password and, crucially, clear the OTP fields
//         user.passwordHash = passwordHash;
//         user.otp = null;
//         user.otpExpires = null;
//         await user.save();

//         res.status(200).json({ message: "Password has been reset successfully." });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error during password reset." });
//     }
// };