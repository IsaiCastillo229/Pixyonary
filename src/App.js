import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import HostWaitingRoom from "./pages/HostWaitingRoom";
import PlayerWaitingRoom from "./pages/PlayerWaitingRoom";
import GameRoom from "./pages/GameRoom";
import Results from "./pages/Results";
import socket from "./socket";

function getRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || "";
}

function App() {
  // Recuperar room de localStorage si existe
  const initialRoom = localStorage.getItem('pixionary_room') || null;
  const [gameState, setGameState] = useState({
    stage: "home", // home, host-waiting, player-waiting, game, results
    player: null,
    room: initialRoom,
    players: [],
    isHost: false,
    joinRoomPrefill: getRoomFromUrl(),
    turnInfo: null, // <-- nuevo campo para datos de turno
    secretWord: null, // <-- palabra secreta recibida
    lastAnswerFeedback: null // <-- nuevo campo para feedback de respuesta
  });

  // Nuevo estado para feedback de inicio
  const [waitingForTurnInfo, setWaitingForTurnInfo] = useState(false);

  useEffect(() => {
    // Socket event listeners
    const handlePlayerList = (players) => {
      setGameState(prev => ({ ...prev, players: players || [] }));
    };
    socket.on("player_list", handlePlayerList);

    socket.on("game_started", () => {
      setGameState(prev => ({ ...prev, stage: "game" }));
    });

    socket.on("game_ended", (results) => {
      setGameState(prev => ({ ...prev, stage: "results", results }));
    });

    socket.on("player_left", (playerId) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== playerId && !p.isHost)
      }));
    });

    // Escuchar palabra secreta
    const handleYourWord = (word) => {
      setGameState(prev => ({ ...prev, secretWord: word }));
    };
    socket.on("your_word", handleYourWord);

    // Limpiar palabra secreta al cambiar de turno
    const handleTurnInfo = (turnInfo) => {
      setGameState(prev => ({
        ...prev,
        stage: "game",
        turnInfo
      }));
      // Log de depuración SOLO al recibir turn_info (inicio de juego)
      console.log("[DEBUG][App] gameState.room (al recibir turn_info):", gameState.room);
    };
    socket.on("turn_info", handleTurnInfo);

    // Escuchar feedback de respuestas
    const handleAnswerFeedback = (data) => {
      // Actualizar puntajes si vienen en el feedback
      if (data.scores) {
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => {
            const updated = data.scores.find(s => s.id === p.id);
            return updated ? { ...p, score: updated.score } : p;
          })
        }));
      }
      // Guardar feedback para mostrarlo en la UI (opcional, puedes propagarlo a GameRoom)
      setGameState(prev => ({ ...prev, lastAnswerFeedback: data }));
    };
    socket.on("answer_feedback", handleAnswerFeedback);

    return () => {
      socket.off("player_list", handlePlayerList);
      socket.off("game_started");
      socket.off("game_ended");
      socket.off("player_left");
      socket.off("your_word", handleYourWord);
      socket.off("turn_info", handleTurnInfo);
      socket.off("answer_feedback", handleAnswerFeedback);
    };
  }, []);

  const handleCreateRoom = (roomData) => {
    localStorage.setItem('pixionary_room', roomData.room);
    setGameState({
      stage: "host-waiting",
      player: {
        id: socket.id,
        name: "Anfitrión",
        isHost: true
      },
      room: roomData.room,
      players: [],
      isHost: true,
      joinRoomPrefill: ""
    });
  };

  const handleJoinRoom = (playerData) => {
    localStorage.setItem('pixionary_room', playerData.room);
    setGameState({
      stage: "player-waiting",
      player: playerData,
      room: playerData.room,
      players: [],
      isHost: false,
      joinRoomPrefill: ""
    });
  };

  // Modificar handleStartGame para activar el feedback
  const handleStartGame = () => {
    socket.emit("start_game", gameState.room);
    setWaitingForTurnInfo(true);
  };

  // Cuando llega turn_info, desactivar el feedback
  useEffect(() => {
    if (gameState.turnInfo) {
      setWaitingForTurnInfo(false);
    }
  }, [gameState.turnInfo]);

  const handleBackToHome = () => {
    socket.emit("leave_room", gameState.room);
    localStorage.removeItem('pixionary_room');
    setGameState({
      stage: "home",
      player: null,
      room: null,
      players: [],
      isHost: false,
      joinRoomPrefill: getRoomFromUrl()
    });
  };

  // Obtener solo los jugadores (excluyendo al anfitrión)
  const getActivePlayers = () => {
    return gameState.players.filter(p => !p.isHost);
  };

  // Manejo de navegación automática a GameRoom
  const handleGameStart = (turnInfo) => {
    setGameState(prev => ({
      ...prev,
      stage: "game",
      turnInfo // guarda los datos de turn_info
    }));
  };

  // Feedback visual en las pantallas de espera
  const renderCurrentStage = () => {
    if (waitingForTurnInfo && (gameState.stage === "host-waiting" || gameState.stage === "player-waiting")) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">🎮</div>
            <h2 className="text-3xl font-luckiest text-blue-700 mb-4">Preparando el juego...</h2>
            <p className="text-blue-500 text-lg">Espera un momento, el juego está por comenzar.</p>
          </div>
        </div>
      );
    }
    switch (gameState.stage) {
      case "home":
        return <Home onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} joinRoomPrefill={gameState.joinRoomPrefill} />;
      
      case "host-waiting":
  return (
          <HostWaitingRoom
            room={gameState.room}
            players={gameState.players}
            activePlayers={getActivePlayers()}
            host={gameState.player}
            onStartGame={handleStartGame}
            onBackToHome={handleBackToHome}
            onGameStart={handleGameStart} // <-- pasa la prop
          />
        );
      
      case "player-waiting":
        return (
          <PlayerWaitingRoom
            room={gameState.room}
            players={gameState.players}
            activePlayers={getActivePlayers()}
            player={gameState.player}
            onBackToHome={handleBackToHome}
            onGameStart={handleGameStart} // <-- pasa la prop
          />
        );
      
      case "game":
        return (
          <GameRoom
            player={gameState.player}
            players={gameState.players}
            activePlayers={getActivePlayers()}
            isHost={gameState.isHost}
            room={gameState.room}
            turnInfo={gameState.turnInfo} // <-- pasa los datos de turno
            secretWord={gameState.secretWord} // <-- pasa la palabra secreta
            lastAnswerFeedback={gameState.lastAnswerFeedback} // <-- pasa el feedback de respuesta
          />
        );
      
      case "results":
        return (
          <Results
            results={gameState.results}
            onPlayAgain={handleBackToHome}
            isHost={gameState.isHost}
          />
        );
      
      default:
        return <Home onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} joinRoomPrefill={gameState.joinRoomPrefill} />;
    }
  };

  // Sincronización automática de room con localStorage
  useEffect(() => {
    if (!gameState.room) {
      const localRoom = localStorage.getItem('pixionary_room');
      if (localRoom) {
        setGameState(prev => ({ ...prev, room: localRoom }));
      }
    }
  }, [gameState.room]);

  // Sincroniza localStorage con el estado global
  useEffect(() => {
    if (gameState.room) {
      localStorage.setItem('pixionary_room', gameState.room);
    }
  }, [gameState.room]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-orange-100">
      {renderCurrentStage()}
    </div>
  );
}

export default App;
