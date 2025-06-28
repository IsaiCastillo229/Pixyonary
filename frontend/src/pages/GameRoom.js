import React, { useState, useEffect } from "react";
import DrawingCanvas from "../components/DrawingCanvas";
import AnswerInput from "../components/AnswerInput";
import socket from "../socket";

function GameRoom({ player, players, activePlayers, isHost, room, turnInfo, secretWord: initialSecretWord, lastAnswerFeedback }) {
  // Estado para turnos
  const [turnOrder, setTurnOrder] = useState(turnInfo?.turnOrder || []); // [{id, name}]
  const [currentDrawer, setCurrentDrawer] = useState(turnInfo?.currentDrawer || null); // {id, name}
  const [turnIndex, setTurnIndex] = useState(turnInfo?.turnIndex || 0);
  const [turnDuration, setTurnDuration] = useState(turnInfo?.turnDuration || 60); // duración en segundos
  const [gameStarted, setGameStarted] = useState(!!turnInfo); // Si viene turnInfo, el juego ya empezó
  const [timeLeft, setTimeLeft] = useState(turnInfo?.turnDuration || 60); // tiempo restante local
  const [turnStart, setTurnStart] = useState(turnInfo?.turnStart || Date.now());
  const [secretWord, setSecretWord] = useState(initialSecretWord || "");
  // Mostrar feedback visual global (opcional)
  const [globalFeedback, setGlobalFeedback] = useState(null);
  // Estado para puntajes y mensajes de fin de turno
  const [scores, setScores] = useState([]);
  const [turnEndMessage, setTurnEndMessage] = useState("");
  const [playerList, setPlayerList] = useState(players || []);
  const [gameOver, setGameOver] = useState(false);
  const [finalScores, setFinalScores] = useState([]);

  // Fallback profesional para room
  const effectiveRoom = room || localStorage.getItem('pixionary_room');

  // Separar anfitrión y jugadores
  const host = playerList.find(p => p.isHost);

  // Determinar el rol del usuario
  const isHostPlayer = isHost; // El anfitrión (no juega)
  const isCurrentDrawer = currentDrawer && player && currentDrawer.id === player.id;
  const isGuesser = !isHostPlayer && !isCurrentDrawer;

  // Obtener puntaje propio (puedes ajustar según tu modelo de datos)
  const myScore = player?.score || 0;

  // Logs de depuración solo cuando cambian los valores relevantes
  useEffect(() => {
    console.log("[DEBUG][GameRoom] effectiveRoom:", effectiveRoom);
    console.log("[DEBUG][GameRoom] player:", player);
    console.log("[DEBUG][GameRoom] currentDrawer:", currentDrawer);
    console.log("[DEBUG][GameRoom] isHostPlayer:", isHostPlayer);
    console.log("[DEBUG][GameRoom] isCurrentDrawer:", isCurrentDrawer);
    console.log("[DEBUG][GameRoom] isGuesser:", isGuesser);
    if (effectiveRoom && player) {
      console.log(`[INFO][GameRoom] Jugador '${player.name}' (id: ${player.id}) está en la sala '${effectiveRoom}'`);
    }
  }, [effectiveRoom, player, currentDrawer, isHostPlayer, isCurrentDrawer, isGuesser]);

  useEffect(() => {
    if (gameStarted && effectiveRoom && player) {
      console.log(`[INFO][GameRoom] Jugador '${player.name}' sigue en la sala '${effectiveRoom}' tras iniciar el juego.`);
    }
  }, [gameStarted, effectiveRoom, player]);

  useEffect(() => {
    console.log("[DEBUG] GameRoom montado - socket.id:", socket.id, "player.id:", player.id);
  }, [player]);

  useEffect(() => {
    if (secretWord) {
      console.log("[DEBUG] Palabra secreta recibida por prop:", secretWord);
    }
  }, [secretWord]);

  // Manejar turn_info
  useEffect(() => {
    // Actualizar puntajes cuando llega feedback
    const handleAnswerFeedback = (data) => {
      if (data.scores) setScores(data.scores);
      if (data.correct && data.playerName) {
        setGlobalFeedback(`¡${data.playerName} adivinó correctamente!`);
        setTimeout(() => setGlobalFeedback(null), 2000);
      }
      if (data.allGuessed) {
        setTurnEndMessage("¡Todos adivinaron! Cambio de turno...");
        setTimeout(() => setTurnEndMessage(""), 2000);
      }
    };
    const handleUpdateScores = (data) => {
      if (data.scores) setScores(data.scores);
    };
    const handleTurnEnd = (data) => {
      if (data.reason === 'timeout') {
        setTurnEndMessage(`¡Tiempo agotado! La palabra era: ${data.word}`);
      } else if (data.reason === 'all_guessed') {
        setTurnEndMessage("¡Todos adivinaron! Cambio de turno...");
      }
      setTimeout(() => setTurnEndMessage(""), 2500);
    };
    const handlePlayerList = (list) => {
      setPlayerList(list);
    };
    // Manejar turn_info para actualizar todos los estados relevantes
    const handleTurnInfo = (data) => {
      setTurnOrder(data.turnOrder || []);
      setCurrentDrawer(data.currentDrawer || null);
      setTurnIndex(data.turnIndex || 0);
      setTurnDuration(data.turnDuration || 60);
      setTurnStart(data.turnStart || Date.now());
      setGameStarted(true);
      // Sincronizar cronómetro
      const elapsed = Math.floor((Date.now() - (data.turnStart || Date.now())) / 1000);
      setTimeLeft((data.turnDuration || 60) - elapsed);
      if (!(data.currentDrawer && player && data.currentDrawer.id === player.id)) {
        setSecretWord("");
      }
    };
    // Manejar your_word para el dibujante
    const handleYourWord = (word) => {
      console.log("[SOCKET] your_word recibido:", word);
      setSecretWord(word);
    };
    socket.on("answer_feedback", handleAnswerFeedback);
    socket.on("update_scores", handleUpdateScores);
    socket.on("turn_end", handleTurnEnd);
    socket.on("player_list", handlePlayerList);
    socket.on("turn_info", handleTurnInfo);
    socket.on("your_word", handleYourWord);
    socket.on("game_over", (data) => {
      setGameOver(true);
      setFinalScores(data.scores || []);
    });
    return () => {
      socket.off("answer_feedback", handleAnswerFeedback);
      socket.off("update_scores", handleUpdateScores);
      socket.off("turn_end", handleTurnEnd);
      socket.off("player_list", handlePlayerList);
      socket.off("turn_info", handleTurnInfo);
      socket.off("your_word", handleYourWord);
    };
  }, []);

  // Manejar temporizador local sincronizado
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, turnStart]);

  useEffect(() => {
    if (lastAnswerFeedback && lastAnswerFeedback.correct) {
      setGlobalFeedback(`¡${lastAnswerFeedback.playerName} adivinó correctamente!`);
      setTimeout(() => setGlobalFeedback(null), 2000);
    }
  }, [lastAnswerFeedback]);

  // Función para formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para renderizar el avatar personalizado
  function renderAvatar(character, size = 36) {
    if (!character) return null;
    
    const { base, face, accessory } = character;
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Base (fruta) */}
        {base && (
          <img
            src={`/assets/avatar/${base}.png`}
            alt={base}
            style={{
              width: size,
              height: size,
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1
            }}
          />
        )}
        
        {/* Cara */}
        {face && (
          <img
            src={`/assets/Caras/${face}.png`}
            alt={face}
            style={{
              width: size * 0.6,
              height: size * 0.6,
              position: 'absolute',
              top: size * 0.2,
              left: size * 0.2,
              zIndex: 2
            }}
          />
        )}
        
        {/* Accesorio */}
        {accessory && (
          <img
            src={`/assets/accesorios/${accessory}.png`}
            alt={accessory}
            style={{
              width: size * 0.8,
              height: size * 0.8,
              position: 'absolute',
              top: size * 0.1,
              left: size * 0.1,
              zIndex: 3
            }}
          />
        )}
      </div>
    );
  }

  if (gameOver) {
    const sortedScores = [...finalScores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];
    if (isHostPlayer) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-pink-200">
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
            <h1 className="text-4xl font-extrabold text-pink-700 mb-6">🏆 ¡Juego Terminado!</h1>
            <h2 className="text-2xl font-bold text-green-700 mb-4">Ganador: <span className="text-3xl">{winner.name}</span> 🥇</h2>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Puntajes finales:</h3>
            <table className="mx-auto mb-6">
              <thead>
                <tr>
                  <th className="px-6 py-2">Jugador</th>
                  <th className="px-6 py-2">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {sortedScores.map((p) => (
                  <tr key={p.id} className={p.id === winner.id ? "bg-yellow-100 font-bold" : ""}>
                    <td className="px-6 py-2">{p.name}</td>
                    <td className="px-6 py-2">{p.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-lg text-gray-500">¡Gracias por jugar Pixionary de Frutas!</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-pink-200">
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
            <h1 className="text-4xl font-extrabold text-pink-700 mb-6">🏆 ¡Juego Terminado!</h1>
            <h2 className="text-2xl font-bold text-green-700 mb-4">¡Gracias por jugar Pixionary de Frutas!</h2>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Puntajes finales:</h3>
            <table className="mx-auto mb-6">
              <thead>
                <tr>
                  <th className="px-6 py-2">Jugador</th>
                </tr>
              </thead>
              <tbody>
                {sortedScores.map((p) => (
                  <tr key={p.id} className={p.id === winner.id ? "bg-yellow-100 font-bold" : ""}>
                    <td className="px-6 py-2">{p.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  }

  if (!effectiveRoom) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300"><div className="text-center text-2xl text-blue-700 font-bold">Cargando sala...</div></div>;
  }

  return (
    <div className="lobby-bg" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div className="lobby-container" style={{maxWidth: 1400, width: '96vw', margin: '24px auto', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        {/* Panel superior compacto */}
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <div>
            <h1 className="lobby-title" style={{fontSize: '1.7rem', margin: 0}}>Pixionary</h1>
            <span className="lobby-desc" style={{fontSize: '1rem'}}>Sala: <b>{room}</b></span>
          </div>
          <div style={{textAlign: 'right'}}>
            <span className="lobby-player-status" style={{color: '#2176ae', fontWeight: 'bold', fontSize: '1.1rem'}}>⏰ {formatTime(timeLeft)}</span><br/>
            <span className="lobby-player-status" style={{color: '#3a8dde', fontSize: '1rem'}}>Dibujante: <b>{currentDrawer?.name}</b></span>
          </div>
        </div>
        {/* Layout principal: pizarrón central grande y jugadores a la derecha */}
        <div style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 32, marginTop: 12}}>
          {/* Panel de dibujo tipo pizarrón, central y grande */}
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
            {isGuesser ? (
              <div style={{width: '100%', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: window.innerWidth < 600 ? 0 : 24}}>
                <div style={{
                  background: '#fff',
                  border: '1.5px solid #bdbdbd',
                  borderRadius: 12,
                  padding: window.innerWidth < 600 ? '14px 4vw 10px 4vw' : '24px 18px 18px 18px',
                  boxShadow: '0 2px 8px rgba(58,141,222,0.10)',
                  width: '100%',
                  maxWidth: window.innerWidth < 600 ? '98vw' : 340,
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: window.innerWidth < 600 ? '1.1rem' : '1rem'
                }}>
                  <AnswerInput 
                    room={effectiveRoom}
                    isCurrentDrawer={isCurrentDrawer}
                    player={player}
                    lastAnswerFeedback={lastAnswerFeedback}
                    secretWord={secretWord}
                    turnIndex={turnIndex}
                  />
                </div>
              </div>
            ) : (
              <div style={{width: '100%', maxWidth: 900, margin: '0 auto', position: 'relative', overflow: 'visible', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: 'none', border: 'none', boxShadow: 'none', padding: 0}}>
                {/* Palabra secreta para el dibujante */}
                {isCurrentDrawer && secretWord && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      padding: '10px 24px',
                      background: '#e8f5e8',
                      border: '2px solid #4caf50',
                      borderRadius: 12,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#1b5e20',
                      fontSize: '1.2rem',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 8px #c8e6c9',
                    }}>
                      🎨 Tu palabra: {secretWord}
                    </div>
                  </div>
                )}
                {/* Canvas de dibujo - visible para dibujante y anfitrión */}
                <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <DrawingCanvas 
                    room={effectiveRoom} 
                    isCurrentDrawer={isCurrentDrawer} 
                    isHost={isHostPlayer}
                  />
                </div>
              </div>
            )}
          </div>
          {/* Lista de jugadores al costado derecho, angosta */}
          <div style={{width: 120, minWidth: 100, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', background: 'rgba(237,233,254,0.7)', borderRadius: 14, padding: '12px 4px', border: '2px solid #a18cd1', boxShadow: '0 2px 8px rgba(124,58,237,0.07)'}}>
            {playerList.map((p) => (
              <div key={p.id} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', borderRadius: 10, padding: '6px 2px', minWidth: 70}}>
                <span>{renderAvatar(p.character, 26)}</span>
                <span style={{fontWeight: 'bold', color: '#2176ae', fontSize: '0.9rem', marginTop: 1}}>{p.name}</span>
                <span style={{color: '#3a8dde', fontSize: '0.8rem'}}>Pts: {p.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Feedback global y mensajes de turno */}
        {globalFeedback && (
          <div className="lobby-panel" style={{background: '#fffbe6', border: '2px solid #ffe066', color: '#b8860b', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginTop: 16}}>
            {globalFeedback}
          </div>
        )}
        {turnEndMessage && (
          <div className="lobby-panel" style={{background: '#ffe6e6', border: '2px solid #ff6f61', color: '#b22222', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginTop: 16}}>
            {turnEndMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameRoom;
