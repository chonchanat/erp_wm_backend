"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const express = require("express");
// const cors = require("cors");
// const bp = require("body-parser")
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var body_parser_1 = __importDefault(require("body-parser"));
var app = express_1.default();
app.use(cors_1.default());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    console.log("[" + new Date().toISOString() + "] " + req.method + " " + req.url);
    next();
});
app.get('/', function (req, res) {
    res.json({ message: "Hello World" });
});
var query = require("./model/customerModel");
app.get('/customer', query.getCustomerTable);
app.get('/customer/:id', query.getCustomerPerson);
app.listen(3001, function () {
    console.log('server is running on port : 3001');
});
