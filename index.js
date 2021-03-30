const initializeServer = require("./loaders");

const PORT = 3000;

/** Starts the Express Server on port `PORT` */
async function startServer() {
  try {
    const { server } = await initializeServer();
    server.listen(PORT, console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.log(`Server could not be started: ${error.message}`);
  }
}

startServer();
