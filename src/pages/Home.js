import React, { useState } from "react";
import CreateRoom from "../components/CreateRoom";
import JoinRoom from "../components/JoinRoom";
import "./Home.css";
import socket from "../socket";

// Lista de imágenes libres de frutas con carita
const fruitImages = [
  "https://cdn.pixabay.com/photo/2017/01/31/13/14/apple-2023408_1280.png", // manzana
  "https://cdn.pixabay.com/photo/2017/01/31/13/14/banana-2023407_1280.png", // banana
  "https://cdn.pixabay.com/photo/2017/01/31/13/14/strawberry-2023410_1280.png", // fresa
  "https://cdn.pixabay.com/photo/2017/01/31/13/14/orange-2023409_1280.png", // naranja
  "https://cdn.pixabay.com/photo/2017/01/31/13/14/grapes-2023406_1280.png", // uvas
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function FallingFruits({ count = 8 }) {
  // Renderiza varias frutas en posiciones y delays aleatorios
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const left = getRandomInt(5, 90); // porcentaje
        const duration = getRandomInt(5, 10); // segundos
        const delay = getRandomInt(0, 5); // segundos
        const size = getRandomInt(48, 80); // px
        const fruit = fruitImages[getRandomInt(0, fruitImages.length - 1)];
        return (
          <img
            key={i}
            src={fruit}
            alt="fruta"
            className="falling-fruit"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </>
  );
}

function Home({ onCreateRoom, onJoinRoom, joinRoomPrefill }) {
  const [showJoin, setShowJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const handleBackToMenu = () => {
    setLoadingCreate(false);
    setShowJoin(false);
  };

  const handleCreateRoom = () => {
    setLoadingCreate(true);
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    socket.emit("create_room", { room: roomCode });
    setTimeout(() => {
      onCreateRoom({ room: roomCode, isHost: true });
    }, 1000); // Simula un pequeño delay para UX
  };

  if (loadingCreate) {
    return (
      <div className="home-bg">
        <Bubbles />
        <div className="home-panel" style={{textAlign: 'center'}}>
          <div className="home-logo" style={{fontSize: '3rem', marginBottom: 16}}>
            🎨
          </div>
          <h2 className="home-title" style={{marginBottom: 16}}>Creando tu sala...</h2>
          <div style={{margin: '0 auto', width: 48, height: 48}}>
            <div className="loader" style={{border: '6px solid #a18cd1', borderTop: '6px solid #fff', borderRadius: '50%', width: 48, height: 48, animation: 'spin 1s linear infinite'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (showJoin || joinRoomPrefill) {
    return (
      <div className="home-bg">
        <Bubbles />
        <div className="home-panel">
          <JoinRoom 
            onJoin={onJoinRoom}
            onBack={handleBackToMenu}
            prefillRoom={joinRoomPrefill}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="home-bg">
      <Bubbles />
      <div className="home-panel">
        {/* Header con logo y título */}
        <div className="home-header">
          <div className="home-logo">🍓🍊🍌🍎🍇</div>
          <h1 className="home-title">Pictionary de Frutas</h1>
          <p className="home-desc">¡Dibuja y adivina con frutas tiernas!</p>
        </div>

        {/* Botones principales */}
        <div className="home-btns">
          <button
            onClick={handleCreateRoom}
            className="home-btn"
          >
            🎨 Crear Sala
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="home-btn"
          >
            🚪 Unirse a Sala
          </button>
        </div>

        {/* Información adicional */}
        <div className="home-info">
            ¡Perfecto para fiestas y reuniones familiares!
        </div>
      </div>
    </div>
  );
}

// Componente decorativo de burbujas azules
function Bubbles() {
  return (
    <>
      <div className="bubble bubble1" />
      <div className="bubble bubble2" />
      <div className="bubble bubble3" />
      <div className="bubble bubble4" />
    </>
  );
}

export default Home;
