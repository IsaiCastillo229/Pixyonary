import React, { useEffect } from "react";
import socket from "../socket";
// Importar imágenes de frutas base
import fresaImg from "../assets/avatar/fresa.png";
import naranjaImg from "../assets/avatar/naranja.png";
import manzanaImg from "../assets/avatar/manzana.png";
import uvaImg from "../assets/avatar/uva.png";
import mangoImg from "../assets/avatar/mango.png";
// Importar caras
import caraFeliz from "../assets/Caras/feliz.png";
import caraTriste from "../assets/Caras/triste.png";
import caraEnojado from "../assets/Caras/enojado.png";
import caraCompetitivo from "../assets/Caras/competitivo.png";
import caraLocos from "../assets/Caras/locos.png";
import caraLentes from "../assets/Caras/lentes.png";
// Importar accesorios
import accFrio from "../assets/accesorios/frio.png";
import accFiesta from "../assets/accesorios/fiesta.png";
import accCorona from "../assets/accesorios/corona.png";
import accGorra from "../assets/accesorios/gorra.png";
import accElegante from "../assets/accesorios/elegante.png";
import accSombrero from "../assets/accesorios/sombrero.png";

const fruitBases = [
  { id: "fresa", img: fresaImg },
  { id: "naranja", img: naranjaImg },
  { id: "manzana", img: manzanaImg },
  { id: "uva", img: uvaImg },
  { id: "mango", img: mangoImg },
];
const caras = [
  { id: "feliz", img: caraFeliz },
  { id: "triste", img: caraTriste },
  { id: "enojado", img: caraEnojado },
  { id: "competitivo", img: caraCompetitivo },
  { id: "locos", img: caraLocos },
  { id: "lentes", img: caraLentes },
];
const accesorios = [
  { id: "none", img: null },
  { id: "frio", img: accFrio },
  { id: "fiesta", img: accFiesta },
  { id: "corona", img: accCorona },
  { id: "gorra", img: accGorra },
  { id: "elegante", img: accElegante },
  { id: "sombrero", img: accSombrero },
];

function renderAvatar(character, size = 60) {
  const base = fruitBases.find(f => f.id === character?.fruitType) || fruitBases[0];
  const cara = caras.find(c => c.id === character?.cara) || caras[0];
  const accesorio = accesorios.find(a => a.id === character?.accesorio) || accesorios[0];
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <img src={base.img} alt="fruta" style={{ width: size, height: size, position: 'absolute', top: 0, left: 0 }} />
      {cara.img && <img src={cara.img} alt="cara" style={{ width: size * 0.43, height: size * 0.43, position: 'absolute', top: size * 0.39, left: size * 0.33 }} />}
      {accesorio.img && <img src={accesorio.img} alt="accesorio" style={{ width: size * 0.71, height: size * 0.71, position: 'absolute', top: -size * 0.32, left: size * 0.14 }} />}
    </div>
  );
}

function PlayerWaitingRoom({ room, players, activePlayers, player, onBackToHome, onGameStart }) {
  const renderPlayerCharacter = (p) => {
    const isCurrentPlayer = p.name === player.name;
    const isHost = p.isHost;
    return (
      <div className={`flex items-center space-x-3 p-3 rounded-lg shadow-sm border-2 ${
        isCurrentPlayer ? "bg-cyan-100 border-cyan-300" : 
        isHost ? "bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300" : 
        "bg-blue-50 border-blue-100"
      }`}>
        <div style={{ width: 48, height: 48 }}>
          {renderAvatar(p.character, 48)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-800">
            {p.name} {isCurrentPlayer && "(Tú)"}
          </p>
          <p className={`text-sm ${
            isHost ? "text-cyan-600 font-medium" : "text-blue-400"
          }`}>
            {isHost ? "👑 Anfitrión (No juega)" : "Jugador"}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          isHost ? "bg-cyan-400" : "bg-green-400 animate-pulse"
        }`}></div>
      </div>
    );
  };

  // Separar anfitrión y jugadores
  const host = players.find(p => p.isHost);
  const otherPlayers = players.filter(p => !p.isHost && p.name !== player.name);

  useEffect(() => {
    const handleTurnInfo = (data) => {
      if (typeof onGameStart === "function") {
        onGameStart(data);
      }
    };
    socket.on("turn_info", handleTurnInfo);
    return () => socket.off("turn_info", handleTurnInfo);
  }, [onGameStart]);

  return (
    <div className="lobby-bg">
      <Bubbles />
      <div className="lobby-container" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <button onClick={onBackToHome} className="lobby-back">← Salir</button>
        <div className="lobby-panel" style={{marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 320, minHeight: 380, padding: 40}}>
          <h2 className="lobby-title" style={{fontSize: '2rem', marginBottom: 18, textAlign: 'center'}}>Tu Personaje</h2>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24}}>
            {renderAvatar(player.character, 120)}
            <span className="lobby-player-name" style={{fontWeight: 'bold', color: '#2176ae', fontSize: '1.3rem', marginTop: 12}}>{player.name} (Tú)</span>
          </div>
          <div style={{marginTop: 24, background: '#e0f2fe', border: '2px solid #3a8dde', borderRadius: 16, padding: 24, width: '100%', textAlign: 'center'}}>
            <div className="text-2xl mb-2">🎮</div>
            <p className="lobby-player-name" style={{color: '#2176ae', fontWeight: 'bold', fontSize: '1.1rem'}}>Esperando a que el anfitrión inicie el juego...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubbles() {
  return (
    <>
      <div className="absolute top-0 left-0 w-40 h-40 bg-blue-200 rounded-full opacity-40 blur-2xl animate-pulse" style={{zIndex:0}} />
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-200 rounded-full opacity-30 blur-2xl animate-pulse" style={{zIndex:0}} />
      <div className="absolute top-1/2 left-0 w-24 h-24 bg-blue-300 rounded-full opacity-30 blur-2xl animate-pulse" style={{zIndex:0}} />
      <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse" style={{zIndex:0}} />
    </>
  );
}

export default PlayerWaitingRoom; 