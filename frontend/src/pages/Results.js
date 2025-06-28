import React from "react";

function Results({ results, onPlayAgain, isHost }) {
  // Si no hay resultados, muestra un loader bonito
  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-orange-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🍓</div>
          <h2 className="text-2xl font-bold text-pink-600 mb-2">Cargando resultados...</h2>
        </div>
      </div>
    );
  }

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

  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const winner = sortedResults[0];

  // Pantalla para jugadores (no anfitrión)
  if (!isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-orange-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold text-pink-700 mb-2">¡El juego ha terminado!</h1>
          <p className="text-gray-600 text-lg mb-6">Mira la pantalla del anfitrión para conocer al ganador y la clasificación final.</p>
          <button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-200 shadow-md"
          >
            🏠 Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Pantalla para anfitrión
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-orange-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-2xl w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-pink-700 mb-2 flex items-center justify-center gap-2">
            <span className="text-5xl">🏆</span> Fin del Juego
          </h1>
          <p className="text-gray-500 text-lg">¡Gracias por jugar Pictionary de Frutas!</p>
        </div>
        {/* Ganador */}
        <div className="bg-gradient-to-r from-yellow-300 to-orange-400 rounded-2xl p-6 shadow-lg mb-8 text-center text-white">
          <div className="text-7xl mb-2 drop-shadow-lg">
            {fruitEmojis[winner.character?.fruitType] || "🍓"}
          </div>
          <h2 className="text-3xl font-bold mb-1">{winner.name}</h2>
          <div className="text-lg font-semibold mb-2">es el gran ganador</div>
          <div className="text-2xl font-bold">{winner.score} puntos</div>
        </div>
        {/* Tabla de posiciones */}
        <div className="bg-pink-50 rounded-2xl p-6 shadow mb-8">
          <h2 className="text-xl font-bold text-pink-700 mb-4 text-center">Clasificación Final</h2>
          <div className="space-y-2">
            {sortedResults.map((player, idx) => (
              <div
                key={player.name}
                className={`flex items-center gap-4 p-3 rounded-lg ${idx === 0 ? "bg-yellow-100 border-2 border-yellow-300" : "bg-white"}`}
              >
                <div className="text-xl font-bold text-gray-500 w-8 text-center">#{idx + 1}</div>
                <div className="text-3xl">{fruitEmojis[player.character?.fruitType] || "🍓"}</div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-gray-800">{player.name}</span>
                </div>
                <div className="text-lg font-bold text-pink-700">{player.score} pts</div>
              </div>
            ))}
          </div>
        </div>
        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-md"
          >
            🔄 Jugar de Nuevo
          </button>
          <button
            onClick={onPlayAgain}
            className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-200"
          >
            🏠 Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results; 