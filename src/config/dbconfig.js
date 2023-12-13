require('dotenv').config();

const devConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
}

module.exports = devConfig