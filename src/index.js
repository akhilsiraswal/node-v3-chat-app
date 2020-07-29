const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUserInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");
console.log(publicDirectoryPath);

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "welcome!!"));
    console.log("a new user has joined");
    socket.broadcast
      .to(room)
      .emit(
        "message",
        generateMessage(`'Admin',${user.username} has joined!!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });

    // socket.emit, io.emit, socket.broadcast.emit.

    // io.to.emit => it emits an event to everyone in the room..
    // socket.broadcast.to.emit
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return {
        Error: "user not found",
      };
    }
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("profanity is not allowed");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  socket.on("sendLocation", (pos, callback) => {
    const user = getUser(socket.id);
    // console.log(user);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${pos.latitude},${pos.longitude}`
      )
    );

    callback();
  });

  socket.on("disconnect", () => {
    // console.log(socket.id);
    const user = removeUser(socket.id);

    // io.emit("message", generateMessage("A user has left"));
    // io.emit("message", generateMessage("A user has left"));
    // console.log(user);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`'Admin', ${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUserInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log("Server is running on port :: " + port);
});
