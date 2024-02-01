export class Case {
  _id: any = -1;
  doc: any;

  constructor(_id: number, doc: any) {
    this._id = _id;
    this.doc = doc;
  }
}