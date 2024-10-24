
import type { Connection } from './connection';
import type { RegisterOptions } from './interfaces/registration';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, Indexable, IndexableStatic, ResistanceReturn } from './wiring.a';
import { Wiring } from './wiring.a';


export class Collection extends Wiring {

  static typeName = "Collection"
  constructor(public inC: Connection | null, public outC: Connection | null) {
    super();
    this['id'] = Math.random();
  }


  register(options: RegisterOptions) {
    if (options.from == this.outC) {
      options.nodes.push({ name: "Collection" });
      return this.outC?.register({ ...options, from: this });
    }
    options.nodes.push({ name: Collection.typeName });
    return this.inC?.register({ ...options, from: this });
  }

  applytoJson(json: Record<string, any>) {
    // to implement
  }

  toJSON(key?, c?): any {
    const jsonObj = {
      type: (this as unknown as IndexableStatic).constructor.typeName
    };
    this.applytoJson(jsonObj);
    return jsonObj;
  }

  getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn {
    throw new Error('Method not implemented.');
  }
  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    throw new Error('Method not implemented.');
  }

  mockSetUiNode(node: Wiring["uiNode"]) {
    this.uiNode = node
  }
}
