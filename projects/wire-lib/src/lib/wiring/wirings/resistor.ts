
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import type { UINode } from '../wiring-ui/ui-node';
import { Collection } from './collection';
import { Connection } from './connection';
import type { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, Indexable, IndexableStatic, ProcessCurrentOptions, ProcessCurrentReturn, ResistanceReturn, Wiring } from './wiring.a';
import { v4 } from "uuid"
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import type { SerialiseOptinos } from '../wiring-serialisation.ts/serialisation-factory';

export class Resistor extends Collection implements Wiring, IndexableStatic {


  static override typeName = "Resistor"
  override uiNode?: UINode;

  voltageDrop: number
  incomingCurrent: CurrentOption;
  voltageDropV: Voltage;
  constructor(public resistance: number) {
    super(null, null)
    this.inC = new Connection(this, "res_in")
    this.outC = new Connection(this, "res_out")
  }
  override['constructor']: Indexable;

  override getImpedance(): Impedance {
    return new Impedance(this.resistance)
  }
  evaluateFunction(options: CurrentOption) {
    // to implement
  }
  override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
    this.incomingCurrent = { current: options.current.current } as CurrentOption
    this.voltageDropV = Voltage.fromCurrent(options.current, new Impedance(this.resistance))

    this.evaluateFunction(this.incomingCurrent)
    return {
      ...options,
    }
  }

  override  register(options: RegisterOptions) {
    let exit = this.outC

    if (options.from === this.outC) {
      exit = this.inC
    }

    const repr: REgistrationNode = { name: this.constructor.typeName };
    if (options.withSerialise) {
      repr.details = {
        resistance: this.resistance,
        uuid: this.nodeUuid,
        ui: this.uiNode,
      }
    }
    if (options.forCalculation) {
      repr.node = this
    }
    options.add(repr)


    options.next(exit, { ...options, from: this })
  }



  override toJSON(o: SerialiseOptinos) {
    return {
      ...super.toJSON(),
      resistance: this.resistance,
      outC: o.serialise(this.outC)
    }
  }
}