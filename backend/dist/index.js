"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Configure dotenv
dotenv_1.default.config();
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const purchases_1 = __importDefault(require("./routes/purchases"));
const draws_1 = __importDefault(require("./routes/draws"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Socket.io setup with CORS matching frontend
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
// Serve payment proofs statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/purchases', purchases_1.default);
app.use('/api/draws', draws_1.default);
app.use('/api/admin', admin_1.default);
// Simple health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// Socket connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Join a room for real-time tickers
    socket.join('live-ticker');
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
// Periodically simulate live tickets and purchases to create an active environment (jackpot ticking)
setInterval(() => {
    const luckyNumbers = ['149230', '568794', '204938', '993410', '481230', '823491'];
    const mockNames = ['Aayush S.', 'Bibek K.', 'Sandip T.', 'Priyanka D.', 'Niranjan R.'];
    const mockActivity = {
        user: mockNames[Math.floor(Math.random() * mockNames.length)],
        number: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
        type: Math.random() > 0.4 ? 'token' : 'coin',
        timestamp: new Date(),
    };
    io.to('live-ticker').emit('new-purchase-activity', mockActivity);
}, 12000); // Send mock real-time events every 12 seconds
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Mero Luck Express Server running on port ${PORT}`);
});
