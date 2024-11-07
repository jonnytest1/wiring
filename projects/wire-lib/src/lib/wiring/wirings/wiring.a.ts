import { v4 } from 'uuid';
import type { UINode } from '../wiring-ui/ui-node';
import type { PowerSource, RegisterOptions, REgistrationNode } from './interfaces/registration';
import type { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import type { Time } from './units/time';
import type { Current } from './units/current';
import type { CircuitSolver } from './computation/circuit-solver';
import type { Connection } from './connection';
import type { ComputationMatrix } from './computation/computation-matrix';


export interface CurrentCurrent {
  voltage: number;
  current: number;
  remainingAmpereHours: number;
  afterBlockCurrent: Array<CurrentCurrent>;
}


export interface ProcessCurrentOptions {
  voltage: Voltage,
  supplyVoltage: Voltage
  current: Current
  deltaTime: Time

  triggerTimestamp: number

  //totalImpedance: Impedance,
  fromConnection?: Connection


  source: PowerSource

  data: ComputationMatrix

  //voltageChanges: Array<{ from: Wiring | REgistrationNode, voltage: Voltage }>
  //currentChanges: Array<{ from: Wiring | REgistrationNode, current: Current }>

  nodeshistory: Array<Wiring>

  postProcess: (cb: () => void) => void

  voltageOnlyRun: boolean
}


export interface ProcessCurrentReturn extends ProcessCurrentOptions {

}


export interface CurrentOption {
  /**
     * current in ampere
     */
  current: number;
  voltage: number;

  /**
   * idek
   */
  resistance: number;
  deltaSeconds: number;
  triggerTimestamp: number;
  currentAfterBlock?: number;
  voltageAfterBlock?: number;
}

export interface GetResistanceOptions {
  forParrallel?: number;
  addStep: (w: Wiring) => void
  checkTime: number
}

export function defaultGetResistanceOpts() {


  const steps = []
  const opts: GetResistanceOptions = {
    addStep(w) {
      steps.push(w)
    },
    checkTime: Date.now()
  };

  return opts;
}




export interface ResistanceReturn {
  resistance: number;

  afterBlock: Array<ResistanceReturn>;

  steps: Array<any>
}

export type IndexableConstructor<T extends string = string> = Function & {
  typeName: T
}



export interface Indexable<T extends string = string> {
  typeName: T
}

export type IndexableStatic = { constructor: Indexable }



export interface GetImpedanceContext {
  from: Connection;
}

export abstract class Wiring {
  name?: string;
  uiNode?: UINode;

  nodeUuid?: string = v4()

  solver?: CircuitSolver


  // controlContainer?: SerialConnected;

  // abstract resistance: number



  //abstract getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn;
  //abstract pushCurrent(options: CurrentOption, from: Wiring | null): CurrentCurrent;


  abstract getImpedance(opts: GetImpedanceContext): Impedance


  abstract processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn;


  providedVoltage() {
    return Voltage.ZERO
  }


  setVoltage(con: Connection, voltage: Voltage) {

  }

  abstract register(options: RegisterOptions): void | false;

  /* abstract fromRegistration(data) {
 
   }*/

}
