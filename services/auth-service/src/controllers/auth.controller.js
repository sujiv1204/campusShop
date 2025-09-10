const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = db.User;
const COLLEGE_DOMAIN = "iitj.ac.in";

// Helper for sending email
async function sendVerificationEmail(userEmail, token) {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const verificationLink = `${process.env.CLIENT_URL}/api/auth/verify-email?token=${token}`;
    const info = await transporter.sendMail({
        from: '"Campus Marketplace" <noreply@campus-marketplace.com>',
        to: userEmail,
        subject: "Verify Your Email Address",
        html: `<b>Please click the link to verify:</b><br/><a href="${verificationLink}">${verificationLink}</a>`,
    });
    console.log(
        "Verification email sent. Preview URL: %s",
        nodemailer.getTestMessageUrl(info)
    );
}

// Controller Methods
exports.register = async (req, res) => {
    const { email, password
        // , role 
        
    } = req.body;
    if (!email.endsWith(`@${COLLEGE_DOMAIN}`)) {
        return res
            .status(400)
            .json({
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
            return res
                .status(403)
                .json({
                    message: "Please verify your email before logging in.",
                });
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials." });
        const payload = { userId: user.id, email: user.email, 
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
