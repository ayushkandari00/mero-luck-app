"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Create uploads directory if not exists
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Multer Storage Setup
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
// Create Digital Token Purchase Order
router.post('/buy-token', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        // Standard cost: Digital token = ₹250
        const price = 250;
        const orderId = 'ORD-TKN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const transaction = await db_1.default.transaction.create({
            data: {
                userId,
                type: 'TOKEN_PURCHASE',
                amount: price,
                status: 'PENDING',
                orderId,
            },
        });
        return res.json({
            message: 'Order created. Please make payment and upload receipt.',
            transaction,
            paymentDetails: {
                upiId: 'meroluck@bank',
                accountHolder: 'Mero Luck Collectibles Pvt Ltd',
                bankName: 'Nepal Investment Mega Bank',
                accountNumber: '00100200300405',
                ifsc: 'NIMB0000001',
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to create token order', error: error.message });
    }
});
// Create Physical Coin Purchase Order
router.post('/buy-coin', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { quantity } = req.body;
        const qty = Number(quantity) || 1;
        // Standard cost: Physical coin = ₹2500 each
        const price = 2500 * qty;
        const orderId = 'ORD-COIN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        // Verify address is set up
        const address = await db_1.default.address.findUnique({ where: { userId } });
        if (!address) {
            return res.status(400).json({
                message: 'Shipping address required before buying physical coins. Please update your profile shipping address.',
                noAddress: true
            });
        }
        const transaction = await db_1.default.transaction.create({
            data: {
                userId,
                type: 'COIN_PURCHASE',
                amount: price,
                status: 'PENDING',
                orderId,
            },
        });
        return res.json({
            message: 'Order created. Please make payment and upload receipt.',
            transaction,
            paymentDetails: {
                upiId: 'meroluck@bank',
                accountHolder: 'Mero Luck Collectibles Pvt Ltd',
                bankName: 'Nepal Investment Mega Bank',
                accountNumber: '00100200300405',
                ifsc: 'NIMB0000001',
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to create coin order', error: error.message });
    }
});
// Upload Payment Proof
router.post('/upload-proof/:orderId', auth_1.authenticateToken, upload.single('receipt'), async (req, res) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'Payment proof file (image/pdf) is required' });
        }
        const transaction = await db_1.default.transaction.findUnique({ where: { orderId } });
        if (!transaction) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (transaction.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const relativePath = `/uploads/${req.file.filename}`;
        const updatedTransaction = await db_1.default.transaction.update({
            where: { orderId },
            data: {
                paymentProofUrl: relativePath,
                status: 'PENDING', // keep pending until admin reviews
            },
        });
        // Notify user
        await db_1.default.notification.create({
            data: {
                userId,
                message: `Payment proof uploaded for order ${orderId}. Admin is verifying.`,
            },
        });
        return res.json({
            message: 'Receipt uploaded successfully. Waiting for admin approval.',
            transaction: updatedTransaction,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});
// Get User's Transactions
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const transactions = await db_1.default.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(transactions);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
    }
});
exports.default = router;
