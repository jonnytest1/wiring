
import type { JsonContext } from '../../utils/json-stringify-iterator';
import type { FromJsonOptions } from '../serialisation';
import { Collection } from './collection';
import type { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { Parrallel } from './parrallel';
import { ParrallelWire } from './parrallel-wire';
import { noConnection } from './resistance-return';
import type { Impedance } from './units/impedance';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Indexable, IndexableStatic, ResistanceReturn, Wiring, type ProcessCurrentOptions, type ProcessCurrentReturn } from './wiring.a';

export class Wire extends Wiring {

  static typeName = "Wire"

  connections: Array<Connection> = []
  constructor(inConnection?: Connection) {
    super()
    this.connections.push(inConnection)
    inConnection.connectedTo = this
  }

  resistance = 0;

  //override outC: Connection;


  public isViewWire = true;


  static connectNodes(...nodes: Array<Collection | Array<Collection & IndexableStatic> | ParrallelWire>) {
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


  remove(positive: Connection) {
    this.connections = this.connections.filter(con => con != positive)
  }



  static connect(...connections: Array<Connection>) {
    let wire = connections[0].connectedTo as Wire;
    if (!wire) {
      wire = new Wire(connections[0]);
    }

    for (let i = 1; i < connections.length; i++) {
      wire.connect(connections[i])
    }

    return wire;
  }

  static at(outC: Connection) {
    const wire = new Wire();
    wire.connect(outC);
    return wire;
  }

  /**@deprecated */
  getTotalResistance(f: Wiring, options: GetResistanceOptions): ResistanceReturn {
    const other = this.getOtherConnections(f as unknown as Connection)

    return other[0].getTotalResistance(this, options)
  }
  /**@deprecated */
  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    debugger
    const connection = this.connections[0];
    return connection.pushCurrent(options, this);
  }

  connect(other: Connection) {
    other.connectedTo = this;
    this.connections.push(other)
  }


  override register(options: RegisterOptions) {

    const instance: REgistrationNode = { name: Wire.typeName };
    if (!options.forCalculation) {
      options.nodes.push(instance);
    }



    const otherConnections = this.getOtherConnections(options.from);

    if (otherConnections.length == 1) {
      otherConnections
        .forEach(con => con.register({ ...options, from: this }))
    } else {
      const nodes = otherConnections
        .map(con => {
          const parrallelNodes = []
          con.register({ ...options, from: this, nodes: parrallelNodes });
          return parrallelNodes;
        })

      const inversNodes = []
      inversNodes.reverse()
      let validNodes: REgistrationNode = nodes.filter(subCon => subCon.length);
      if (validNodes.length == 1) {
        validNodes = validNodes[0][0]
      }

      // do uniqueness check
      options.nodes.push(validNodes)
      options.nodes.push(...inversNodes)
    }

    //return this.outC.register({ ...options, from: this });
  }


  private getOtherConnections(from: Connection) {
    return this.connections.filter(con => con != from)
  }
  override getImpedance(): Impedance {
    throw new Error('Method not implemented.');
  }
  override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
    throw new Error('Method not implemented.');
  }

  toJSON(key, c: JsonContext) {
    return {
      type: Wire.typeName,
      connectedWires: this.getOtherConnections(c.parents.at(-1)),
      ui: this.uiNode
    };
  }
}
