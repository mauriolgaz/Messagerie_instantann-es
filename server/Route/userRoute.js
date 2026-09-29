const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const protect=require('../middleware/authMiddleware')

router.get('/', userController.getAllUsers);
router.get('/search', protect, userController.searchUser);
router.post('/createUser', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/updateUser/:id', userController.updateUser);
router.delete('/deleteUser/:id', userController.deleteUser);


module.exports = router;