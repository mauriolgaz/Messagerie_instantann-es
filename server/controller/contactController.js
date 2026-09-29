const { Contact, User } = require('../models');
const { Op } = require('sequelize');

// 1. Envoyer une demande de contact
exports.addContact = async (req, res) => {
    try {
        const userId = req.user.id; // ✅ Changé de req.userId à req.user.id
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({ message: "Le champ friendId est requis." });
        }

        if (userId === parseInt(friendId)) {
            return res.status(400).json({ message: "Vous ne pouvez pas vous ajouter vous-même." });
        }

        // Vérifier si une relation existe déjà (dans un sens ou dans l'autre)
        const existingContact = await Contact.findOne({
            where: {
                [Op.or]: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId }
                ]
            }
        });

        if (existingContact) {
            return res.status(400).json({ message: "Une relation ou demande existe déjà." });
        }

        const contact = await Contact.create({
            userId,
            friendId,
            status: 'pending'
        });

        // Notification Socket.io en temps réel
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${friendId}`).emit('contact_request', { fromUserId: userId });
        }

        return res.status(201).json({ message: "Demande envoyée.", contact });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 2. Récupérer tous les contacts acceptés de l'utilisateur
exports.getContacts = async (req, res) => {
    try {
        const userId = req.user.id; // ✅ OK

        const contacts = await Contact.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [{ userId }, { friendId: userId }]
            },
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl', 'isOnline'] },
                { model: User, as: 'friend', attributes: ['id', 'username', 'avatarUrl', 'isOnline'] }
            ]
        });

        const formattedContacts = contacts.map(c => {
            const friendData = c.userId === userId ? c.friend : c.user;
            return {
                relationId: c.id,
                contact: friendData,
                updatedAt: c.updatedAt
            };
        });

        return res.status(200).json(formattedContacts);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 3. Récupérer les demandes de contact reçues (en attente)
exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id; // ✅ Changé de req.userId à req.user.id

        const pending = await Contact.findAll({
            where: { friendId: userId, status: 'pending' },
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }
            ]
        });

        return res.status(200).json(pending);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 4. Accepter ou Refuser une demande
exports.updateContactStatus = async (req, res) => {
    try {
        const userId = req.user.id; // ✅ Changé de req.userId à req.user.id
        const { senderId, status } = req.body;

        if (!['accepted', 'blocked'].includes(status)) {
            return res.status(400).json({ message: "Statut invalide ('accepted' ou 'blocked')." });
        }

        const contact = await Contact.findOne({
            where: { userId: senderId, friendId: userId, status: 'pending' }
        });

        if (!contact) {
            return res.status(404).json({ message: "Demande introuvable." });
        }

        contact.status = status;
        await contact.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${senderId}`).emit('contact_status_updated', { userId, status });
        }

        return res.status(200).json({ message: `Demande ${status}.`, contact });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};