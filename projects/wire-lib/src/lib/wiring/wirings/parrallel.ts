
import type { FromJsonOptions } from '../serialisation';
import type { Collection } from './collection';
import { Connection } from './connection';
import { ControlCollection } from './control-collection.a';
import { noResistance } from './resistance-return';
import { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class Parrallel extends ControlCollection implements Wiring {
  constructor(...containers: Array<Collection & Wiring>) {
    super(null, null);
    this.inC = new Connection(this, 'par_in');
    this.outC = new Connection(this, 'par_out');

    this.innerOutConnection = new Connection(this, 'par_inner_out');

    this.wireProv = new Wire(this.inC);
    this.wireRec = Wire.at(this.innerOutConnection);

    for (const component of containers) {
      this.wireProv.outC = component.inC;
      component.outC.connectedTo = this.wireRec;
    }
    this.containers = containers;


  }
  resistance: number;

  lanes: Array<Collection>;


  containers: Array<Collection & Wiring>;

  voltageDrop?: number;
  wireProv: Wire;
  wireRec: Wire;
  inVoltage: number;
  restCurrent: CurrentCurrent;
  resistanceAfterBlock: ResistanceReturn;
  innerOutConnection: Connection;

  static fromJSON(json: any, context: FromJsonOptions): Wire {

    return null;
  }

  override getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn {
    if (from == this.innerOutConnection) {
      if (options.forParrallel) {
        if (options.forParrallel === 1) {
          return noResistance(this);
        }
        this.resistanceAfterBlock = this.outC.getTotalResistance(this, { ...options, forParrallel: options.forParrallel - 1 });
        return this.resistanceAfterBlock;
      }
      return this.outC.getTotalResistance(this, { ...options });
    } else if (typeof options.forParrallel != 'undefined') {

    }
    let resistancetotal = 0;
    this.containers.forEach(res => {
      const connectionResistance = res.getTotalResistance(this, { ...options, forParrallel: 1 });
      if (connectionResistance.resistance !== 0) {
        resistancetotal += 1 / connectionResistance.resistance;
      }
    });
    if (resistancetotal == 0) {
      return noResistance(this);
    }
    this.resistance = 1 / resistancetotal;
    const resistanceAfter = this.outC.getTotalResistance(this, options);
    return {
      ...resistanceAfter,
      resistance: resistanceAfter.resistance + this.resistance
    };
  }
  override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    if (from == this.innerOutConnection) {
      return this.restCurrent;
    }
    this.voltageDrop = (options.current * this.resistance);

    this.restCurrent = this.outC.pushCurrent({
      ...options
      , voltage: options.voltage - this.voltageDrop
    }, this);

    const subCurrents = this.containers.map(container => container.inC.pushCurrent({
      ...options, voltage: options.voltage - this.voltageDrop
    }, this));
    return this.restCurrent;
  }


  getStructure() {
    return this.containers
      .map(container => container instanceof ControlCollection ? container.getStructure() : {
        name: container.constructor.name
      });
  }
}
