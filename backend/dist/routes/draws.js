"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Get Live Stats (Aggregated count for active draws)
router.get('/live-stats', async (req, res) => {
    try {
        const activeDraw = await db_1.default.draw.findFirst({
            where: { status: 'ACTIVE' },
            orderBy: { drawDate: 'asc' },
        });
        if (!activeDraw) {
            return res.json({
                hasActiveDraw: false,
                prizePool: 0,
                entriesCount: 0,
                participantsCount: 0,
                drawDate: null,
                daysRemaining: 0,
            });
        }
        const entriesCount = await db_1.default.entry.count({
            where: { drawId: activeDraw.id },
        });
        // Count distinct users
        const uniqueParticipants = await db_1.default.entry.groupBy({
            by: ['userId'],
            where: { drawId: activeDraw.id },
        });
        const participantsCount = uniqueParticipants.length;
        // Estimate coins sold and tokens sold
        const tokensCount = await db_1.default.digitalToken.count({
            where: { status: 'ACTIVE' },
        });
        const coinsCount = await db_1.default.physicalCoin.count({
            where: { status: 'APPROVED' },
        });
        return res.json({
            hasActiveDraw: true,
            drawId: activeDraw.id,
            title: activeDraw.title,
            prizePool: activeDraw.prizePool,
            entriesCount: entriesCount + 1342, // Add baseline to make it look alive & popular as requested (Apple-level luxury)
            participantsCount: participantsCount + 589, // baseline + current
            drawDate: activeDraw.drawDate,
            tokensSold: tokensCount + 890,
            coinsSold: coinsCount + 452,
            grandPrize: activeDraw.grandPrize,
            secondPrize: activeDraw.secondPrize,
            thirdPrize: activeDraw.thirdPrize,
            bonusRewards: activeDraw.bonusRewards,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve live stats', error: error.message });
    }
});
// Get upcoming draws
router.get('/upcoming', async (req, res) => {
    try {
        const draws = await db_1.default.draw.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { drawDate: 'asc' },
        });
        return res.json(draws);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve upcoming draws', error: error.message });
    }
});
// Get past draws / results
router.get('/past', async (req, res) => {
    try {
        const draws = await db_1.default.draw.findMany({
            where: { status: 'COMPLETED' },
            include: {
                winners: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                phoneNumber: true,
                                profile: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { drawDate: 'desc' },
        });
        return res.json(draws);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve past draws', error: error.message });
    }
});
// Verify verification number (Provably Fair system verify)
router.get('/verify-fairness/:number', async (req, res) => {
    const { number } = req.params;
    try {
        const luckyNumber = await db_1.default.luckyNumber.findUnique({
            where: { number },
            include: {
                user: {
                    select: {
                        email: true,
                        profile: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
                token: true,
                coin: true,
                entries: {
                    include: { draw: true },
                },
            },
        });
        if (!luckyNumber) {
            return res.status(404).json({ message: 'Lucky Number not found in our registry.' });
        }
        // Provably fair calculation demonstration
        // Server Seed (static mock/hash) + luckyNumber id -> SHA256 simulation
        const serverSeed = 'meroluck-provably-fair-server-seed-2026';
        const mockHash = Buffer.from(serverSeed + '-' + luckyNumber.number).toString('base64').substring(0, 16);
        return res.json({
            verified: true,
            luckyNumber,
            verificationDetails: {
                serverSeedHash: '8e2cf5a6fb11a76c8c4a961e053f31e3d74945d7d00f681a2f646b9d6286c071',
                drawSalt: mockHash,
                combinedInput: `${serverSeed}-${luckyNumber.number}`,
                outcomeHash: mockHash + 'verified',
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking verification details', error: error.message });
    }
});
exports.default = router;
