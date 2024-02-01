import { Sequelize } from "sequelize-typescript";
import { config, dialect } from "../config/db.config";
import CradleDatabase from "./CradleDatabase";
import cradle from "cradle";
import { cradle_config } from "../config/cradle.config";

class Database {
  public sequelize: Sequelize | undefined;
  public CradleDatabaseInstance: CradleDatabase | undefined;
  public couch_database: cradle.Database | undefined;

  constructor() {
    // this.CradleDatabaseInstance = new CradleDatabase(cradle_config.DATABASE);
    // this.connectToDatabase();
  }

  private async connectToDatabase() {
    this.sequelize = new Sequelize({
      database: config.DB,
      username: config.USER,
      password: config.PASSWORD,
      host: config.HOST,
      dialect: dialect,
      pool: {
        max: config.pool.max,
        min: config.pool.min,
        acquire: config.pool.acquire,
        idle: config.pool.idle
      },
      models: []
    });

    await this.sequelize
      .authenticate()
      .then(() => {
        console.log("Database: Authenticated");
      })
      .catch((err) => {
        console.error("Database: Authentication failed!", err);
      });
  }
}

export default Database;
