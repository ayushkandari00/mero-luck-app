"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Get Current User Info, Profile, Address
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                address: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error retrieving profile', error: error.message });
    }
});
// Update Profile & Address Info
router.post('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { firstName, lastName, phoneNumber, street, city, state, postalCode, country } = req.body;
        await db_1.default.$transaction(async (tx) => {
            // Update profile
            await tx.profile.update({
                where: { userId },
                data: {
                    firstName,
                    lastName,
                },
            });
            // Update phone if provided
            if (phoneNumber) {
                await tx.user.update({
                    where: { id: userId },
                    data: { phoneNumber },
                });
            }
            // Upsert address
            if (street || city || state || postalCode || country) {
                const existingAddress = await tx.address.findUnique({ where: { userId } });
                if (existingAddress) {
                    await tx.address.update({
                        where: { userId },
                        data: { street, city, state, postalCode, country },
                    });
                }
                else {
                    await tx.address.create({
                        data: {
                            userId: userId,
                            street: street || '',
                            city: city || '',
                            state: state || '',
                            postalCode: postalCode || '',
                            country: country || '',
                        },
                    });
                }
            }
        });
        const updatedUser = await db_1.default.user.findUnique({
            where: { id: userId },
            include: { profile: true, address: true },
        });
        return res.json({ message: 'Profile updated successfully', user: updatedUser });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
});
// Get User Coins
router.get('/coins', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const coins = await db_1.default.physicalCoin.findMany({
            where: { userId },
            include: { luckyNumber: true },
        });
        return res.json(coins);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to get coins', error: error.message });
    }
});
// Get User Tokens
router.get('/tokens', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const tokens = await db_1.default.digitalToken.findMany({
            where: { userId },
            include: { luckyNumber: true },
        });
        return res.json(tokens);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to get tokens', error: error.message });
    }
});
// Get Notifications
router.get('/notifications', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const notifications = await db_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(notifications);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to get notifications', error: error.message });
    }
});
// Mark notifications read
router.post('/notifications/read', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        await db_1.default.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        return res.json({ message: 'Notifications marked as read' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to update notifications', error: error.message });
    }
});
// Get User Dashboard Overview statistics
router.get('/dashboard-stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const coinsCount = await db_1.default.physicalCoin.count({ where: { userId } });
        const tokensCount = await db_1.default.digitalToken.count({ where: { userId } });
        const entriesCount = await db_1.default.entry.count({ where: { userId } });
        // Sum wins
        const wins = await db_1.default.winner.findMany({ where: { userId } });
        const totalWinsAmount = wins.reduce((acc, w) => acc + w.prizeAmount, 0);
        const profile = await db_1.default.profile.findUnique({ where: { userId } });
        const referralBonus = await db_1.default.referral.count({ where: { referrerId: userId, bonusStatus: 'GRANTED' } }) * 200; // e.g. ₹200 per referral
        return res.json({
            ownedCoins: coinsCount,
            ownedTokens: tokensCount,
            activeEntries: entriesCount,
            totalWins: wins.length,
            rewardsEarned: totalWinsAmount + (profile?.welcomeBonusClaimed ? 100 : 0) + referralBonus,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to load stats', error: error.message });
    }
});
exports.default = router;
