const LocalSession = require("telegraf-session-local");

const session = new LocalSession({ database: "session.json" });

module.exports = session;
