const {Server}=require("socket.io");

const initSocket=(server)=>{
    const io=new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    io.on('connection', (socket)=>{
        console.log(`Nouveau client connecté: ${socket.id}`);

        //rejoindre une discussion
        socket.on('joinRom', (roomId)=>{
            socket.join(roomId);
            console.log(`Socket ${socket.id} a rejoint la room_${roomId}`)
        });

        //quitter une discussion
        socket.on('leaveRom', (roomId)=>{
            socket.leave(roomId);
        });

        //deconnexion
        socket.on('disconnect', ()=>{
            console.log(`Client déconnecté: ${socket.id}`);
        });
    })
    return io;
};

module.exports=initSocket;

