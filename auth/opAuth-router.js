const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = require("express").Router();

const Ops = require("../models/op-model");
const { isValid } = require("../middleware/auth-mw");
const configVars = require("../config/vars");

router.post("/register", (req, res) => {
  const credentials = req.body;

  if (isValid(credentials)) {
    const rounds = process.env.BCRYPT_ROUNDS || 12;

    const hash = bcryptjs.hashSync(credentials.password, rounds);

    credentials.password = hash;

    Ops.add(credentials)
      .then((op) => {
        res.status(201).json({ createdOperator: op });
      })
      .catch((err) => {
        console.log("you got an error", err.message);
        res.status(500).json({ message: err.message });
      });
  } else {
    res.status(400).json({
      message: "Please provide username and password!",
    });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (isValid(req.body)) {
    Ops.findBy({ username: username }).then(([operator]) => {
      if (operator && bcryptjs.compareSync(password, operator.password)) {
        const token = createToken(operator);

        res
          .status(200)
          .json({
            message: "Welcome to the FoodTruckTrakr App, Operator",
            token,
          });
      } else {
        res.status(401).json({ message: "invalid credentials" });
      }
    });
  } else {
    res.status(400).json({
      message: "Please provide username and password",
    });
  }
});

function createToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
  };

  const options = {
    expiresIn: "24h",
  };

  return jwt.sign(payload, configVars.jwtSecret, options);
}

module.exports = router;
