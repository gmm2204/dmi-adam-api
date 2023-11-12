import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import Database from "../../db/database";
import * as RoutesData from '../../data/traveller/routes.json';
import { config } from "../../config/db.config";
import { Traveller } from "../../models/traveller/Traveller.model";
import { IDRoute } from "../../models/IDRoute.model";
import * as fs from 'fs';
import * as path from 'path';
import {TravellerCheckUp} from "../../models/checkup/Checkup.model";

interface IMainRepository {
    readPostData(req: Request): Promise<any[]>;
}

class MainRepository implements IMainRepository {
    db = new Database(config.DB);
    private retrievedData: any;

    async readPostData(req: Request): Promise<any[]> {
        let url = req.url;
        let TargetRoute: IDRoute = new IDRoute("", "");
        let TravellerInstance = new Traveller(req.body["_id"], req.body["_identity_type"], req.body["_identity_number"], req.body["doc"]);
        let CheckupInstance = new TravellerCheckUp(req.body["_id"], req.body["_traveller_id"], req.body["doc"]);


        //#region Seek target route
        for (let i = 0; i < RoutesData.routes.length; i++) {
            if (RoutesData.routes[i].url == url) {
                TargetRoute = new IDRoute(
                    RoutesData.routes[i].title,
                    RoutesData.routes[i].url);
                break;
            }
        }
        //#endregion

        switch (req.url) {
            case "/create":
                return await this.createInstance(TargetRoute, TravellerInstance);

            case "/update":
                return await this.updateInstance(TargetRoute, TravellerInstance);

            case "/acquire/instance":
                return await this.acquireInstance(TargetRoute, TravellerInstance);

            case "/acquire/composite":
                return await this.acquireComposite(TargetRoute);

            // checkup
            case "/checkup/instance":
                return await this.getCheckup(TargetRoute, CheckupInstance);

            case "/create-checkup":
                return await this.createCheckup(TargetRoute, CheckupInstance);

            case "/update-checkup":
                return await this.updateCheckup(TargetRoute, CheckupInstance);

            //followup
            case "/create-followup":
                return await this.createFollowup(TargetRoute, CheckupInstance);

            case "/get-followup":
                return await this.getFollowup(TargetRoute, CheckupInstance);

            default:
                return await this.executeQuery(TargetRoute);
        }
    }

    async executeQuery(RouteInstance: IDRoute): Promise<any[]> {
        this.retrievedData = [{
            "result": -1,
            "message": "Error --> " + RouteInstance.url + " --> Unknown"
        }];

        return this.retrievedData;
    }

    async createInstance(RouteInstance: IDRoute, TravellerInstance: Traveller): Promise<any[]> {
        if ((TravellerInstance._identity_type != "") && (TravellerInstance._identity_number != "")) {
            try {
                this.retrievedData = await this.db.sequelize?.query(
                    `INSERT INTO "public"."travellers" 
                ("_identity_type", "_identity_number", "doc") VALUES 
                ('` + TravellerInstance._identity_type + `', '` + TravellerInstance._identity_number + `', '` + JSON.stringify(TravellerInstance.doc) + `');`
                );

                this.retrievedData[0] = {
                    "result": 1
                };

                console.log("-->", this.retrievedData);
            } catch (error) {
                this.retrievedData = [{
                    "result": -1,
                    "message": "Error --> " + RouteInstance.url + " --> " + error
                }];
            }
        } else {
            this.retrievedData = [{
                "result": -1,
                "message": "Error --> Blank data"
            }];
        }

        return this.retrievedData;
    }

    async updateInstance(RouteInstance: IDRoute, TravellerInstance: Traveller): Promise<any[]> {
        try {
            this.retrievedData = await this.db.sequelize?.query(
                `UPDATE "public"."travellers"
                    SET "doc" = '`+ JSON.stringify(TravellerInstance.doc) + `'
                    WHERE("public"."travellers"."_id" = `+ TravellerInstance._id + `);`
            );

            this.retrievedData[0] = {
                "result": 1
            };

        } catch (error) {
            this.retrievedData = [{
                "result": -1,
                "message": "Error --> " + RouteInstance.url + " --> " + error
            }];
        }

        return this.retrievedData;
    }

    async acquireInstance(RouteInstance: IDRoute, TravellerInstance: Traveller): Promise<any[]> {
        try {
            this.retrievedData = await this.db.sequelize?.query(
                `SELECT * FROM "public"."travellers"
                WHERE "_id" = ` + TravellerInstance._id + `;`
            );
        } catch (error) {
            this.retrievedData = [{
                "message": "Error --> " + RouteInstance.url + " --> " + error
            }];
        }

        return this.retrievedData[0];
    }

    async acquireComposite(RouteInstance: IDRoute): Promise<any[]> {
        try {
            this.retrievedData = await this.db.sequelize?.query(
                `SELECT * FROM "public"."travellers";`
            );
        } catch (error) {
            this.retrievedData = [{
                "message": "Error --> " + RouteInstance.url + " --> " + error
            }];
        }

        return this.retrievedData[0];
    }

