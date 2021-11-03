/*                db.js -- Database object configuration                  */

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database('database/proj.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
    console.log("connection to db successful");
});

module.exports = db;