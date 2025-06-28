import React, { useState, useEffect } from "react";
import socket from "../socket";
import fresaImg from "../assets/avatar/fresa.png";
import naranjaImg from "../assets/avatar/naranja.png";
import pinaImg from "../assets/avatar/piña.png";
import kiwiImg from "../assets/avatar/kiwi.png";
import manzanaImg from "../assets/avatar/manzana.png";
import uvaImg from "../assets/avatar/uva.png";
import mangoImg from "../assets/avatar/mango.png";
import caraFeliz from "../assets/Caras/feliz.png";
import caraTriste from "../assets/Caras/triste.png";
import caraEnojado from "../assets/Caras/enojado.png";
import caraCompetitivo from "../assets/Caras/competitivo.png";
import caraLocos from "../assets/Caras/locos.png";
import caraLentes from "../assets/Caras/lentes.png";
import accFrio from "../assets/accesorios/frio.png";
import accFiesta from "../assets/accesorios/fiesta.png";
import accCorona from "../assets/accesorios/corona.png";
import accGorra from "../assets/accesorios/gorra.png";
import accElegante from "../assets/accesorios/elegante.png";
import accSombrero from "../assets/accesorios/sombrero.png";
import "./JoinRoom.css";

function JoinRoom({ onJoin, onBack, prefillRoom }) {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState(prefillRoom || "");
  const [character, setCharacter] = useState({
    fruitType: "fresa",
    cara: "feliz",
    accesorio: "none"
  });
  const [step, setStep] = useState("join"); // join, character, loading
  const [error, setError] = useState("");

  const fruitBases = [
    { id: "fresa", name: "Fresa", img: fresaImg },
    { id: "naranja", name: "Naranja", img: naranjaImg },
    { id: "manzana", name: "Manzana", img: manzanaImg },
    { id: "uva", name: "Uva", img: uvaImg },
    { id: "mango", name: "Mango", img: mangoImg },
  ];

  const caras = [
    { id: "feliz", name: "Feliz", img: caraFeliz },
    { id: "triste", name: "Triste", img: caraTriste },
    { id: "enojado", name: "Enojado", img: caraEnojado },
    { id: "competitivo", name: "Competitivo", img: caraCompetitivo },
    { id: "locos", name: "Locos", img: caraLocos },
    { id: "lentes", name: "Con Lentes", img: caraLentes },
  ];

  const accesorios = [
    { id: "none", name: "Sin accesorio", img: null },
    { id: "frio", name: "Frío", img: accFrio },
    { id: "fiesta", name: "Fiesta", img: accFiesta },
    { id: "corona", name: "Corona", img: accCorona },
    { id: "gorra", name: "Gorra", img: accGorra },
    { id: "elegante", name: "Elegante", img: accElegante },
    { id: "sombrero", name: "Sombrero", img: accSombrero },
  ];

  useEffect(() => {
    if (prefillRoom) setRoomCode(prefillRoom);
  }, [prefillRoom]);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !roomCode.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (roomCode.trim().length !== 5) {
      setError("El código de sala debe tener 5 caracteres");
      return;
    }
    setStep("character");
  };

  const handleJoinRoom = () => {
    if (!name.trim() || !roomCode.trim()) return;
    setStep("loading");
    setError("");
    const player = { 
      name: name.trim(), 
      room: roomCode.trim().toUpperCase(),
      character: character,
      isHost: false
    };
    socket.emit("join_room", player);
    socket.once("joined_room", (playerWithId) => {
      if (playerWithId.room) {
        localStorage.setItem('pixionary_room', playerWithId.room);
      }
      onJoin(playerWithId);
    });
  };

  const renderCharacterPreview = () => {
    const base = fruitBases.find(f => f.id === character.fruitType) || fruitBases[0];
    const cara = caras.find(c => c.id === character.cara) || caras[0];
    const accesorio = accesorios.find(a => a.id === character.accesorio) || accesorios[0];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 8 }}>
          {/* Fruta base - más grande */}
          <img 
            src={base.img} 
            alt={base.name} 
            style={{ 
              width: 140, 
              height: 140, 
              position: 'absolute',
              top: 0,
              left: 0
            }} 
          />
          {/* Cara superpuesta - punto medio */}
          <img 
            src={cara.img} 
            alt={cara.name} 
            style={{ 
              width: 60, 
              height: 60, 
              position: 'absolute',
              top: 55,
              left: 40
            }} 
          />
          {/* Accesorio superpuesto - punto medio */}
          {accesorio.img && (
            <img 
              src={accesorio.img} 
              alt={accesorio.name} 
              style={{ 
                width: 100, 
                height: 100, 
                position: 'absolute',
                top: -45,
                left: 20
              }} 
            />
          )}
        </div>
        <span style={{ color: '#2176ae', fontWeight: 'bold', fontSize: 18 }}>
          {base.name} {cara.name} {accesorio.name !== "Sin accesorio" ? accesorio.name : ""}
        </span>
      </div>
    );
  };

  if (step === "loading") {
    return (
      <div className="join-panel" style={{textAlign: 'center', margin: '0 auto'}}>
        <div className="join-character-preview" style={{fontSize: '3rem', marginBottom: 16}}>🚪</div>
        <h2 className="join-title" style={{marginBottom: 16}}>Uniéndote a la sala...</h2>
        <div style={{margin: '0 auto', width: 40, height: 40}}>
          <div style={{border: '6px solid #3a8dde', borderTop: '6px solid #fff', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite'}}></div>
        </div>
      </div>
    );
  }

  if (step === "character") {
    return (
      <div className="join-panel" style={{textAlign: 'center', margin: '0 auto'}}>
        <button
          onClick={() => setStep("join")}
          className="join-back"
        >
          ← Volver
        </button>
        <h2 className="join-title">¡Personaliza tu fruta!</h2>
        {renderCharacterPreview()}
        
        {/* Selector de base de fruta con miniaturas */}
        <div style={{marginBottom: 24}}>
          <span className="join-label">Elige tu fruta</span>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center'}}>
            {fruitBases.map((fruit) => (
              <button
                key={fruit.id}
                onClick={() => setCharacter(prev => ({ ...prev, fruitType: fruit.id }))}
                style={{
                  border: character.fruitType === fruit.id ? '3px solid #2176ae' : '2px solid #b3e0fc',
                  borderRadius: 12,
                  padding: 4,
                  background: character.fruitType === fruit.id ? '#e3f2fd' : '#fff',
                  boxShadow: character.fruitType === fruit.id ? '0 2px 8px #3a8dde33' : 'none',
                  transform: character.fruitType === fruit.id ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  outline: 'none',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={fruit.name}
              >
                <img src={fruit.img} alt={fruit.name} style={{ width: 36, height: 36 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Selector de cara */}
        <div style={{marginBottom: 24}}>
          <span className="join-label">Elige la cara</span>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center'}}>
            {caras.map((cara) => (
              <button
                key={cara.id}
                onClick={() => setCharacter(prev => ({ ...prev, cara: cara.id }))}
                style={{
                  border: character.cara === cara.id ? '3px solid #2176ae' : '2px solid #b3e0fc',
                  borderRadius: 12,
                  padding: 4,
                  background: character.cara === cara.id ? '#e3f2fd' : '#fff',
                  boxShadow: character.cara === cara.id ? '0 2px 8px #3a8dde33' : 'none',
                  transform: character.cara === cara.id ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  outline: 'none',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={cara.name}
              >
                <img src={cara.img} alt={cara.name} style={{ width: 36, height: 36 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Selector de accesorio */}
        <div style={{marginBottom: 32}}>
          <span className="join-label">Elige el accesorio</span>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center'}}>
            {accesorios.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setCharacter(prev => ({ ...prev, accesorio: acc.id }))}
                style={{
                  border: character.accesorio === acc.id ? '3px solid #2176ae' : '2px solid #b3e0fc',
                  borderRadius: 12,
                  padding: 4,
                  background: character.accesorio === acc.id ? '#e3f2fd' : '#fff',
                  boxShadow: character.accesorio === acc.id ? '0 2px 8px #3a8dde33' : 'none',
                  transform: character.accesorio === acc.id ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  outline: 'none',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={acc.name}
              >
                {acc.img ? (
                  <img src={acc.img} alt={acc.name} style={{ width: 36, height: 36 }} />
                ) : (
                  <span style={{ fontSize: 20, color: '#2176ae' }}>—</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleJoinRoom}
          className="join-btn"
          style={{marginTop: 12}}
        >
          🚪 Unirse a Sala
        </button>
      </div>
    );
  }

  return (
    <div className="join-panel" style={{textAlign: 'center', margin: '0 auto'}}>
      <button
        onClick={onBack}
        className="join-back"
      >
        ← Volver
      </button>
      <h2 className="join-title">Unirse a una sala</h2>
      {error && <div className="join-error">{error}</div>}
      <form onSubmit={handleJoinSubmit}>
        <label className="join-label" htmlFor="roomCode">Código de Sala</label>
          <input
            id="roomCode"
          className="join-input"
            type="text"
            value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
            maxLength={5}
          autoFocus
        />
        <label className="join-label" htmlFor="name">Tu Nombre</label>
        <input
          id="name"
          className="join-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={16}
        />
        <button type="submit" className="join-btn" style={{marginTop: 8}}>
          Siguiente
        </button>
      </form>
    </div>
  );
}

export default JoinRoom;
