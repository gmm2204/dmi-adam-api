import { Request, Response } from "express";
import CradleDatabase from "../../db/CradleDatabase";
import * as RoutesData from '../../data/traveller/routes.json';
import { cradle_config } from "../../config/cradle.config";
import { Case } from "../../models/outbreak/Case.model";
import { IDRoute } from "../../models/IDRoute.model";
import { Json } from "sequelize/types/utils";
var https = require('node:https');
import axios from 'axios';
import { CaseOutcome } from "../../models/outbreak/CaseOutcome.model";

interface IMainRepository {
    processPostData(req: Request): Promise<any[]>;
}

class MainRepository implements IMainRepository {
    CDInstance = new CradleDatabase(cradle_config.DATABASE);

    private retrievedData: any;

    async processPostData(req: Request): Promise<any[]> {
        let url = req.url;
        let TargetRoute: IDRoute = new IDRoute("", "");
        let CaseInstance = new Case(req.body["_id"], req.body["doc"]);

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
            case "/results/poll":
                return await this.updateResults(TargetRoute, CaseInstance);

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

    async updateResults(RouteInstance: IDRoute, CaseInstance: Case): Promise<any> {
        let db = this.CDInstance.cradle_database;
        let instance = this;

        db?.view(cradle_config.VIEW_OUTCOME, function (err, res) {
            res.forEach(function (key: any, row: any, id: any) {
                db?.get(id, function (err, doc) {
                    // Prerequisites
                    //Seed [CaseOutcome]
                    let CaseOutcomeInstance = new CaseOutcome(doc._id, doc);

                    // Poll and update laboratory results
                    instance.pollResults(CaseOutcomeInstance);

                    //TODO! Limit view records retrieved per instance
                });
            });
        });

        return true;
    }

    async pollResults(CaseOutcomeInstance: CaseOutcome): Promise<boolean> {
        let db = this.CDInstance.cradle_database;

        axios({
            method: 'get',
            url: cradle_config.LIMS_ENDPOINT,
            params: {
                'caseId': CaseOutcomeInstance._id
            },
            headers: {
                'x-api-key': cradle_config.LIMS_API_KEY
            }
        })
            .then(function (response) {
                // handle success
                if (response.status == 200) {
                    response.data.data.forEach((seek_lab_result: any) => {
                        if (CaseOutcomeInstance._id === seek_lab_result.caseId) {
                            // Prerequisites
                            let case_lab_result = "pending";

                            // Set lab result
                            switch (seek_lab_result.result) {
                                case "Positive":
                                    case_lab_result = "positive";

                                    break;

                                case "Negative":
                                    case_lab_result = "negative";
                                    break;

                                default:
                                    break;
                            }

                            // Update document
                            CaseOutcomeInstance.doc.fields.co_laboratory.col_consented_information.col_rdt_group.col_rdt_results_date = new Date().toISOString().split('T')[0];
                            CaseOutcomeInstance.doc.fields.co_laboratory.col_consented_information.col_rdt_group.col_rdt_results = case_lab_result;

                            // Save updated document
                            db?.save(CaseOutcomeInstance._id, CaseOutcomeInstance.doc,
                                function (err, res) {
                                    if (res.ok === true) {
                                        CaseOutcomeInstance.action_result = true;
                                    }
                                });
                        }
                    });
                }
            })
            .catch(function (error) {
                // TODO! handle error
            })
            .finally(function () {
                // TODO! Finalized
            });

        return CaseOutcomeInstance.action_result;
    }
}

export default new MainRepository