require("dotenv").config();
const { Sequelize, Model, DataTypes } = require("sequelize");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");

const app = express();
const sequelize = new Sequelize({ dialect: "sqlite", storage: "db.sqlite" });

class User extends Model {}
User.init(
  {
    username: DataTypes.STRING,
  },
  { sequelize, modelName: "users" }
);
User.hasMany(ExerciseLog);

class ExerciseLog extends Model {}
ExerciseLog.init({
  user_id: DataTypes.INTEGER,
  description: DataTypes.STRING,
  duration: DataTypes.INTEGER,
  date: DataTypes.TIME,
});
ExerciseLog.belongsTo(User, { foreignKey: "user_id" });

sequelize.sync();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
