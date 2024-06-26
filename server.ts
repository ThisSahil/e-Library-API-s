import app from "./src/app";
import { config } from "./src/config/config";
import connectToDB from "./src/config/db";

const startServer = async () => {
  await connectToDB();
  const port = config.port || 3000;
  app.listen(port, () => {
    console.log(`Server started at port ${port}`);
  });
};

startServer();
