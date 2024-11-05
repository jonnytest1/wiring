import type { Connection } from '../connection';
import { Wiring } from '../wiring.a';




export type REgistrationNode = {
  name: string,
  details?: any,
  node?: Wiring
  connection?: Connection
} | Array<Array<REgistrationNode>>


export interface RegisterOptions {
  nodes: Array<REgistrationNode>;
  until: Wiring;
  from?: any;

  parrallelLevel: number

  registrationTimestamp: number


  withSerialise: boolean
  forCalculation: boolean
}