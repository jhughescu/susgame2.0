let socket;

export const initSocket = () => {
  socket = io();
  return socket;
};

export const getSocket = () => socket;
