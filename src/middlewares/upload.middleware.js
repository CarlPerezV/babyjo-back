import multer from "multer";

// Guardamos el archivo en memoria (buffer), no en disco
const storage = multer.memoryStorage();

export const upload = multer({ storage });
