'use strict';

const logger = require('./logger');
const net = require('net');
const faker = require('faker');

const app = net.createServer();
let clients = [];

const parseCommand = (message, socket) => {
  if (!message.startsWith('@')) {
    return false;
  }

  const parsedMessage = message.split(' ');
  const command = parsedMessage[0];
  logger.log(logger.INFO, 'parsing a command');

  switch (command) {
    case '@list': {
      // clients.map is O(n) space and O(n) time where n is the number of clients.
      const clientNames = clients.map(client => client.name).join('\n');
      socket.write(`${clientNames}\n`);
      break;
    }
    default:
      socket.write('invalid command');
      break;
  }
  return true;
};

const removeClient = socket => () => {
  clients = clients.filter(client => client !== socket);
  logger.log(logger.INFO, `removing ${socket.name}`);
};

app.on('connection', (socket) => {
  logger.log(logger.INFO, 'new socket');
  clients.push(socket);
  socket.write('Welcome to the chat!\n');
  socket.name = faker.internet.userName();
  socket.write(`Your name is ${socket.name}.\n`);

  socket.on('data', (data) => {
    const message = data.toString().trim();
    // Jennifer - data checks
    logger.log(logger.INFO, `Processing message: ${message}`);

    // Jennifer - check for commands
    if (parseCommand(message, socket)) {
      return;
    }

    // Jennifer - check for messages
    clients.forEach((client) => {
      if (client !== socket) {
        client.write(`${socket.name}: ${message}\n`);
      } // if
    }); // forEach
  }); // socket.on
  socket.on('close', removeClient(socket));
  socket.on('error', () => {
    logger.log(logger.ERROR, socket.name);
    // Jennifer - Vinicio says to do this extra execution
    // because removeClient returns a function. I don't understand it yet.
    removeClient(socket)();
  });
});

const server = module.exports = {};

server.start = () => {
  if (!process.env.PORT) {
    logger.log(logger.ERROR, 'missing PORT');
    throw new Error('missing PORT');
  }
  logger.log(logger.INFO, `Server is up on PORT ${process.env.PORT}`);

  // Jennifer - Node is expecting a port object, not just a number
  return app.listen({ port: process.env.PORT }, () => {});
};

server.stop = () => {
  logger.log(logger.INFO, 'Server is offline');
  return app.close(() => {});
};
