import { io } from "socket.io-client";

const socket = io("https://pyxionary.onrender.com", {
  withCredentials: false
});

export default socket;