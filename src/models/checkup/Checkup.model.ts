export class TravellerCheckUp {
    _id: number = -1;
    _traveller_id: string = "";
    doc: any;

    constructor(_id: number, _traveller_id: string, doc: any) {
        this._id = _id;
        this._traveller_id = _traveller_id;
        this.doc = doc;
    }
}