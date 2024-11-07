import type { UINode } from '../wiring-ui/ui-node';
import type { Collection } from './collection';
import type { CircuitSolver } from './computation/circuit-solver';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import type { ParrallelWire } from './parrallel-wire';
import { noConnection } from './resistance-return';
import type { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ProcessCurrentOptions, ProcessCurrentReturn, ResistanceReturn, Wiring } from './wiring.a';

export class Connection implements Wiring {


  constructor(public parent: Wiring, public id: string) { }

  solver?: CircuitSolver;

  name?: string;
  uiNode?: UINode<Collection>;
  nodeUuid?: string;

  resistance: number;


  connectedTo?: Wire | ParrallelWire;

  getImpedance(): Impedance {
    throw new Error("shouldnt run since its not registered")
  }
  processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
    throw new Error("shouldnt run since its not registered")
  }

  setVoltage(con: Connection, voltage: Voltage): void {
    throw new Error("shouldnt run since its not registered")
  }
  providedVoltage(): Voltage {
    debugger
    return Voltage.ZERO
  }

  register(options: RegisterOptions) {
    const instance: REgistrationNode = { name: "Connection" };
    if (!options.forCalculation) {
      options.add(instance);
    }

    let target = this.parent;

    if (options.from === this.parent) {
      target = this.connectedTo;

    }
    if (target === undefined) {
      return;
    }
    return options.next(target, { ...options, from: this })
  }

  connectTo(other: Connection) {
    Wire.connect(this, other);
  }
}
