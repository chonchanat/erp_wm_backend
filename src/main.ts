// const express = require("express");
// const cors = require("cors");
// const bp = require("body-parser")
import express, { Request, Response } from "express";
import cors from "cors";
import bp from "body-parser"
import customerRoutes from "./routes/customerRoutes";
import personRoutes from "./routes/personRoutes";
import addressRoutes from "./routes/addressRoutes";
import contactRoutes from "./routes/contactRoutes";
import relationRoutes from "./routes/relationRoutes";
import masterCodeRoutes from "./routes/masterCodeRoutes";
// const customerRouter = require("./routes/");
const app = express();

app.use(cors());
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.use((req: Request, res: Response, next: () => void) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.json({message: "Hello World"})
})

app.use('/', customerRoutes);
app.use('/', personRoutes);
app.use('/', addressRoutes);
app.use('/', contactRoutes);
app.use('/', relationRoutes);
app.use('/', masterCodeRoutes);

const PORT = 3005
app.listen(PORT, () => {
    console.log('server is running on port : ' + PORT)
})