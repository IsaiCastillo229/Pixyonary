import { io } from "socket.io-client";

const socket = io("https://pyxionary.onrender.com", {
  transports: ["websocket"],
  withCredentials: false
});

export default socket;