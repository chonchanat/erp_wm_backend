import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import bp from "body-parser"
import customerRoutes from "./routes/customerRoutes";
import personRoutes from "./routes/personRoutes";
import addressRoutes from "./routes/addressRoutes";
import contactRoutes from "./routes/contactRoutes";
import masterCodeRoutes from "./routes/masterCodeRoutes";
import fleetRoutes from "./routes/fleetRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import deviceSerialRoutes from "./routes/deviceSerialRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import userAccountRoutes from "./routes/userAccountRoutes";
import cardRoutes from "./routes/cardRoutes";
import documentRoutes from "./routes/documentRoutes";
import packageRoutes from "./routes/packageRoutes";
import vehicleModelRoutes from "./routes/vehicleModelRoutes";

import handleError from "./middleware/handleError";

require('dotenv').config();
const app = express();
const PORT = 3005

app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // ให้ทุกโดเมนสามารถเข้าถึงได้
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // กำหนด HTTP Methods ที่อนุญาต
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // กำหนด HTTP Headers ที่อนุญาต
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // อนุญาตให้ใช้ credentials (เช่น cookies)
    next();
});

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] port:${PORT} ${req.method} ${req.url}`);
    next();
});

// route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: "Hello World" })
})
app.use('/', customerRoutes);
app.use('/', personRoutes);
app.use('/', addressRoutes);
app.use('/', contactRoutes);
app.use('/', masterCodeRoutes);
app.use('/', fleetRoutes);
app.use('/', vehicleRoutes);
app.use('/', deviceSerialRoutes);
app.use('/', deviceRoutes);
app.use('/', userAccountRoutes);
app.use('/', cardRoutes);
app.use('/', documentRoutes);
app.use('/', packageRoutes);
app.use('/', vehicleModelRoutes)

app.use(handleError.duplicateError);

app.all('*', (req: Request, res: Response) => {
    res.status(404).json({ status: 0, message: `Invalid url path: ${req.url}` })
})

app.listen(PORT,() => {
    console.log('server is running on port : ' + PORT)
})