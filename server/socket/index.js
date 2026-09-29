const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const { JWT_SECRET } = require('../config/jwt');

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // 1. Middleware d'authentification Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];

        if (!token) {
            return next(new Error('Authentification requise'));
        }

        try {
            const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
            const decoded = jwt.verify(cleanToken, JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            return next(new Error('Token invalide ou expiré'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.userId;
        const userRoomName = `user_${userId}`;

        console.log(`Nouveau client connecté : socket ${socket.id} (User ID: ${userId})`);

        // Rejoindre la room personnelle
        socket.join(userRoomName);

        // Passer l'utilisateur en ligne dans la BDD
        try {
            await User.update({ isOnline: true }, { where: { id: userId } });
            io.emit('user_status_changed', { userId, isOnline: true });
        } catch (err) {
            console.error("Erreur lors de la mise à jour du statut isOnline:", err);
        }

        // ========================================================
        // 2. GESTION DES SALONS & MESSAGES
        // ========================================================
        socket.on('joinRoom', (roomId) => {
            const roomName = `room_${roomId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} (User ${userId}) a rejoint ${roomName}`);
        });

        socket.on('leaveRoom', (roomId) => {
            const roomName = `room_${roomId}`;
            socket.leave(roomName);
            console.log(`Socket ${socket.id} a quitté ${roomName}`);
        });

        socket.on('typing', ({ roomId, isTyping }) => {
            socket.to(`room_${roomId}`).emit('user_typing', { userId, isTyping });
        });

        // ========================================================
        // 3. SIGNALISATION VOIP / WEBRTC
        // ========================================================
        socket.on('call_user', ({ targetUserId, signalData, callType }) => {
            io.to(`user_${targetUserId}`).emit('incoming_call', {
                fromUserId: userId,
                signal: signalData,
                callType
            });
        });

        socket.on('answer_call', ({ targetUserId, signalData }) => {
            io.to(`user_${targetUserId}`).emit('call_accepted', {
                signal: signalData
            });
        });

        socket.on('ice_candidate', ({ targetUserId, candidate }) => {
            io.to(`user_${targetUserId}`).emit('ice_candidate', {
                senderId: userId,
                candidate
            });
        });

        socket.on('end_call', ({ targetUserId }) => {
            io.to(`user_${targetUserId}`).emit('call_ended', { fromUserId: userId });
        });

        // ========================================================
        // 4. DÉCONNEXION SÉCURISÉE (Multi-onglets)
        // ========================================================
        socket.on('disconnect', async () => {
            console.log(`Client déconnecté : socket ${socket.id} (User ID: ${userId})`);

            // Vérifier s'il reste d'autres connexions pour cet utilisateur
            const activeUserRoom = io.sockets.adapter.rooms.get(userRoomName);
            const activeSocketsCount = activeUserRoom ? activeUserRoom.size : 0;

            if (activeSocketsCount === 0) {
                try {
                    await User.update({ isOnline: false }, { where: { id: userId } });
                    io.emit('user_status_changed', { userId, isOnline: false });
                } catch (err) {
                    console.error("Erreur déconnexion:", err);
                }
            }
        });
    });

    return io;
};

module.exports = initSocket;