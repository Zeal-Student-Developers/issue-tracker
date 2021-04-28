const initializeServer = require("./loaders");

const PORT = 3000;

async function startServer() {
  try {
    const { server } = await initializeServer();
    server.listen(PORT, console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.log(`Server could not be started. Error: ${error.message}`);
  }
}

startServer();
