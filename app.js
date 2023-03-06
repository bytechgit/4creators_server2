import { createRequire } from "module";
import express from "express";
const app = express();
import { createServer } from "http";
const require = createRequire(import.meta.url);
const bodyParser = require("body-parser");
const logger = require("morgan");
import { IWebApp } from "./webapp.js";
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require('cors');
/////////////////////////////////////////////INITIALIZATION/////////////////////////////////////////
var port = process.env.PORT || "3000";
app.set("port", port);
var server = createServer(app);
server.listen(port, () => {
    console.log("server is running on port " + port);
});
server.on("error", () => {
    console.log("error");
});
server.on("listening", () => {
    console.log("slusa");
});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(cors({
    origin: '*'
}));
app.use(cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
})
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("/"));
IWebApp.init(app); //inicijalizacija web app
app.get("/", async (req, res) => {
    res.send("Hello1");
});
