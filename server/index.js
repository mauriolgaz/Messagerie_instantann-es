const http = require('http');
const app = require('./app');
const initSocket=require('./socket')

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io=initSocket(server);

app.set('io', io); // Ajout de l'instance Socket.IO à l'application Express

server.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});