// socket que envia todos los eventos del cliente al servidor 
const socket = io()

// DOM elements = document es una variable de javascript que sirve para obtener cualquier seccion del HTML según su ID en el div 
let message = document.getElementById('message');
let username = document.getElementById('username');
let btn = document.getElementById('send');
let output = document.getElementById('output');
let actions = document.getElementById('actions');

message.addEventListener('keypress', function() {
    socket.emit('chat:typing', username.value)
});

btn.addEventListener('click', function() {
    // mensajes:chat es como un ID para referirse en servidor a los atributos del objeto 
    socket.emit('mensajes:chat', {
        message: message.value,
        username: username.value
    });
    console.log(username.value, message.value);
    document.getElementById('message').value="";
});


// escuchando lo que me emite el servidor: 

socket.on('mensajes:chat', function(data) {
    actions.innerHTML = "";
    output.innerHTML += `<p>
        <strong> ${data.username} </strong>: ${data.message}
    </p>`
});

socket.on('chat:typing', function(data){
    actions.innerHTML = `<p> <em>${data} is typing a message.. </em> </p>`
});

/* video chat */

// Obtiene el video local y da permisos a la computadora para acceder a los dispositivos multimedia:
function getLocalVideo(callbacks){ 
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    var constraints = {
        audio:true,
        video:true
    }
    navigator.getUserMedia(constraints, callbacks.success, callbacks.error)
}
function recStream(stream, elementId){
    var video = document.getElementById(elementId);
    video.srcObject = stream;
    window.peer_stream = stream;
}
getLocalVideo({
    success: function(stream){
        window.localstream = stream;
        recStream(stream, 'lVideo');
    },
    error: function(err){
        alert("cannot access your camera");
        console.log(err);
    }
})

    var conn;
    var peer_id;


// Creando un objeto peer para establecer una conexión: 
    var peer = new Peer();
// Muestra el ID del peer en el HTML: 
    peer.on('open', function(){
        document.getElementById("displayId").innerHTML = peer.id 
    })
    
    peer.on('connection', function(connection){
        conn = connection;
        peer_id = connection.peer;

        document.getElementById('connId').value = peer_id;
    });

    peer.on('error', function(err){
        alert("an error has happened" + err);
        console.log(err);
    })
// onclick with the connection button = expose ice info || evento onclick del boton que muestra el ID del cliente 

    document.getElementById('conn_button').addEventListener('click', function(){
        peer_id = document.getElementById("connId").value;
        if(peer_id){
            conn = peer.connect(peer_id);
        }else{
            alert("enter an id");
            return false;
        }
    })
// Función del botón de llamada, la respuesta es intercambiada

    peer.on('call', function(call){
        var acceptCall = confirm("Do you Want to Answer This Call?");

        if(acceptCall){
            call.answer(window.localstream);
            call.on('stream', function(stream){
                window.peer_stream = stream;
                recStream(stream, 'rVideo')
            });
            call.on('close', function(){
                alert('The Call has Behind');
            })
        } else {
            console.log("call denied")
        }
    });
// Responde la llamada mediante un alert:

    document.getElementById('call_button').addEventListener('click', function(){
        console.log("calling a peer:" + peer_id);
        console.log(peer);

        var call = peer.call(peer_id, window.localstream);

        call.on('stream', function(stream){
            window.peer_id = stream;

            recStream(stream, 'rVideo');
        })
    })
// accept the call
// display the remote video and local video on the clients