import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`[babyjo-back] escuchando en http://${HOST}:${PORT}`);
    console.log(`[env] NODE_ENV=${process.env.NODE_ENV || "development"}`);
    if (process.env.CORS_ORIGIN) {
        console.log(`[cors] CORS_ORIGIN=${process.env.CORS_ORIGIN}`);
    }
});
