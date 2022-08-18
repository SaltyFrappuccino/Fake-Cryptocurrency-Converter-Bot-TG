const sequelizePaginate = require("sequelize-paginate");
const { sequelize, Sequelize } = require("./models");

const userModel = require("./models/user");

const models = {
  User: userModel(sequelize, Sequelize.DataTypes),
};

Object.values(models).map((v) => sequelizePaginate.paginate(v));

module.exports = { sequelize, Sequelize, ...models };
