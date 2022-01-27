const path = require('path');
const express = require('express');
const app = express();

// settings 
app.set('port', process.env.PORT || 3000)

// static files
//console.log();
app.use(express.static(path.join(__dirname, 'public'))); 

// start the server 
const server = app.listen(app.get('port'), () => {
    console.log('server on port', app.get('port'));
}); 

const SocketIO = require('socket.io');
const io =  SocketIO(server);

// websockets = escuchar eventos de conexión
// cuando se conecta un nuevo cliente: 
// se dispara el evento 'connection' luego de refrescar la página, tambien recibe la información del socket del cliente (chat)
io.on('connection', (socket) =>{
    console.log('new connection...',socket.id);
    // la variable data dentro de este método representa los datos en el objeto que se pasa dentro de socket.emit
    //data es una variable global de JS
    socket.on('mensajes:chat', (data) =>{
        io.sockets.emit('mensajes:chat', data);
    });

    socket.on('chat:typing', (data) =>{
        // cuando quiero emitir un evento a todos menos a mí, se usa broadcast
        socket.broadcast.emit('chat:typing', data);
    })
});



