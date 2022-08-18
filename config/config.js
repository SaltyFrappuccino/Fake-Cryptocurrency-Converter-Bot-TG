require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const { DB_NAME, DB_USER, DB_PASS, DB_HOST } = process.env;

const config = {
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  host: DB_HOST,
  dialect: "sqlite",
  "storage": "./database.sqlite3"
}

module.exports = {
  development: config,
  test: config,
  production: config,
};
