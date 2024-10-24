import { v4 } from 'uuid';
import type { UINode } from '../wiring-ui/ui-node';
import type { RegisterOptions } from './interfaces/registration';


export interface CurrentCurrent {
  voltage: number;
  current: number;
  remainingAmpereHours: number;
  afterBlockCurrent: Array<CurrentCurrent>;
}

export interface CurrentOption {
  /**
     * current in ampere
     */
  current: number;
  voltage: number;
  resistance: number;
  deltaSeconds: number;
  triggerTimestamp: number;
  currentAfterBlock?: number;
  voltageAfterBlock?: number;
}

export interface GetResistanceOptions {
  forParrallel?: number;
  addStep: (w: Wiring) => void

}


export interface ResistanceReturn {
  resistance: number;

  afterBlock: Array<ResistanceReturn>;

  steps: Array<any>
}

export interface Indexable {
  typeName: string
}

export type IndexableStatic = { constructor: Indexable }



export abstract class Wiring {
  name?: string;
  uiNode?: UINode;

  nodeUuid?: string = v4()

  // controlContainer?: SerialConnected;

  // abstract resistance: number

  abstract getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn;
  abstract pushCurrent(options: CurrentOption, from: Wiring | null): CurrentCurrent;

  abstract register(options: RegisterOptions): void;

  /* abstract fromRegistration(data) {
 
   }*/

}
