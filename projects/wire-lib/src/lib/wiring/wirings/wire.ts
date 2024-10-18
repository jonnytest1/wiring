
import type { FromJsonOptions } from '../serialisation';
import { Collection } from './collection';
import type { Connection } from './connection';
import type { RegisterOptions } from './interfaces/registration';
import { Parrallel } from './parrallel';
import { ParrallelWire } from './parrallel-wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class Wire extends Collection {


  constructor(inConnection?: Connection) {
    super(inConnection!, null as any);
    if (inConnection) {
      inConnection.connectedTo = this;
    }
  }

  resistance = 0;

  override outC: Connection;


  public isViewWire = true;


  static connectNodes(...nodes: Array<Collection | Array<Collection> | ParrallelWire>) {
    let lastEl: Collection | ParrallelWire;
    nodes.forEach(node => {
      if (node instanceof Array) {
        node = new Parrallel(...node);
      }

      if (lastEl) {

        if (lastEl instanceof ParrallelWire && !(node instanceof ParrallelWire)) {
          lastEl.newOutC(node.inC);
        } else if (node instanceof ParrallelWire && !(lastEl instanceof ParrallelWire)) {
          node.newInC(lastEl.outC);
        } else if (!(lastEl instanceof ParrallelWire) && !(node instanceof ParrallelWire)) {

          // lastEl.connectedTo = undefined
          Wire.connect(lastEl.outC, node.inC);
        }
      }
      // node.controlContainer = this
      // this.nodes.push(node)
      // this.connectFirst()
      lastEl = node;
    });
  }
  static connect(inC: Connection, outC: Connection) {
    let wire = inC.connectedTo;
    if (!wire) {
      wire = new Wire(inC);
    }

    wire.connect(outC);
  }

  static at(outC: Connection) {
    const wire = new Wire();
    wire.connect(outC);
    return wire;
  }


  override getTotalResistance(f: Wiring, options: GetResistanceOptions): ResistanceReturn {
    return this.outC.getTotalResistance(this, options);
  }

  override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {

    const connection = this.outC;
    return connection.pushCurrent(options, this);
  }

  connect(other: Connection) {
    this.outC = other;
    other.connectedTo = this;
  }


  override register(options: RegisterOptions) {
    options.nodes.push({ name: this.constructor.name });
    return this.outC.register({ ...options, from: this });
  }

  override toJSON(key?) {
    return {
      type: this.constructor.name,
      connectedWire: this.outC.parent,
      ui: this.uiNode
    };
  }
}
