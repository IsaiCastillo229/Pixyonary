import React, { useState } from "react";
import socket from "../socket";

function CreateRoom({ onCreate, onBack }) {
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    setLoading(true);
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    socket.emit("create_room", { room: roomCode });
    onCreate({ room: roomCode, isHost: true });
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4 animate-spin">🎨</div>
        <h2 className="text-3xl font-luckiest text-blue-700 mb-4">Creando tu sala...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-3xl font-luckiest text-blue-700 mb-6">Crea tu sala</h2>
      <button
        onClick={handleCreateRoom}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-luckiest py-4 px-8 rounded-2xl text-2xl transition-all duration-200 transform hover:scale-105 shadow-xl border-2 border-blue-300"
      >
        🎨 Generar Sala
      </button>
      <button
        onClick={onBack}
        className="mt-4 w-full bg-gray-300 text-blue-700 font-luckiest py-2 px-6 rounded-xl text-lg border-2 border-blue-200"
      >
        ← Volver
      </button>
    </div>
  );
}

export default CreateRoom;
