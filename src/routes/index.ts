import { Application } from "express";

import homeRoutes from "./home.routes";
import TravellerRoutes from "./traveller/main.route";
import OutbreakRoutes from "./outbreak/main.route";

export default class Routes {
  constructor(app: Application) {
    app.use("/api", homeRoutes);
    app.use("/api/traveller", TravellerRoutes);
    app.use("/api/outbreak", OutbreakRoutes);
  }
}