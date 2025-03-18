require("dotenv").config();
const cors = require("cors");
const express = require("express");
const { Sequelize, Model, DataTypes } = require("sequelize");

const app = express();

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
