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
        
        food.forEach((foods, index) => {

          if (isCollision(player.x, player.y, foods.x, foods.y)) {
            let p = [...players].find(p => p.id === socket.id);
        if (p) {
            p.size += 1;
            players.delete(p);
            players.add(p);
        }

                food.splice(index, 1); 
                io.emit("food-update", { food: food }); 
                io.emit("player-size-update", { id: socket.id, size: p.size });
            }
        });
        
        socket.broadcast.emit("ennemy-move", {
            id: socket.id,
            x: player.x,
            y: player.y,
        });
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