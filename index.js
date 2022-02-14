const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

// settings middleware
app.set('port', process.env.PORT || 3000)
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(bodyParser.json());
app.use(methodOverride('_method'));

// MONGO URI

const mongoURI = 'mongodb://dbuser1:madc1234@chatappcluster-shard-00-00.h494t.mongodb.net:27017,chatappcluster-shard-00-01.h494t.mongodb.net:27017,chatappcluster-shard-00-02.h494t.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-hojpq2-shard-0&authSource=admin&retryWrites=true&w=majority';

// creating mongo connection 

conn = mongoose.createConnection( mongoURI , { useNewUrlParser : true, useUnifiedTopology : true } );

// init gfs

let gfs;
let gridfsBucket; 

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

// routes

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', upload.single('file'),(req, res) =>{
    res.redirect('/');
});

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    // check if image 
    if(file.contentType === 'image/jpeg' || file.contentType === 'img/png'){
      // read output to browser
      const readstream = gridfsBucket.openDownloadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an Image:('
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/');
  });
});


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
        // cuando quiero emitir un evento a todos menos a mí, se usa broadcast:
        socket.broadcast.emit('chat:typing', data);
    })
});



