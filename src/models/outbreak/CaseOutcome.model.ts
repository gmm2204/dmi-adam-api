export class CaseOutcome {
  _id: any = -1;
  doc: any;
  action_result: boolean = false;

  constructor(_id: number, doc: any) {
    this._id = _id;
    this.doc = doc;
  }
}