import express from "express";
import http from "http";
import path from "path";
import socketio from "socket.io";
import Filter from "bad-words";

import { generateMessage } from "./utils/messages";
import { addUser, removeUser, getUser, getUsersInRoom } from "./utils/users";

const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, "../public");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(publicDirPath));
app.use(express.json());

io.on("connection", (socket) => {
  socket.on("sendMessage", (msg, callback) => {
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed");
    }

    const user = getUser(socket.id);
    if (!user) {
      return callback("User doesn't exist!");
    }

    io.to(user.room).emit("message", generateMessage(msg, user.username));
    callback();
  });

  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("User doesn't exist!");
    }

    io.to(user.room).emit(
      "locationMessage",
      generateMessage(
        `https://google.com/maps?q=${latitude},${longitude}`,
        user.username
      )
    );
    callback();
  });

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Welcome!", "Admin"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(`${user.username} has joined!`, "Admin")
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`, "Admin")
      );

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log("Server is running on port " + port);
});
