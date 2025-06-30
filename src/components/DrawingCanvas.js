import React, { useRef, useEffect, useState } from "react";
import socket from "../socket";

const COLORS = ["#222", "#e53935", "#43a047", "#1e88e5", "#fbc02d", "#8e24aa"];

function DrawingCanvas({ room, isCurrentDrawer, isHost }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const drawing = useRef(false);
  const [canDraw, setCanDraw] = useState(false);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [color, setColor] = useState(COLORS[0]);
  const [isEraser, setIsEraser] = useState(false);
  const colorRef = useRef(color);
  const eraserRef = useRef(isEraser);

  useEffect(() => {
    function updateCanvasSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let width = Math.min(rect.width, window.innerWidth * 0.95);
        let height = width * (window.innerWidth < 600 ? 0.9 : 0.6);
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }
    }
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.border = "2px solid #333";
    canvas.style.borderRadius = "8px";
    canvas.style.backgroundColor = "white";

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = isEraser ? 18 : 3;
    context.strokeStyle = isEraser ? "#fff" : color;
    contextRef.current = context;

    // Escuchar dibujo de otros
    const handleReceiveDrawing = ({ x, y, type, color: remoteColor, isEraser: remoteEraser }) => {
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = remoteEraser ? "#fff" : (remoteColor || "#222");
      ctx.lineWidth = remoteEraser ? 18 : 3;
      if (type === "begin") {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };

    // Escuchar limpieza de canvas
    const handleClearCanvas = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Escuchar rellenado
    const handleFill = ({ x, y, color: fillColor }) => {
      floodFill(canvas, x, y, fillColor);
    };

    socket.on("receive_drawing", handleReceiveDrawing);
    socket.on("clear_canvas", handleClearCanvas);
    socket.on("fill_canvas", handleFill);

    return () => {
      socket.off("receive_drawing", handleReceiveDrawing);
      socket.off("clear_canvas", handleClearCanvas);
      socket.off("fill_canvas", handleFill);
    };
  }, [dimensions]);

  useEffect(() => {
    setCanDraw(isCurrentDrawer);
  }, [isCurrentDrawer]);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { eraserRef.current = isEraser; }, [isEraser]);

  const handleMouseDown = (e) => {
    if (!canDraw) return;
    drawing.current = true;
    contextRef.current.beginPath();
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.moveTo(offsetX, offsetY);
    socket.emit("send_drawing", { room, x: offsetX, y: offsetY, type: "begin", color: colorRef.current, isEraser: eraserRef.current });
  };

  const handleMouseMove = (e) => {
    if (!drawing.current || !canDraw) return;
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.strokeStyle = eraserRef.current ? "#fff" : colorRef.current;
    contextRef.current.lineWidth = eraserRef.current ? 18 : 3;
    contextRef.current.stroke();
    socket.emit("send_drawing", { room, x: offsetX, y: offsetY, type: "draw", color: colorRef.current, isEraser: eraserRef.current });
  };

  const handleMouseUp = () => {
    drawing.current = false;
  };

  // Herramienta de rellenar
  const handleFill = (e) => {
    if (!canDraw) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.nativeEvent.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.nativeEvent.clientY - rect.top) * (canvas.height / rect.height));
    floodFill(canvas, x, y, color);
    socket.emit("fill_canvas", { room, x, y, color });
  };

  // Algoritmo de flood fill (relleno)
  function floodFill(canvas, x, y, fillColor) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const targetColor = getPixel(data, x, y, canvas.width);
    const fillRgba = hexToRgba(fillColor);
    if (colorsMatch(targetColor, fillRgba)) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const idx = (cy * canvas.width + cx) * 4;
      if (colorsMatch(getPixel(data, cx, cy, canvas.width), targetColor)) {
        setPixel(data, cx, cy, fillRgba, canvas.width);
        if (cx > 0) stack.push([cx - 1, cy]);
        if (cx < canvas.width - 1) stack.push([cx + 1, cy]);
        if (cy > 0) stack.push([cx, cy - 1]);
        if (cy < canvas.height - 1) stack.push([cx, cy + 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
  function getPixel(data, x, y, w) {
    const idx = (y * w + x) * 4;
    return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
  }
  function setPixel(data, x, y, [r,g,b,a], canvasWidth) {
    const idx = (y * canvasWidth + x) * 4;
    data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = a;
  }
  function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function hexToRgba(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16), 255];
  }

  // Touch events para móvil
  const handleTouchStart = (e) => {
    if (!canDraw) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    drawing.current = true;
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    socket.emit("send_drawing", { room, x, y, type: "begin", color: colorRef.current, isEraser: eraserRef.current });
  };
  const handleTouchMove = (e) => {
    if (!drawing.current || !canDraw) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    contextRef.current.lineTo(x, y);
    contextRef.current.strokeStyle = eraserRef.current ? "#fff" : colorRef.current;
    contextRef.current.lineWidth = eraserRef.current ? 18 : 3;
    contextRef.current.stroke();
    socket.emit("send_drawing", { room, x, y, type: "draw", color: colorRef.current, isEraser: eraserRef.current });
  };
  const handleTouchEnd = () => {
    drawing.current = false;
  };

  // Limpia el canvas cuando cambia el turno (solo anfitrión)
  useEffect(() => {
    if (isHost) {
      socket.on("clear_canvas", () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
      });
      return () => socket.off("clear_canvas");
    }
  }, [isHost]);

  return (
    <div ref={containerRef} style={{width: '100%', height: '100%', maxWidth: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: window.innerWidth < 600 ? 12 : 0}}>
      <div className="mb-4">
        {canDraw ? null : (
          <p className="text-gray-600">⏳ Esperando que dibujen...</p>
        )}
      </div>
      
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={canDraw ? handleFill : undefined}
        style={{
          cursor: canDraw ? (isEraser ? 'cell' : 'crosshair') : 'default',
          opacity: canDraw ? 1 : 0.8,
          width: '100%',
          height: 'auto',
          maxWidth: '100vw',
          maxHeight: window.innerWidth < 600 ? '80vw' : '70vw',
          borderRadius: '18px',
          border: 'none',
          background: 'white',
          boxShadow: '0 2px 8px #bdbdbd',
          touchAction: 'none',
        }}
      />
      {/* Herramientas de dibujo */}
      {canDraw && (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap'}}>
          {/* Goma */}
          <button
            onClick={() => setIsEraser(e => !e)}
            style={{
              background: isEraser ? '#ffd600' : '#eee',
              border: '2px solid #bdbdbd',
              borderRadius: '50%',
              width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
              boxShadow: isEraser ? '0 0 8px #ffd600' : 'none',
              outline: 'none',
            }}
            title="Goma de borrar"
          >
            🧽
          </button>
          {/* Colores */}
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false); }}
              style={{
                background: c,
                border: color === c && !isEraser ? '3px solid #222' : '2px solid #bdbdbd',
                borderRadius: '50%',
                width: 32, height: 32,
                margin: '0 2px',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: color === c && !isEraser ? '0 0 8px #222' : 'none',
              }}
              title={c}
            />
          ))}
          {/* Rellenar */}
          <button
            onClick={() => setIsEraser(false)}
            style={{
              background: '#e0f7fa',
              border: '2px solid #26c6da',
              borderRadius: '50%',
              width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
              marginLeft: 6,
              outline: 'none',
            }}
            title="Rellenar (doble click o doble tap en el área a rellenar)"
            onDoubleClick={handleFill}
          >
            🪣
          </button>
        </div>
      )}
    </div>
  );
}

export default DrawingCanvas;
