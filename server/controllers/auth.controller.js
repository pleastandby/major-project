const User = require('../models/User');
const Profile = require('../models/Profile');
const RefreshSession = require('../models/RefreshSession');
const AuthLog = require('../models/AuthLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate Access Token (Short-lived)
const generateAccessToken = (id, roles) => {
    return jwt.sign({ id, roles }, process.env.JWT_SECRET, {
        expiresIn: '15m', // Short lived as per design
    });
};

const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

const logAuthEvent = async (userId, event, req, meta = {}) => {
    try {
        await AuthLog.create({
            userId: userId || null,
            event,
            email: req.body.email, // Capture email attempt
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            meta
        });
    } catch (err) {
        console.error('Failed to log auth event', err);
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { email, password, role, name, profileData } = req.body;

        if (!email || !password || !role || !name) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            await logAuthEvent(null, 'register', req, { status: 'failed', reason: 'User exists' });
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            email,
            passwordHash,
            name, // Save nameCache
            roles: [role],
        });

        const profile = await Profile.create({
            userId: user._id,
            name,
            type: role,
            data: profileData || {}, // e.g. department, registrationNo
        });

        await logAuthEvent(user._id, 'register', req, { status: 'success' });

        // Generate tokens
        const accessToken = generateAccessToken(user._id, user.roles);
        const refreshToken = generateRefreshToken();

        // Create session
        await RefreshSession.create({
            userId: user._id,
            refreshToken,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        res.status(201).json({
            _id: user._id,
            email: user.email,
            name: profile.name,
            roles: user.roles,
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(error);
        await logAuthEvent(null, 'register', req, { status: 'error', error: error.message });
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const profile = await Profile.findOne({ userId: user._id });

            // Log success
            await logAuthEvent(user._id, 'login_success', req);

            const accessToken = generateAccessToken(user._id, user.roles);
            const refreshToken = generateRefreshToken();

            // Create Refresh Session
            await RefreshSession.create({
                userId: user._id,
                refreshToken,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            res.json({
                _id: user._id,
                email: user.email,
                name: profile ? profile.name : 'User',
                roles: user.roles,
                accessToken,
                refreshToken
            });
        } else {
            await logAuthEvent(user ? user._id : null, 'login_failed', req, { reason: 'Invalid credentials' });
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        await logAuthEvent(null, 'login_failed', req, { status: 'error', error: error.message });
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh Token required' });
    }

    try {
        const session = await RefreshSession.findOne({ refreshToken });

        if (!session) {
            return res.status(403).json({ message: 'Invalid Refresh Token' });
        }

        if (session.expiresAt < new Date()) {
            await RefreshSession.deleteOne({ _id: session._id }); // Cleanup
            return res.status(403).json({ message: 'Refresh Token expired' });
        }

        const user = await User.findById(session.userId);
        if (!user) {
            return res.status(403).json({ message: 'User not found' });
        }

        // Rotate Refresh Token
        const newRefreshToken = generateRefreshToken();

        // Update session
        session.refreshToken = newRefreshToken;
        session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Extend
        await session.save();

        await logAuthEvent(user._id, 'token_refresh', req);

        const accessToken = generateAccessToken(user._id, user.roles);

        res.json({
            accessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public (Requires Refresh Token to identify session)
const logout = async (req, res) => {
    const { refreshToken } = req.body;

    // Even if no token provided, we just send 200 to clear client state
    if (refreshToken) {
        try {
            const session = await RefreshSession.findOneAndDelete({ refreshToken });
            if (session) {
                await logAuthEvent(session.userId, 'logout', req);
            }
        } catch (error) {
            console.error('Logout error', error);
        }
    }

    res.json({ message: 'Logged out successfully' });
};

/*
    FORGOT PASSWORD & OTP FLOW
*/

// @desc    Request Password Reset (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Security: Don't reveal if user exists
            // But for detailed debug log:
            console.log(`Forgot password requested for non-existent email: ${email}`);
            return res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

        // Save to ActionToken
        // First, clear any existing tokens for this user and type
        const ActionToken = require('../models/ActionToken');
        await ActionToken.deleteMany({ userId: user._id, type: 'reset_password' });

        await ActionToken.create({
            userId: user._id,
            token: otp,
            type: 'reset_password',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // Send Email
        const { sendOTP } = require('../services/email.service');
        await sendOTP(email, otp);

        await logAuthEvent(user._id, 'forgot_password_request', req);

        res.json({ message: 'If an account exists with this email, an OTP has been sent.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Server error processing request' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        const ActionToken = require('../models/ActionToken');
        const tokenDoc = await ActionToken.findOne({
            userId: user._id,
            token: otp,
            type: 'reset_password',
            used: false
        });

        if (!tokenDoc) {
            await logAuthEvent(user._id, 'otp_verify_failed', req, { reason: 'Invalid OTP' });
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (tokenDoc.expiresAt < new Date()) {
            await logAuthEvent(user._id, 'otp_verify_failed', req, { reason: 'Expired OTP' });
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Valid OTP
        // We don't mark it used yet, or maybe we do? 
        // Best practice: Return a temporary secret or just allow client to proceed to resetPassword 
        // where we verify OTP again or verify a temporary token.
        // For simplicity: We will mark it used ONLY when password is strictly reset.
        // But to prevent replay, maybe we mark it used here and issue a short-lived "reset-token"?

        // Simpler approach for this stack: 
        // Client sends OTP + Email again to reset-password endpoint.
        // So this verify endpoint is just for UI feedback "step 2 -> step 3".

        res.json({ message: 'OTP verified', valid: true });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        const ActionToken = require('../models/ActionToken');
        const tokenDoc = await ActionToken.findOne({
            userId: user._id,
            token: otp,
            type: 'reset_password',
            used: false
        });

        if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Reset Password
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Mark token used
        tokenDoc.used = true;
        await tokenDoc.save();

        // Expire all sessions? Optional but good security practice
        await RefreshSession.deleteMany({ userId: user._id });

        await logAuthEvent(user._id, 'password_reset_success', req);

        res.json({ message: 'Password reset successful. Please login with your new password.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    verifyOTP,
    resetPassword
};
