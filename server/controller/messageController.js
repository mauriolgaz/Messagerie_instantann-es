const {Message, User, RoomMember}=require('../models');
const room = require('../models/room');

// Envoyer un message
exports.sendMessage=async(req, res)=>{
    try{
        const senderId=req.userId;
        const {roomId, content, type='text'}=req.body;

        if(!roomId || !content){
            return res.status(400).json({message:'les champs roomId et content sont requis'})
        }

        const isMember=await RoomMember.findOne({
            where:{roomId, userId:senderId}
        });

        if(!isMember){
            return res.status(403).json({message:"vous ne faites pas partie de cette salon de discussion"})
        }

        const newMessage=await Message.create({
            senderId, 
            roomId,
            content,
            type
        })

        // Charger les infos  de l'expéditeur retour
        const fullMessage=await Message.findByPk(newMessage.id,{
            include:[
                {model:User, as:'sender', attributes:['id', 'username', 'avatarUrl']}
            ]
        })

        // Emission socket.io en temps réel aux membres du salon
        const io=req.app.get('io');
        if(io){
            io.to(`room_${roomId}`).emit('new_message', fullMessage)
        }
        return res.status(201).json(fullMessage);
    }catch(error){
        return res.status(500).json({error:error.message});
    }
}

exports.getMessageByRoom=async(req, res)=>{
    try{
        const userId=req.user.id;
        const {roomId}=req.params;

        // Vérifier l'utilisateur appartient au salon 
        const isMember=await RoomMember.findOne({
            where:{roomId, userId}
        });
        if(!isMember){
            return res.status(403).json({message:"accès refusé au salon."})
        }

        const messages=await Message.findAll({
            where:{roomId},
            order:[['createdAt', 'ASC']],
            include:[
                {model:User, as:'sender', attributes:['id', 'username', 'avatarUrl']}
            ]
        });

        return res.status(200).json(messages);
    }catch(error){
        return res.status(500).json({error:error.message});
    }
}