    async createCheckup(RouteInstance: IDRoute, CheckupInstance: TravellerCheckUp): Promise<any[]> {
        if (CheckupInstance._traveller_id != "") {
            try {

                console.log(CheckupInstance._traveller_id)
                // check if user exists
                const traveller: any = await this.db.sequelize?.query(
                    `SELECT * FROM "public"."travellers" WHERE "_id" = :travellerId;`,
                    {
                        replacements: { travellerId: CheckupInstance._traveller_id },
                        type: QueryTypes.SELECT,
                    }
                );

                if (traveller && traveller.length === 0) {
                    this.retrievedData = [{
                        "result": -1,
                        "message": "Traveller not found"
                    }];
                } else {
                    this.retrievedData = await this.db.sequelize?.query(
                        `INSERT INTO public.traveller_check_ups
                    (_traveller_Id, doc) VALUES
                    ('${CheckupInstance._traveller_id}', '${JSON.stringify(CheckupInstance.doc)}')
                    RETURNING _id;`
                    );

                    const insertedId = this.retrievedData[0][0]._id;
                    this.retrievedData[0] = {
                        result: insertedId,
                    };

                    console.log("-->", this.retrievedData);
                }
            } catch (error) {
                this.retrievedData = [{
                    "result": -1,
                    "message": "Error --> " + RouteInstance.url + " --> " + error
                }];
            }
        } else {
            this.retrievedData = [{
                "result": -1,
                "message": "Error --> Blank data"
            }];
        }

        return this.retrievedData;
    }

    async getCheckup(RouteInstance: IDRoute, CheckupInstance: TravellerCheckUp): Promise<any[]> {
        try {
            this.retrievedData = await this.db.sequelize?.query(
                `SELECT * FROM "public"."traveller_check_ups"
                WHERE "_traveller_id" = ` + CheckupInstance._traveller_id + `;`
            );
        } catch (error) {
            this.retrievedData = [{
                "message": "Error --> " + RouteInstance.url + " --> " + error
            }];
        }

        return this.retrievedData[0];
    }

    async updateCheckup(RouteInstance: IDRoute, CheckupInstance: TravellerCheckUp): Promise<any[]> {
        try {
            this.retrievedData = await this.db.sequelize?.query(
                `UPDATE public.traveller_check_ups SET doc = '`+ JSON.stringify(CheckupInstance.doc) + `'
                    WHERE public.traveller_check_ups._traveller_id = `+ CheckupInstance._traveller_id + `;`
            );

            this.retrievedData[0] = {
                "result": 1
            };

        } catch (error) {
            this.retrievedData = [{
                "result": -1,
                "message": "Error --> " + RouteInstance.url + " --> " + error
            }];
        }

        return this.retrievedData;
    }

    // create follow up
    async createFollowup(RouteInstance: IDRoute, CheckupInstance: TravellerCheckUp): Promise<any[]> {
        if (CheckupInstance._traveller_id != "") {
            try {

                console.log(CheckupInstance._traveller_id)
                // check if user exists
                const traveller: any = await this.db.sequelize?.query(
                    `SELECT * FROM "public"."travellers" WHERE "_id" = :travellerId;`,
                    {
                        replacements: { travellerId: CheckupInstance._traveller_id },
                        type: QueryTypes.SELECT,
                    }
                );

                if (traveller && traveller.length === 0) {
                    this.retrievedData = [{
                        "result": -1,
                        "message": "Traveller not found"
                    }];
                } else {
                    this.retrievedData = await this.db.sequelize?.query(
                        `INSERT INTO public.traveller_follow_ups
                    (_traveller_Id, doc) VALUES
                    ('${CheckupInstance._traveller_id}', '${JSON.stringify(CheckupInstance.doc)}')
                    RETURNING _id;`
                    );

                    const insertedId = this.retrievedData[0][0]._id;
                    this.retrievedData[0] = {
                        result: insertedId,
                    };

                    console.log("-->", this.retrievedData);
                }
            } catch (error) {
                this.retrievedData = [{
                    "result": -1,
                    "message": "Error --> " + RouteInstance.url + " --> " + error
                }];
            }
        } else {
            this.retrievedData = [{
                "result": -1,
                "message": "Error --> Blank data"
            }];
        }

        return this.retrievedData;
    }

    async getFollowup(RouteInstance: IDRoute, CheckupInstance: TravellerCheckUp): Promise<any[]> {
        try {
            this.retrievedData = await this.db.sequelize?.query(
                `SELECT * FROM "public"."traveller_follow_ups"
                WHERE "_traveller_id" = ` + CheckupInstance._traveller_id + `;`
            );
        } catch (error) {
            this.retrievedData = [{
                "message": "Error --> " + RouteInstance.url + " --> " + error
            }];
        }

        return this.retrievedData[0];
    }
}

export default new MainRepository