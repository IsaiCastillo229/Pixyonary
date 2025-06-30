import { io } from "socket.io-client";
const socket = io("https://pyxionary.onrender.com"); // URL de tu backend en Render
export default socket;