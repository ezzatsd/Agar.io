import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import clsx from "clsx";

const socket = io("http://localhost:3001");

type Player = {
  id: string;
  x: number;
  y: number;
  color: string | void;
  size: number;
};

type Food = {
  id: string;
  x: number;
  y: number;
  color: string;
};

const Agar = () => {

  const [players, setPlayers] = useState<Player[]>([]);
  const [food, setfood] = useState<Food[]>([]);
  const meRef = useRef<Player | null>(null);
  const refs = useRef(new Map());

  const setRef = (id: string, el: HTMLDivElement | null) => {
    refs.current.set(id, el);
  };

  const draw = useCallback(() => {
    players.forEach((p) => {
      const ref = refs.current.get(p.id) as HTMLDivElement;
      if (ref) {
        ref.style.top = `${p.y}px`;
        ref.style.left = `${p.x}px`;
      }
    });
  }, [players]);

  useEffect(() => {
    socket.on("food-update", (data) => {
      setfood(data.food); 
    });
  
    return () => {
      socket.off("food-update");
    };
  }, []);

  useEffect(() => {
    socket.on("new-player", (data) => {
      console.log("playerlist", data);
      setPlayers((prev) => {
        return data.players.reduce((acc: Player[], next: Player) => {
          const exist = prev.find(({ id }) => id === next.id);
          console.log(exist, "???", socket.id);
          if (exist) {
            return [...acc, exist];
          }
          return [...acc, { id: next.id, x: 0, y: 0, color: next.color }];
        }, [] as Player[]);
      });
    });
    return () => {
      socket.off("new-player");
    };
  }, []);

  useEffect(() => {
    socket.emit("register");
    socket.on("register-ok", (data) => {
      console.log("register-ok");
      meRef.current = { x: 0, y: 0, ...data };
      if (meRef.current) {
        setPlayers([meRef.current]);
      }
    });
    return () => {
      socket.off("register-ok");
    };
  }, []);

  useEffect(() => { // Quand le joueur mange une nourriture il gagne de la taille
    socket.on("player-size-update", (data) => {
      console.log("Player size updated:", data);
      setPlayers((prev) => {
        return prev.map((p) => {
          if (p.id === data.id) {
            return { ...p, size: data.size };
          }
          return p;
        });
      });
    });
  
    return () => {
      socket.off("player-size-update");
    };
  }, []);

  useEffect(() => {
    socket.on("player-eaten", (data) => {
      console.log("Joueur mangé:", data);
      const { eaterId, eatenId, nouvelleTaille } = data;
  
      setPlayers((prev) => {
        // Mettre à jour la taille du joueur mangeur
        const updatedPlayers = prev.map((p) => {
          if (p.id === eaterId) {
            return { ...p, size: nouvelleTaille };
          }
          return p;
        });
  
        // Supprimer le joueur mangé
        return updatedPlayers.filter((p) => p.id !== eatenId);
      });
    });
  
    return () => {
      socket.off("player-eaten");
    };
  }, []);
  
  useEffect(() => {
    socket.on("ennemy-move", (data) => {
      console.log("ennemy move", data);
      setPlayers((prev) => {
        return prev.map((p) => {
          if (p.id === data.id) {
            return { ...p, x: data.x, y: data.y };
          }
          return p;
        });
      });
    });
    return () => {
      socket.off("ennemy-move");
    };
  }, []);

  useEffect(() => {
    draw();
  }, [draw, players]);

  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (meRef.current) {
        //@ts-ignore
        setPlayers((prev) => {
          return prev.map((p) => {
            if (p.id === socket.id) {
              console.log("x", e.clientX);
              console.log("y", e.clientY);
              console.log("Page coordinates:X=",e.pageX, ",Y=", e.pageY);
              const newMe = { ...p, y: e.pageY, x: e.pageX };
              meRef.current = newMe;
              socket.emit("move", newMe);
              return newMe;
            }
            return p;
          }, []);
        });
      }
    };

    document.body.addEventListener("click", clickHandler);
    return () => {
      document.body.removeEventListener("click", clickHandler);
    };
  }, []);

  return (
    <div style={{ height: "200vh", width: "200vw"}} >
      {players.map((p) => {
        return (
          <div
            className={clsx(
              `transition-all duration-1000 absolute w-[30px] h-[30px] rounded-[50px] flex items-center justify-center`
            )}
            style={{
              backgroundColor: p.color ?? "",
              top: `${p.y}px`,
              left: `${p.x}px`,
              width: `${30+(p.size*6)}px`,  
              height: `${30+(p.size*6)}px`,
            }}
            ref={(el) => setRef(p.id, el)}
            key={p.id}
          >{p.size}</div>
        );
      })}
      {food.map((food) => ( // Afficher la nourriture sur l'écran 
        <div
          key={food.id}
          className="absolute w-[15px] h-[15px] rounded-[7.5px]"
          style={{
            backgroundColor: food.color,
            top: `${food.y}px`,
            left: `${food.x}px`,
          }}
        >  </div>
      ))}
    </div>
  );
  
};

export default Agar;
