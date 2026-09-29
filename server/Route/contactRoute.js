const express = require('express');
const router = express.Router();
const contactController = require('../controller/contactController');
const protect = require('../middleware/authMiddleware');

// Obtenir la liste des contacts acceptés
router.get('/', protect, contactController.getContacts);

// Envoyer une demande de contact
router.post('/addContact', protect, contactController.addContact);

// Voir les demandes reçues en attente
router.get('/pending', protect, contactController.getPendingRequests);

// Accepter ou Bloquer/Refuser une demande
router.put('/status', protect, contactController.updateContactStatus);

module.exports = router;