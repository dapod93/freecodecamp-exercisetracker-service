require("dotenv").config();
const { Sequelize, Model, DataTypes } = require("sequelize");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const express = require("express");

const app = express();
const sequelize = new Sequelize({ dialect: "sqlite", storage: "db.sqlite" });

class User extends Model {}
User.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize, modelName: "users" }
);

class ExerciseLog extends Model {}
ExerciseLog.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: User, key: "id" },
      onDelete: "CASCADE",
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  { sequelize, modelName: "exercise_logs" }
);

User.hasMany(ExerciseLog);
ExerciseLog.belongsTo(User, { foreignKey: "user_id" });

sequelize.sync();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  if ((await User.count()) >= 2) {
    return res.json({ error: "limit reached" });
  }

  const inputUsername = req.body.username.trim();
  if (inputUsername === null || inputUsername === "") {
    return res.json({ error: "invalid username" });
  }

  if ((await User.findOne({ where: { username: inputUsername } })) !== null) {
    return res.json({ error: "username already exists" });
  }

  const user = await User.create({ username: inputUsername });
  res.json({ username: user.username, _id: user.id });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  if ((await ExerciseLog.count()) >= 5) {
    return res.json({ error: "limit reached" });
  }

  const user = await User.findByPk(req.params.id);
  if (user === null) {
    return res.json({ error: "user not exists" });
  }

  if (req.body.description === null || req.body.description === "") {
    return res.json({ error: "description is empty" });
  }

  if (req.body.duration === null || req.body.duration === "") {
    return res.json({ error: "duration is empty" });
  }

  const exerciseLog = await ExerciseLog.create({ user_id: req.params.id, description: req.body.description, duration: req.body.duration, date: req.body.date });
  res.json({
    username: user.username,
    description: exerciseLog.description,
    duration: exerciseLog.duration,
    date: exerciseLog.date,
    _id: user.id,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
