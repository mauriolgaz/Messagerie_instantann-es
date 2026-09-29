const express = require('express');
const router = express.Router();
const roomMemberController = require('../controller/roomMemberController');
const protect = require('../middleware/authMiddleware');

// Obtenir la liste des membres d'une room
router.get('/:roomId', protect, roomMemberController.getRoomMembers);

// Ajouter un membre à une room
router.post('/add', protect, roomMemberController.addMember);

// Modifier le rôle d'un membre
router.put('/role', protect, roomMemberController.updateMemberRole);

// Retirer un membre d'une room (ou quitter)
router.delete('/:roomId/:userId', protect, roomMemberController.removeMember);

module.exports = router;