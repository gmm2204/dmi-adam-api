export class Traveller {
  _id: number = -1;
  _identity_type: string = "";
  _identity_number: string = "";
  doc: any;

  constructor(_id: number, _identity_type: string, _identity_number: string, doc: any) {
    this._id = _id;
    this._identity_type = _identity_type;
    this._identity_number = _identity_number;
    this.doc = doc;
  }
}