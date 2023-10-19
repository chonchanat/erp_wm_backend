import express, { Request, Response } from "express";
import cors from "cors";
import bp from "body-parser"
import customerRoutes from "./routes/customerRoutes";
import personRoutes from "./routes/personRoutes";
import addressRoutes from "./routes/addressRoutes";
import contactRoutes from "./routes/contactRoutes";
import relationRoutes from "./routes/relationRoutes";
import masterCodeRoutes from "./routes/masterCodeRoutes";
import fleetRoutes from "./routes/fleetRoutes";
import billingRoutes from "./routes/billingLocationRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import deviceSerialRoutes from "./routes/deviceSerialRoutes";

import handleError from "./middleware/handleError";

const app = express();

app.use(cors());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // ให้ทุกโดเมนสามารถเข้าถึงได้
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // กำหนด HTTP Methods ที่อนุญาต
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // กำหนด HTTP Headers ที่อนุญาต
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // อนุญาตให้ใช้ credentials (เช่น cookies)
    next();
});

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.use((req: Request, res: Response, next: () => void) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// route
app.get('/', (req, res) => {
    res.json({ message: "Hello World" })
})
app.use('/', customerRoutes);
app.use('/', personRoutes);
app.use('/', addressRoutes);
app.use('/', contactRoutes);
app.use('/', relationRoutes);
app.use('/', masterCodeRoutes);
app.use('/', fleetRoutes);
app.use('/', billingRoutes);
app.use('/', vehicleRoutes);
app.use('/', deviceSerialRoutes);

app.use(handleError.duplicateError);

const PORT = 3005
app.listen(PORT,() => {
    console.log('server is running on port : ' + PORT)
})