'use-strict'
const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  'develop_vidint',
  'root',
  'root',
  {
    host: 'localhost',
    dialect: 'mysql'
  }
);
// user: 'develop_videoin',
// password: 'n8cn0RBF3TpR',

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.attendee=require("./src/attendee.model")(sequelize,Sequelize);
db.clients=require("./src/clients.model")(sequelize,Sequelize);
db.interview_meets=require("./src/interview_meets.model")(sequelize,Sequelize);

module.exports = db;