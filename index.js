require("dotenv").config();
const { Sequelize, Model, DataTypes, Op } = require("sequelize");
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
  // To prevent database spamming, since using free deployment platform
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
  res.json({
    username: user.username,
    _id: user.id,
  });
});

app.get("/api/users", async (req, res) => {
  const users = await User.findAll();
  if (users === null) {
    return res.json({ error: "users is empty" });
  }

  const newUsers = users.map((user) => ({
    username: user.username,
    _id: user.id,
  }));

  res.json(newUsers);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findByPk(req.params._id);
  if (user === null) {
    return res.json({ error: "user not found" });
  }

  // To prevent database spamming, since using free deployment platform
  if ((await ExerciseLog.count({ where: { user_id: user.id } })) >= 5) {
    return res.json({ error: "limit reached" });
  }

  if (req.body.description === null || req.body.description === "") {
    return res.json({ error: "description is empty" });
  }

  if (req.body.duration === null || req.body.duration === "") {
    return res.json({ error: "duration is empty" });
  }

  const exerciseLog = await ExerciseLog.create({
    user_id: user.id,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date,
  });
  res.json({
    username: user.username,
    description: exerciseLog.description,
    duration: exerciseLog.duration,
    date: new Date(exerciseLog.date).toDateString(),
    _id: user.id,
  });
});

app.get("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findByPk(req.params._id);
  if (user === null) {
    return res.json({ error: "user not found" });
  }

  const exercises = await ExerciseLog.findAll({
    where: { user_id: user.id },
    order: [["date", "DESC"]],
  });
  const newExercises = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date),
  }));

  res.json({
    username: user.username,
    _id: user.id,
    exercises: newExercises,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findByPk(req.params._id);
  if (user === null) {
    return res.json({ error: "user not found" });
  }

  const logCount = await ExerciseLog.count({ where: { user_id: user.id } });
  if (logCount == 0) {
    return res.json({ error: "logs not found" });
  }

  const exerciseLogs = await ExerciseLog.findAll({
    where: {
      user_id: user.id,
      ...(from || to
        ? {
            date:
              from && to
                ? {
                    [Op.gte]: new Date(from),
                    [Op.lte]: new Date(to),
                  }
                : from
                ? { [Op.gte]: new Date(from) }
                : to
                ? { [Op.lte]: new Date(to) }
                : undefined,
          }
        : {}),
    },
    limit: limit ? parseInt(limit, 10) : 5,
    order: [["date", "DESC"]],
  });
  const newExerciseLogs = exerciseLogs.map((exerciseLog) => ({
    description: exerciseLog.description,
    duration: exerciseLog.duration,
    date: new Date(exerciseLog.date).toDateString(),
  }));

  res.json({
    username: user.username,
    count: logCount,
    _id: user.id,
    log: newExerciseLogs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
