// Contains all CRUD operations

const db = require("../database/db");

    function findUser(email) {
       return new Promise((resolve, reject) => {
        const getUser = `SELECT * FROM users WHERE email="${email}"`;
            db.get(getUser, [], (err, user) => {
                if(err) console.log(err.message);
                resolve(user);
            });
       });
    }
       
    function insertUsers(name, email, user_id) {
        return new Promise((resolve, reject) => {
            const insertUser = `INSERT INTO users (name, email, user_id) VALUES(?,?,?)`;
              db.run(insertUser, [name, email, user_id], function (err) {
                    if (err) return console.error(err.message);
                    const rowID = this.lastID;
                    console.log("new row created: ", rowID);
                    resolve(rowID);
                });
        })
    }

    function updateRefreshToken(refresh_token, email) {
        const insertToken = `UPDATE users SET refresh_token = ? WHERE email = ?`;
        db.run(insertToken, [refresh_token, email], function (err) {
            if(err) return console.error("SQL error:", err.message);
            console.log("refresh token added");
        });
    }

    function updateAccessToken(access_token, email) {
        const insertToken = `UPDATE users SET access_token = ? WHERE email = ?`;
        db.run(insertToken, [access_token, email], function (err) {
            if(err) return console.error("SQL error:", err.message);
            console.log("access token added");
        });
    }

    function getAccessToken(user_id) {
        return new Promise((resolve, reject) => {
            const getToken = `SELECT access_token FROM users WHERE user_id="${user_id}"`; 
            db.get(getToken, [], (err, token) => {
                if(err) console.log(err.message);
                resolve(token);
            });
        })
    }


module.exports = {findUser, insertUsers, updateRefreshToken, updateAccessToken, getAccessToken}