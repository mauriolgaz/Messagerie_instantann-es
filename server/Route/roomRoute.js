const express=require('express');
const router=express.Router();
const roomController=require('../controller/roomController');
const protected=require('../middleware/authMiddleware');

router.get('/', protected, roomController.getUserRooms);
router.post('/private', protected, roomController.getOrCreatePrivateRoom);
router.post('/group', protected, roomController.createGroupRoom);

module.exports=router;