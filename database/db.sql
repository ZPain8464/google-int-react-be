/*
*   Run the following scripts to create table:
*   sqlite3 database/proj.db
*   .read database/db.sql
*/

CREATE TABLE IF NOT EXISTS users (
    name TEXT DEFAULT "", 
    email TEXT DEFAULT "", 
    user_id TEXT DEFAULT "", 
    access_token TEXT DEFAULT "", 
    refresh_token TEXT DEFAULT ""
);

