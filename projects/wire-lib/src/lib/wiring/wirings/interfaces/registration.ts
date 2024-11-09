import type { Connection } from '../connection';
import type { Impedance } from '../units/impedance';
import type { Voltage } from '../units/voltage';
import type { Wire } from '../wire';
import type { Wiring } from '../wiring.a';
export interface PowerSource {
  source: Wiring;
  ground: Connection | null;
  nodes?: Array<REgistrationNode>;


  iterationMap: Map<Wire, Array<Connection>>


  totalImpedance?: Impedance

  // this is definitely wrong , but it makes it a bit faster
  maxVoltage?: Voltage

  invalidConfig?: boolean

  breakOnInvalid: boolean
}

export type CalcNode = Wiring & { calculationData?: { voltageBefore: Map<Connection, Voltage> } }
export type RegistrationNodeObject = {
  name: string;
  details?: any;
  node?: CalcNode;
  connection?: Connection;
  out?: Connection;
};

export type REgistrationNode = RegistrationNodeObject | Array<Array<REgistrationNode>>


export interface RegisterOptions {
  nodes: Array<REgistrationNode>;

  callConnections: Array<Wiring>
  until: Connection;
  from?;

  parrallelLevel: number

  registrationTimestamp: number


  withSerialise: boolean
  forCalculation: boolean

  source: PowerSource

  add(n: REgistrationNode): void


  next(node: Wiring, opts: RegisterOptions): void | false
}