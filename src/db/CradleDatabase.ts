import { cradle_config } from "../config/cradle.config";
import cradle from "cradle";

class CradleDatabase {
  public cradle_database: cradle.Database | undefined;

  constructor(database_name: string) {
    this.connectToDatabase(database_name);
  }

  private async connectToDatabase(database_name: string) {
    console.log("Connecting cradle...");

    this.cradle_database = new (cradle.Connection)(cradle_config.HOST, cradle_config.PORT, {
      auth: { username: cradle_config.USER, password: cradle_config.PASSWORD }
    }).database(database_name);

    this.cradle_database.exists(function (err: any, exists: any) {
      if (err) {
        console.log('error', err);
      } else if (exists) {
        console.log('Database connection succesful!!');
      } else {
        console.log('Database not found!!');
      }
    });
  }
}

export default CradleDatabase;
