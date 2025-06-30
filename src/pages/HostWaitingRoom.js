import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import socket from "../socket";
import "./HostWaitingRoom.css";
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

function HostWaitingRoom({ room, players, activePlayers, host, onStartGame, onBackToHome, onGameStart }) {
  const [roomUrl, setRoomUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generar la URL de la sala
    const url = `${window.location.origin}${window.location.pathname}?room=${room}`;
    setRoomUrl(url);
  }, [room]);

  useEffect(() => {
    const handleTurnInfo = (data) => {
      if (typeof onGameStart === "function") {
        onGameStart(data);
      }
    };
    socket.on("turn_info", handleTurnInfo);
    return () => socket.off("turn_info", handleTurnInfo);
  }, [onGameStart]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar URL:", err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar código:", err);
    }
  };

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

  function renderAvatar(character, size = 48) {
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

  const renderPlayerCharacter = (player) => {
    const fruitEmojis = {
      strawberry: "🍓",
      orange: "🍊",
      banana: "🍌",
      apple: "🍎",
      grape: "🍇",
      watermelon: "🍉",
      cherry: "🍒",
      pineapple: "🍍",
      kiwi: "🥝",
      mango: "🥭"
    };

    const eyeEmojis = {
      happy: "😊",
      curious: "🤔",
      mischievous: "😏",
      sleepy: "😴"
    };

    const accessoryEmojis = {
      none: "",
      hat: "🎩",
      glasses: "👓",
      bow: "🎀"
    };

    const fruit = fruitEmojis[player.character?.fruitType] || "🍓";
    const eye = eyeEmojis[player.character?.eyes] || "😊";
    const accessory = accessoryEmojis[player.character?.accessory] || "";

    return (
      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg shadow-sm border-2 border-blue-200">
        <div className="text-3xl">
          {fruit}
        </div>
        <div className="text-lg">
          {eye}
        </div>
        {accessory && (
          <div className="text-lg">
            {accessory}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-blue-800">{player.name}</p>
          <p className="text-sm text-blue-400">Jugador</p>
        </div>
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      </div>
    );
  };

  const renderHostInfo = () => {
    const fruitEmojis = {
      strawberry: "🍓",
      orange: "🍊",
      banana: "🍌",
      apple: "🍎",
      grape: "🍇",
      watermelon: "🍉",
      cherry: "🍒",
      pineapple: "🍍",
      kiwi: "🥝",
      mango: "🥭"
    };

    const eyeEmojis = {
      happy: "😊",
      curious: "🤔",
      mischievous: "😏",
      sleepy: "😴"
    };

    const accessoryEmojis = {
      none: "",
      hat: "🎩",
      glasses: "👓",
      bow: "🎀"
    };

    // Si el host no tiene character, muestra un avatar y nombre genérico
    const fruit = host && host.character && host.character.fruitType ? fruitEmojis[host.character.fruitType] || "🍓" : "👑";
    const eye = host && host.character && host.character.eyes ? eyeEmojis[host.character.eyes] || "😊" : "";
    const accessory = host && host.character && host.character.accessory ? accessoryEmojis[host.character.accessory] || "" : "";

    return (
      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg shadow-sm border-2 border-blue-300">
        <div className="text-3xl">{fruit}</div>
        {eye && <div className="text-lg">{eye}</div>}
        {accessory && <div className="text-lg">{accessory}</div>}
        <div className="flex-1">
          <p className="font-semibold text-blue-800">{host && host.name ? host.name : "Anfitrión"}</p>
          <p className="text-sm text-cyan-600 font-medium">👑 Anfitrión (No juega)</p>
        </div>
        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
      </div>
    );
  };

  return (
    <div className="lobby-bg">
      <div className="lobby-container">
        <button onClick={onBackToHome} className="lobby-back">← Volver</button>
        <div className="lobby-header">
          <h1 className="lobby-title">Sala de Juego</h1>
          <span className="lobby-code">{room}</span>
          <p className="lobby-desc">¡Comparte el código o escanea el QR para que tus amigos se unan!</p>
        </div>
        <div className="lobby-panels">
          {/* Panel QR y código */}
          <div className="lobby-panel">
            <h2>Código QR</h2>
            <div className="lobby-qr">
              <QRCode value={roomUrl} size={180} level="M" includeMargin={true} />
            </div>
            <p style={{textAlign: 'center', color: '#a18cd1'}}>Escanea con tu dispositivo móvil</p>
            <h2 style={{marginTop: '24px'}}>Código de Sala</h2>
            <div style={{textAlign: 'center'}}>
              <span className="lobby-code">{room}</span>
            </div>
            <button onClick={handleCopyCode} className="lobby-btn">
              {copied ? "¡Copiado!" : "Copiar código"}
                </button>
          </div>
          {/* Panel jugadores */}
          <div className="lobby-panel">
            <h2>Jugadores ({activePlayers.length})</h2>
            <div className="lobby-players">
              {activePlayers.length === 0 && (
                <p style={{textAlign: 'center', color: '#a18cd1'}}>Esperando jugadores...</p>
              )}
              {activePlayers.map((player) => (
                <div key={player.id} className="lobby-player">
                  <span className="lobby-player-avatar">{renderAvatar(player.character, 36)}</span>
                  <span className="lobby-player-name">{player.name}</span>
                  <span className="lobby-player-status">Listo</span>
                </div>
              ))}
            </div>
            <button onClick={onStartGame} className="lobby-btn" disabled={activePlayers.length === 0} style={{marginTop: '24px'}}>
              ¡Empezar juego!
              </button>
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

export default HostWaitingRoom; 