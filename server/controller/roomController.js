const {Room, RoomMember, User}=require('../models');
const { Op, where }=require('sequelize');

exports.getOrCreatePrivateRoom = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({ message: "L'ID de l'ami (friendId) est requis." });
        }

        // Récupérer les IDs des rooms de l'utilisateur
        const userMemberships = await RoomMember.findAll({
            where: { userId: currentUserId },
            attributes: ['roomId']
        });
        const userRoomIds = userMemberships.map(m => m.roomId);

        // Chercher une room privée qui inclut directement l'ami via la relation 'members'
        let sharedRoom = await Room.findOne({
            where: {
                id: { [Op.in]: userRoomIds },
                isGroup: false
            },
            include: [{
                model: User,
                as: 'members', // Utilise l'alias défini dans Room.belongsToMany(models.User, { as: 'members' })
                where: { id: friendId }
            }]
        });

        if (sharedRoom) {
            return res.status(200).json(sharedRoom);
        }

        // Sinon créer le salon
        const newRoom = await Room.create({ isGroup: false });

        await RoomMember.bulkCreate([
            { roomId: newRoom.id, userId: currentUserId, role: 'admin' },
            { roomId: newRoom.id, userId: friendId, role: 'member' }
        ]);

        return res.status(201).json(newRoom);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


// 2. Créer un salon de groupe
exports.createGroupRoom = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { name, userIds } = req.body; // userIds = tableau des IDs invités

        if (!name || !userIds || !userIds.length) {
            return res.status(400).json({ message: "Le nom du groupe et les participants sont requis." });
        }

        // Créer le salon de groupe
        const groupRoom = await Room.create({ name, isGroup: true, createdBy: currentUserId });

        // Préparer le tableau des membres (Créateur = admin)
        const membersToCreate = [
            { roomId: groupRoom.id, userId: currentUserId, role: 'admin' },
            ...userIds.map(id => ({ roomId: groupRoom.id, userId: id, role: 'member' }))
        ];

        await RoomMember.bulkCreate(membersToCreate);

        return res.status(201).json({ message: "Groupe créé", room: groupRoom });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 3. Récupérer tous les salons de l'utilisateur (Pour la liste des discussions)
exports.getUserRooms = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // On récupère les IDs des rooms de l'utilisateur
        const userMemberships = await RoomMember.findAll({
            where: { userId: currentUserId },
            attributes: ['roomId']
        });
        const roomIds = userMemberships.map(m => m.roomId);

        // On charge les détails des rooms avec TOUS leurs membres
        const rooms = await Room.findAll({
            where: { id: { [Op.in]: roomIds } },
            include: [
                {
                    model: RoomMember,
                    include: [{ model: User, attributes: ['id', 'username', 'avatarUrl', 'isOnline'] }]
                }
            ],
            order: [['updatedAt', 'DESC']] // Les discussions les plus récentes en haut
        });

        return res.status(200).json(rooms);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};