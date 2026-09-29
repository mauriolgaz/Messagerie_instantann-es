const express=require('express');
const router=express.Router();
const callController=require('../controller/callController')
const protected=require('../middleware/authMiddleware')

router.get('/history', protected, callController.getCallHistory);
router.post('/record', protected, callController.recordCall);


module.exports=router;