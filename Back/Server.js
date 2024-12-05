const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Remplacez par l'URL où votre client est hébergé
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const colorGenerator = function* colorGenerator() {
  while (true) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    yield `rgb(${r}, ${g}, ${b})`;
  }
};

// Exemple d'utilisation
const colors = colorGenerator();

const players = new Set();

io.on("connection", (socket) => {
  console.log("Un utilisateur est connecté :", socket.id);

  socket.on("register", () => {
    const color = colors.next().value;
    const playerData = { color, id: socket.id };

    const d = [...players];
    console.log("current", players, socket.id);
    const find = d.find((p) => p.id === socket.id);
    if (!find) {
      players.add(playerData);
    }

    socket.emit("register-ok", find);

    console.log("emit new player list to all");
    socket.broadcast.emit("new-player", { players: [...players] });
    socket.emit("new-player", { players: [...players] });
  });

  socket.on("move", (data) => {
    socket.broadcast.emit("ennemy-move", {
      id: socket.id,
      x: data.x,
      y: data.y,
    });
  });

  socket.on("disconnect", () => {
    console.log("Un utilisateur est déconnecté");
  });
});

server.listen(3001, () => {
  console.log("listen on port 3001");
});
