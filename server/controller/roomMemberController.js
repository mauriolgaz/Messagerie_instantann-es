const { RoomMember, User, Room } = require('../models');

// 1. Récupérer tous les membres d'une room
exports.getRoomMembers = async (req, res) => {
    try {
        const { roomId } = req.params;

        const members = await RoomMember.findAll({
            where: { roomId },
            include: [
                {
                    model: User,
                    as: 'user', // Adaptez selon le nom de l'association dans votre modèle
                    attributes: ['id', 'username', 'avatarUrl', 'isOnline']
                }
            ]
        });

        return res.status(200).json(members);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 2. Ajouter un membre dans un salon (ex: groupe)
exports.addMember = async (req, res) => {
    try {
        const { roomId, userId, role = 'member' } = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({ message: "Les champs roomId et userId sont requis." });
        }

        // Vérifier si le membre est déjà présent
        const existingMember = await RoomMember.findOne({
            where: { roomId, userId }
        });

        if (existingMember) {
            return res.status(400).json({ message: "L'utilisateur fait déjà partie de cette room." });
        }

        const member = await RoomMember.create({
            roomId,
            userId,
            role
        });

        return res.status(201).json({ message: "Membre ajouté avec succès.", member });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 3. Modifier le rôle d'un membre (ex: promouvoir admin)
exports.updateMemberRole = async (req, res) => {
    try {
        const { roomId, userId, role } = req.body;

        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ message: "Statut invalide ('admin' ou 'member')." });
        }

        const member = await RoomMember.findOne({
            where: { roomId, userId }
        });

        if (!member) {
            return res.status(404).json({ message: "Membre introuvable dans cette room." });
        }

        member.role = role;
        await member.save();

        return res.status(200).json({ message: "Rôle mis à jour.", member });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 4. Retirer un membre / Quitter la room
exports.removeMember = async (req, res) => {
    try {
        const { roomId, userId } = req.params;

        const member = await RoomMember.findOne({
            where: { roomId, userId }
        });

        if (!member) {
            return res.status(404).json({ message: "Membre introuvable dans cette room." });
        }

        await member.destroy();

        return res.status(200).json({ message: "Membre retiré de la room." });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};