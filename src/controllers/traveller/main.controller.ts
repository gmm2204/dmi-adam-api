import { Request, Response } from "express";
import mainRepository from "../../repositories/traveller/main.repository";

export default class MainController {
    async postData(req: Request, res: Response) {
        try {
            let dataInstance: any;
            dataInstance = await mainRepository.readPostData(req);
            res.status(200).send(dataInstance);
        }
        catch (err) {
            res.status(500).send({
                message: "An error has occured here --> " + req.url
            });
        }
    }
}