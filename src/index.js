import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config();

connectDB()
  // We will start the server only when DB is connected
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Listening on ${process.env.PORT}`);
    });
  })
  .catch((error)=>{
    console.log('MongoDB connected server not started', error);
  });
