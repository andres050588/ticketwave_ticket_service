import { Sequelize } from "sequelize"

const sequelize = new Sequelize(process.env.MYSQLDATABASE, process.env.MYSQLUSER, process.env.MYSQLPASSWORD, {
    host: process.env.MYSQLHOST,
    port: parseInt(process.env.MYSQLPORT, 10),
    dialect: "mysql",
    logging: false,
    dialectOptions: {
        connectTimeout: 10000
    }
})

export default sequelize
