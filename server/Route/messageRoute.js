const express=require('express');
const router=express.Router();
const messageController=require('../controller/messageController')
const protected=require('../middleware/authMiddleware');

router.post('/send', protected, messageController.sendMessage);

router.get('/room/:roomId', protected, messageController.getMessageByRoom);

module.exports=router;