import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const host = process.env.DB_HOST;
const name = process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

const db = new Sequelize(name, username, password, {
  host: host,
  dialect: "mysql",
  logging: false,
  timezone: '+07:00',
});

const testConnection = async () => {
  try {
    await db.authenticate();
    console.log("Database connected");
  } catch (error) {
    console.log("Error connecting to database", error);
  }
};

const query = async (query, value) => {
  try {
    const [rows] = await db.query(query, value);
    return rows;
  } catch (error) {
    console.log(error);
  }
};

export { testConnection, query };

export default db;
