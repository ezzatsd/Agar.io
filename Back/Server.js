const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
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

const colors = colorGenerator();

const players = new Set();

const food = [];

const MAX_FOOD = 100; // 100 nourritures maximum sur l'écran

const generateFood = () => {
    const x = Math.random() * 1000;
    const y = Math.random() * 1000;
    const color = colors.next().value;
    return { x, y, color };
};

for (let i = 0; i < MAX_FOOD / 2; i++) {
    food.push(generateFood());
}

const isCollision = (xfood, yfood, xplayer, yplayer, size = 15) => { //Vérifier s'il y a une collision entre le joueur et la nourriture
    const dx = xfood - xplayer;
    const dy = yfood - yplayer;
    return Math.sqrt(dx * dx + dy * dy) < size; 
};

const isPlayerCollision = (player1, player2) => { //Vérifier s'il y a une collision entre deux joueurs
  const dx = player1.x - player2.x;
  const dy = player1.y - player2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < (30 + player1.size * 6) / 2; 
};

io.on("connection", (socket) => {
    console.log("Un utilisateur est connecté :", socket.id);

    socket.on("register", () => {
        const color = colors.next().value;
        const playerData = { color, id: socket.id, size: 0 };

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

    socket.on("move", (player) => {
      const currentPlayer = [...players].find((p) => p.id === socket.id);
  
      if (currentPlayer) {
          // Met à jour les coordonnées du joueur
          currentPlayer.x = player.x;
          currentPlayer.y = player.y;
  
          // Vérifie la collision avec la nourriture
          food.forEach((foodItem, index) => {
              if (isCollision(currentPlayer.x, currentPlayer.y, foodItem.x, foodItem.y)) {
                  // Augmente la taille du joueur
                  currentPlayer.size += 1;
  
                  // Supprime la nourriture mangée
                  food.splice(index, 1);
  
                  // Émet les mises à jour
                  io.emit("food-update", { food }); // Mets à jour la nourriture côté client
                  io.emit("player-size-update", { id: currentPlayer.id, size: currentPlayer.size }); // Mets à jour la taille du joueur
              }
          });
  
          // Vérifie les collisions avec d'autres joueurs
          [...players].forEach((otherPlayer) => {
              if (otherPlayer.id !== currentPlayer.id && isPlayerCollision(currentPlayer, otherPlayer)) {
                console.log("il y a une collision");
                  if (currentPlayer.size > otherPlayer.size) {
                      // Le joueur le plus gros mange le joueur plus petit
                      currentPlayer.size += otherPlayer.size;
                      players.delete(otherPlayer);
  
                      // Informe les clients qu'un joueur a été mangé
                      io.emit("player-eaten", {
                          eaterId: currentPlayer.id,
                          eatenId: otherPlayer.id,
                          newSize: currentPlayer.size,
                      });
                  }
              }
          });
  
          // Mets à jour les données globales
          players.delete(currentPlayer);
          players.add(currentPlayer);
  
          // Notifie les autres joueurs du mouvement
          socket.broadcast.emit("ennemy-move", {
              id: currentPlayer.id,
              x: currentPlayer.x,
              y: currentPlayer.y,
          });
      }
  });
  

    socket.on("disconnect", () => {
        console.log("Un utilisateur est déconnecté");
    });
});

setInterval(() => {
  
  if (food.length < MAX_FOOD) {
      const newFood = generateFood();
      food.push(newFood);
      io.emit("food-update", { food: food });
      
  }
}, 2000);

server.listen(3001, () => {
  console.log("listen on port 3001");
});