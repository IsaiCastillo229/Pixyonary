import React, { useState, useEffect } from "react";
import socket from "../socket";

function AnswerInput({ room, isCurrentDrawer, player, lastAnswerFeedback, secretWord, turnIndex }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // DEPURACIÓN PROFUNDA
  useEffect(() => {
    console.log("[DEBUG][AnswerInput] player:", player);
    console.log("[DEBUG][AnswerInput] isCurrentDrawer:", isCurrentDrawer);
    console.log("[DEBUG][AnswerInput] secretWord:", secretWord);
    console.log("[DEBUG][AnswerInput] room:", room);
  }, [player, isCurrentDrawer, secretWord, room]);

  useEffect(() => {
    if (secretWord) {
      console.log(`[DEBUG][FRONT] Palabra secreta (prop secretWord): '${secretWord}'`);
    }
  }, [secretWord]);

  useEffect(() => {
    if (lastAnswerFeedback && lastAnswerFeedback.playerName === player.name) {
      if (lastAnswerFeedback.correct) {
        setFeedback("¡Respuesta correcta!");
        setSubmitted(true);
      } else {
        setFeedback(lastAnswerFeedback.message || "Ups, te equivocaste. Intenta de nuevo.");
        setSubmitted(false);
      }
    }
  }, [lastAnswerFeedback, player.name]);

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
    setFeedback(null);
  }, [secretWord]);

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
    setFeedback(null);
  }, [turnIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim() || isCurrentDrawer || submitted) return;
    console.log(`[DEBUG][FRONT] Enviando respuesta: '${answer.trim()}' para la sala: ${room}`);
    socket.emit("submit_answer", { room, answer: answer.trim(), playerName: player.name });
    setAnswer("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setAnswer(e.target.value);
    setFeedback(null);
  };

  if (isCurrentDrawer) {
    return null;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      border: '2px solid #64b5f6',
      borderRadius: 16,
      padding: '20px',
      boxShadow: '0 4px 16px rgba(100, 181, 246, 0.15)'
    }}>
      <h3 style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#1565c0', marginBottom: 16, textAlign: 'center', margin: '0 0 16px 0'}}>💭 ¿Qué están dibujando?</h3>
      {feedback && (
        <div style={{
          marginBottom: 16,
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1rem',
          padding: '8px 12px',
          borderRadius: 8,
          background: feedback.includes('correcta') ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          color: feedback.includes('correcta') ? '#2e7d32' : '#d32f2f',
          border: `1px solid ${feedback.includes('correcta') ? '#4caf50' : '#f44336'}`
        }}>
          {feedback}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <div>
          <input
            type="text"
            value={answer}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu respuesta aquí..."
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e3f2fd',
              borderRadius: 12,
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2196f3';
              e.target.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e3f2fd';
              e.target.style.boxShadow = 'none';
            }}
            maxLength={50}
            disabled={submitted}
          />
        </div>
        <button
          type="submit"
          disabled={!answer.trim() || submitted}
          style={{
            width: '100%',
            background: !answer.trim() || submitted ? '#e0e0e0' : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 12,
            fontWeight: 'bold',
            fontSize: '1rem',
            border: 'none',
            cursor: !answer.trim() || submitted ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: !answer.trim() || submitted ? 'none' : '0 4px 12px rgba(33, 150, 243, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!(!answer.trim() || submitted)) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!(!answer.trim() || submitted)) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
            }
          }}
        >
          🎯 Enviar Respuesta
        </button>
      </form>
      <div style={{marginTop: 16, textAlign: 'center'}}>
        <p style={{color: '#1976d2', fontSize: '0.9rem', margin: 0, fontStyle: 'italic'}}>💡 Pista: Piensa en frutas y vegetales</p>
      </div>
    </div>
  );
}

export default AnswerInput; 