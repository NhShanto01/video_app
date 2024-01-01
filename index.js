require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');


const connectDb = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('connection successful.');
  } catch (e) {
    console.log(e.message);
  }

}

connectDb();

//Cors all routes
app.use((req, res, next) =>{
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const https = require('https');
const fs = require('fs');
// const WebSocket = require('ws');

const cred = https.createServer({
    cert: fs.readFileSync('./ssl/localhost.crt','utf8'),
    key: fs.readFileSync('./ssl/localhost.key','utf8'), 
    ca: fs.readFileSync('./ssl/localhost.csr','utf8')
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

const userRoute = require('./routes/userRoute');
app.use('/', userRoute);



function sentToOtherUser(connection, message) {
  connection.send(JSON.stringify(message));
} 
// http.listen(3000, '0.0.0.0', () => {
//   console.log('Server is running');
// });
const httpsServer = https.createServer(cred, app);

//websocket
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: httpsServer });

// var wss = new webSocketServer({
//   port: 8000
// });

var users = {};
wss.on("connection", function (conn) {
  console.log('User connected');

  conn.on("message", function (message) {
    var data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log(e);
    }
    switch (data.type) {
      case "online":
        users[data.name] = conn;
        conn.name = data.name;

        sentToOtherUser(conn, {
          type: "online",
          success: true
        })
        break;
      case "offer":
        var connect = users[data.name];
        if (connect != null) {
          conn.otherUser = data.name;
          console.log(data.offer);
          sentToOtherUser(connect, {
            type: "offer",
            offer: data.offer,
            name: conn.name,
            image: data.image
          });
        }
        else{
          sentToOtherUser(conn,{
            type: "not_available",
            name: data.name
          });
        }
        break;
      case "answer":
        var connect = users[data.name];
        if (connect != null) {
          conn.otherUser = data.name;
          sentToOtherUser(connect, {
            type: "answer",
            answer: data.answer
          });
        }
        break;
      case "candidate":
        var connect = users[data.name];
        if (connect != null) {
          // conn.otherUser = data.name;
          sentToOtherUser(connect, {
            type: "candidate",
            candidate: data.candidate
          });
        }
        break;
      case "reject":
        var connect = users[data.name];
        if (connect != null) {
          // conn.otherUser = data.name;
          sentToOtherUser(connect, {
            type: "reject",
            name: conn.name
          });
        }
        break;
      case "accept":
        var connect = users[data.name];
        if (connect != null) {
          sentToOtherUser(connect, {
            type: "accept",
            name: conn.name
          });
        }
        break; 
      case "hangup":
        var connect = users[data.name];
        connect.otherUser = null;
        if (connect != null) {
          sentToOtherUser(connect, {
            type: "hangup",
          });
        }
        break;
        default:
          sentToOtherUser(connect, {
            type: "error",
            message: data.type + "not found"
          });
          break;
    }
  });
  conn.on("close", function () {
    console.log("connection closed");
  });

});


httpsServer.listen(3000);