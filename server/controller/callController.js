const { Call, User } = require('../models');
const { Op } = require('sequelize'); // ✅ Importation de Op manquante

// Récupérer l'historique des appels de l'utilisateur connecté
exports.getCallHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const calls = await Call.findAll({
            where: {
                [Op.or]: [{ callerId: userId }, { receiverId: userId }]
            },
            include: [
                { model: User, as: 'caller', attributes: ['id', 'username', 'avatarUrl'] },
                { model: User, as: 'receiver', attributes: ['id', 'username', 'avatarUrl'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            status: 'success',
            results: calls.length,
            data: { calls }
        });
    } catch (error) {
        next(error);
    }
};

// Enregistrer un appel (terminé, manqué ou rejeté)
exports.recordCall = async (req, res, next) => {
    try {
        const { receiverId, type, status, duration } = req.body;
        const callerId = req.user.id;

        if (!receiverId || !type || !status) {
            return res.status(400).json({
                status: 'fail',
                message: 'Les champs receiverId, type et status sont requis.'
            });
        }

        const call = await Call.create({
            callerId,
            receiverId,
            type, // 'audio' ou 'video'
            status, // 'completed', 'missed', 'declined'
            duration: duration || 0,
            startTime: new Date()
        });

        return res.status(201).json({
            status: 'success',
            data: { call }
        });
    } catch (error) {
        next(error);
    }
};