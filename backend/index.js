const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

// Configuración CORS solo para el frontend de Vercel
app.use(cors({
  origin: ["https://pixyonary.vercel.app"],
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://pixyonary.vercel.app"],
    methods: ["GET", "POST"]
  }
});

// Estado en memoria para salas y jugadores
const rooms = {};

// Pool de palabras variadas
const WORDS = [
  "manzana", "banana", "guitarra", "elefante", "pizza", "avión", "sandía", "lápiz", "perro", "gato",
  "hamburguesa", "bicicleta", "león", "cama", "pelota", "ratón", "camisa", "tigre", "helado", "zapato",
  "fresa", "nube", "sol", "luna", "árbol", "silla", "reloj", "taza", "conejo", "tortuga"
];

function shuffleArray(array) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // Crear sala
  socket.on('create_room', (hostData) => {
    const { room } = hostData;
    rooms[room] = {
      host: { id: socket.id }, // Solo guarda el id del host
      players: [],
      turnOrder: [], // array de ids
      turnIndex: 0,  // índice del turno actual
      currentDrawer: null, // id del dibujante actual
      gameStarted: false
    };
    socket.join(room);
    console.log(`[BACKEND] Host (admin) creó la sala ${room} con id de socket: ${socket.id}`);
    io.to(room).emit('player_list', rooms[room].players);
  });

  // Unirse a sala
  socket.on('join_room', (playerData) => {
    const { room, name, character } = playerData;
    if (!rooms[room]) return;

    // Eliminar cualquier jugador anterior con el mismo id o nombre
    rooms[room].players = rooms[room].players.filter(p => p.id !== socket.id && p.name !== name);

    const player = {
      id: socket.id,
      name,
      character,
      isHost: false,
      room
    };
    rooms[room].players.push(player);
    socket.join(room);
    console.log(`[BACKEND] join_room: ${name} (${socket.id}) se unió a la sala ${room}`);
    console.log(`[BACKEND] Clientes en la sala ${room}:`, Array.from(io.sockets.adapter.rooms.get(room) || []));
    // Emitir la lista completa y actualizada a todos los sockets de la sala
    io.to(room).emit('player_list', rooms[room].players);
    // Enviar el objeto jugador solo a este socket
    socket.emit('joined_room', player);
  });

  // Iniciar juego y turnos
  socket.on('start_game', (room, turnDuration = 60) => {
    console.log('Evento start_game recibido para sala:', room, 'duración:', turnDuration);
    if (!rooms[room]) {
      console.log('Sala no encontrada:', room);
      return;
    }
    console.log('Jugadores en la sala:', rooms[room].players);
    const playerIds = rooms[room].players.map(p => p.id);
    console.log('IDs de jugadores:', playerIds);
    const shuffled = shuffleArray([...playerIds]);
    console.log('Orden aleatorio:', shuffled);
    rooms[room].turnOrder = shuffled;
    rooms[room].turnIndex = 0;
    rooms[room].gameStarted = true;
    rooms[room].turnDuration = turnDuration; // duración en segundos
    rooms[room].turnTimer = null;
    const currentDrawerId = shuffled[0];
    rooms[room].currentDrawer = currentDrawerId;
    const drawer = rooms[room].players.find(p => p.id === currentDrawerId);
    console.log('Dibujante seleccionado:', drawer);
    // Selecciona palabra secreta
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    rooms[room].currentWord = word;
    // Reiniciar adivinadores correctos
    resetTurnState(room);
    // Envía la palabra solo al dibujante
    console.log(`[DEBUG] Enviando palabra '${word}' al dibujante: ${currentDrawerId}`);
    io.to(currentDrawerId).emit('your_word', word);
    const turnStart = Date.now();
    rooms[room].turnStart = turnStart;
    const turnInfo = {
      turnOrder: shuffled.map(id => {
        const p = rooms[room].players.find(pl => pl.id === id);
        return p ? { id: p.id, name: p.name } : null;
      }),
      currentDrawer: { id: drawer.id, name: drawer.name },
      turnIndex: 0,
      turnDuration: turnDuration,
      turnStart
    };
    console.log('Enviando turn_info:', turnInfo);
    console.log('Clientes en la sala:', io.sockets.adapter.rooms.get(room)?.size || 0);
    io.to(room).emit('turn_info', turnInfo);
    console.log('Evento turn_info enviado a la sala:', room);
    
    // Iniciar temporizador para el primer turno
    startTurnTimer(room, turnDuration);
  });

  // Función para iniciar temporizador de turno
  function startTurnTimer(room, duration) {
    if (rooms[room].turnTimer) {
      clearTimeout(rooms[room].turnTimer);
    }
    
    console.log(`Iniciando temporizador para sala ${room}, duración: ${duration}s`);
    
    rooms[room].turnTimer = setTimeout(() => {
      console.log(`Tiempo agotado para sala ${room}, cambiando turno`);
      io.to(room).emit('turn_end', { reason: 'timeout', word: rooms[room].currentWord });
      io.to(room).emit('player_list', rooms[room].players);
      io.sockets.emit('update_scores', { room, scores: rooms[room].players });
      io.to(room).emit('next_turn', room);
    }, duration * 1000);
  }

  // Extraer la lógica de cambio de turno a una función reutilizable
  function nextTurn(room) {
    if (!rooms[room] || !rooms[room].gameStarted) return;
    // Limpiar temporizador anterior
    if (rooms[room].turnTimer) {
      clearTimeout(rooms[room].turnTimer);
      rooms[room].turnTimer = null;
    }
    // Limpiar el canvas de todos los jugadores
    io.to(room).emit('clear_canvas');
    // Calcular si es la última ronda (solo una vuelta por jugador)
    const prevTurnIndex = rooms[room].turnIndex;
    rooms[room].turnIndex = (rooms[room].turnIndex + 1);
    // Si todos ya dibujaron (turnIndex >= turnOrder.length), termina el juego
    if (rooms[room].turnIndex >= rooms[room].turnOrder.length) {
      io.to(room).emit('game_over', {
        scores: rooms[room].players.map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
      });
      rooms[room].gameStarted = false;
      return;
    }
    const idx = rooms[room].turnIndex;
    const currentDrawerId = rooms[room].turnOrder[idx];
    rooms[room].currentDrawer = currentDrawerId;
    const drawer = rooms[room].players.find(p => p.id === currentDrawerId);
    // Selecciona palabra secreta
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    rooms[room].currentWord = word;
    // Reiniciar adivinadores correctos
    resetTurnState(room);
    // Envía la palabra solo al dibujante
    console.log(`[DEBUG] Enviando palabra '${word}' al dibujante (siguiente turno): ${currentDrawerId}`);
    io.to(currentDrawerId).emit('your_word', word);
    const turnStart = Date.now();
    rooms[room].turnStart = turnStart;
    const turnInfo = {
      turnOrder: rooms[room].turnOrder.map(id => {
        const p = rooms[room].players.find(pl => pl.id === id);
        return p ? { id: p.id, name: p.name } : null;
      }),
      currentDrawer: { id: drawer.id, name: drawer.name },
      turnIndex: idx,
      turnDuration: rooms[room].turnDuration,
      turnStart
    };
    console.log('Enviando turn_info (siguiente turno):', turnInfo);
    io.to(room).emit('turn_info', turnInfo);
    startTurnTimer(room, rooms[room].turnDuration);
  }

  // Siguiente turno
  socket.on('next_turn', (room) => {
    nextTurn(room);
  });

  // Sistema de dibujo en tiempo real
  socket.on('send_drawing', (data) => {
    const { room, x, y, type, color, isEraser } = data;
    if (!rooms[room] || !rooms[room].gameStarted) return;
    
    // Verificar que solo el dibujante actual pueda dibujar
    if (socket.id !== rooms[room].currentDrawer) {
      console.log('Intento de dibujo por no-dibujante:', socket.id);
      return;
    }
    
    console.log('Dibujo recibido de:', socket.id, 'en sala:', room);
    
    // Enviar el dibujo a todos los demás en la sala (incluyendo al anfitrión)
    socket.to(room).emit('receive_drawing', { x, y, type, color, isEraser });
  });

  // Limpiar canvas (nuevo turno)
  socket.on('clear_canvas', (room) => {
    if (!rooms[room] || !rooms[room].gameStarted) return;
    
    // Verificar que solo el dibujante actual pueda limpiar
    if (socket.id !== rooms[room].currentDrawer) return;
    
    console.log('Canvas limpiado por:', socket.id, 'en sala:', room);
    socket.to(room).emit('clear_canvas');
  });

  // Rellenar canvas
  socket.on('fill_canvas', (data) => {
    const { room, x, y, color } = data;
    if (!rooms[room] || !rooms[room].gameStarted) return;
    
    // Verificar que solo el dibujante actual pueda rellenar
    if (socket.id !== rooms[room].currentDrawer) return;
    
    console.log('Rellenado recibido de:', socket.id, 'en sala:', room);
    socket.to(room).emit('fill_canvas', { x, y, color });
  });

  // Sistema de respuestas
  socket.on('submit_answer', (data) => {
    const { room, answer, playerName } = data;
    if (!rooms[room] || !rooms[room].gameStarted) return;
    
    // Log de depuración: palabra guardada y respuesta recibida
    console.log(`[DEBUG] Palabra guardada en sala '${room}': '${rooms[room].currentWord}'`);
    console.log(`[DEBUG] Respuesta recibida: '${answer}' de ${playerName} (socket: ${socket.id})`);
    
    // Verificar que no sea el dibujante actual
    if (socket.id === rooms[room].currentDrawer) {
      console.log('Intento de respuesta por dibujante:', socket.id);
      return;
    }
    
    // Inicializar estructura de adivinadores correctos si no existe
    if (!rooms[room].correctGuessers) {
      rooms[room].correctGuessers = [];
    }

    // Si ya adivinó correctamente antes, ignorar
    if (rooms[room].correctGuessers.includes(socket.id)) {
      socket.emit('answer_feedback', { correct: false, message: 'Ya adivinaste correctamente.' });
      return;
    }

    // Comparación robusta (sin tildes, minúsculas, sin espacios)
    const correctWord = removeAccents((rooms[room].currentWord || '').trim().toLowerCase().replace(/\s+/g, ""));
    const userAnswer = removeAccents((answer || '').trim().toLowerCase().replace(/\s+/g, ""));
    console.log(`[DEBUG] Comparando respuesta normalizada: '${userAnswer}' vs '${correctWord}'`);
    const isCorrect = correctWord === userAnswer;

    if (isCorrect) {
      // Marcar como adivinador correcto
      rooms[room].correctGuessers.push(socket.id);
      // Sumar puntos según el orden de adivinanza
      const adivinador = rooms[room].players.find(p => p.id === socket.id);
      const dibujante = rooms[room].players.find(p => p.id === rooms[room].currentDrawer);
      if (adivinador) {
        // El primero en adivinar recibe 10, los siguientes 5
        const puntos = rooms[room].correctGuessers.length === 1 ? 10 : 5;
        adivinador.score = (adivinador.score || 0) + puntos;
      }
      // Feedback a todos (para actualizar puntajes y mostrar quién acertó)
      io.to(room).emit('answer_feedback', {
        correct: true,
        playerName,
        answer,
        scores: rooms[room].players.map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
      });
      // Si todos los adivinadores acertaron, pasar de turno y dar puntos al dibujante
      const totalGuessers = rooms[room].players.length - 1; // menos el dibujante
      if (rooms[room].correctGuessers.length >= totalGuessers) {
        if (dibujante) {
          dibujante.score = (dibujante.score || 0) + 10; // Puntos al dibujante si todos adivinan
        }
        // Detener el temporizador del turno
        if (rooms[room].turnTimer) {
          clearTimeout(rooms[room].turnTimer);
          rooms[room].turnTimer = null;
        }
        setTimeout(() => {
          io.to(room).emit('all_guessed', { word: rooms[room].currentWord });
          io.to(room).emit('answer_feedback', {
            correct: true,
            playerName: dibujante?.name,
            answer: rooms[room].currentWord,
            scores: rooms[room].players.map(p => ({ id: p.id, name: p.name, score: p.score || 0 })),
            allGuessed: true
          });
          io.to(room).emit('turn_end', { reason: 'all_guessed' });
          io.to(room).emit('player_list', rooms[room].players);
          io.sockets.emit('update_scores', { room, scores: rooms[room].players });
          nextTurn(room);
        }, 1500);
      }
    } else {
      // Feedback solo al jugador que responde
      socket.emit('answer_feedback', { correct: false, message: 'Ups, te equivocaste. Intenta de nuevo.' });
      // (Opcional) Notificar a todos que alguien intentó
      // io.to(room).emit('answer_submitted', { playerName, answer });
    }
  });

  // Al iniciar cada turno, reiniciar correctGuessers
  function resetTurnState(room) {
    rooms[room].correctGuessers = [];
  }

  // Salir de sala/desconexión
  socket.on('disconnect', () => {
    for (const room in rooms) {
      // Si es host, elimina la sala
      if (rooms[room].host.id === socket.id) {
        io.to(room).emit('room_closed');
        delete rooms[room];
        break;
      }
      // Si es jugador, lo elimina de la lista
      const idx = rooms[room].players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        const [removed] = rooms[room].players.splice(idx, 1);
        io.to(room).emit('player_list', rooms[room].players);
        io.to(room).emit('player_left', removed.id);
        break;
      }
    }
  });

  // Dejar sala manualmente
  socket.on('leave_room', (room) => {
    if (!rooms[room]) return;
    const idx = rooms[room].players.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      const [removed] = rooms[room].players.splice(idx, 1);
      io.to(room).emit('player_list', rooms[room].players);
      io.to(room).emit('player_left', removed.id);
    }
    socket.leave(room);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor Socket.IO escuchando en puerto ${PORT}`);
}); 