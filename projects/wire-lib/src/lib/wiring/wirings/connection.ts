import type { UINode } from '../wiring-ui/ui-node';
import type { Collection } from './collection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import type { ParrallelWire } from './parrallel-wire';
import { noConnection } from './resistance-return';
import type { Impedance } from './units/impedance';
import { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ProcessCurrentOptions, ProcessCurrentReturn, ResistanceReturn, Wiring } from './wiring.a';

export class Connection implements Wiring {


  constructor(public parent: Wiring, public id: string) { }

  name?: string;
  uiNode?: UINode<Collection>;
  nodeUuid?: string;

  resistance: number;


  connectedTo?: Wire | ParrallelWire;

  getTotalResistance(from: Wiring | null, options: GetResistanceOptions): ResistanceReturn {
    options.addStep(this)
    let target = this.parent;

    if (from === this.parent) {
      target = this.connectedTo;

    }
    if (target == undefined) {
      return noConnection(this);
    }
    return target.getTotalResistance(this, options);
  }

  getImpedance(): Impedance {
    throw new Error("shouldnt run since its not registered")
  }
  processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
    throw new Error("shouldnt run since its not registered")
  }
  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    let target = this.parent;

    if (from === this.parent) {
      target = this.connectedTo;

    }
    if (target == undefined) {
      return;
    }
    return target.pushCurrent(options, this);

  }
  register(options: RegisterOptions) {
    const instance: REgistrationNode = { name: "Connection" };
    if (!options.forCalculation) {
      options.nodes.push(instance);
    }

    let target = this.parent;

    if (options.from === this.parent) {
      target = this.connectedTo;

    }
    if (target === undefined) {
      return;
    }
    target.register({ ...options, from: this });
  }

  connectTo(other: Connection) {
    Wire.connect(this, other);
  }
}
