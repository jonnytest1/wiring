
import type { JsonContext } from '../../utils/json-stringify-iterator';
import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import type { Impedance } from './units/impedance';
import { Wiring, type ProcessCurrentOptions, type ProcessCurrentReturn } from './wiring.a';


export class Wire extends Wiring {

  static typeName = "Wire"

  skipped = false

  connections: Array<Connection> = []
  constructor(inConnection?: Connection) {
    super()

    if (inConnection) {
      this.connections.push(inConnection)
      inConnection.connectedTo = this
    }
  }

  resistance = 0;

  //override outC: Connection;


  public isViewWire = true;


  createConnectionLink() {
    const conLink = new Connection(this, "connectionLink");
    this.connections.push(conLink)
    return conLink
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

  connect(other: Connection) {
    other.connectedTo = this;
    this.connections.push(other)
  }

  connectWire(other: Wire) {

    for (const con of other.connections) {
      this.connect(con)
    }
    return this
  }


  override register(options: RegisterOptions) {

    const instance: REgistrationNode = { name: Wire.typeName };
    if (!options.forCalculation) {
      options.nodes.push(instance);
    }



    const otherConnections = this.getOtherConnections(options.from);

    if (otherConnections.length == 1) {
      otherConnections
        .forEach(con =>
          options.next(con, { ...options, from: this }))
    } else {
      const nodes = otherConnections
        .map(con => {
          const parrallelNodes: Array<REgistrationNode> = []
          options.next(con, {
            ...options,
            from: this,
            nodes: parrallelNodes,
            callConnections: [...options.callConnections]
          })
          return parrallelNodes;
        })



      if (nodes.some(s => !(s instanceof Array))) {
        debugger
      }
      //const inversNodes = []
      // inversNodes.reverse()
      let validNodes: REgistrationNode[][] | REgistrationNode = nodes.filter(subCon => subCon.length);
      if (validNodes.length == 1) {
        if ("length" in validNodes[0][0]) {
          debugger
        }

        if (validNodes[0].length > 1) {
          //debugger
        }

        validNodes = validNodes[0][0]



      }


      // do uniqueness check
      options.nodes.push(validNodes)
      //options.nodes.push(...inversNodes)
    }

    //return this.outC.register({ ...options, from: this });
  }


  getOtherConnections(from: Connection) {
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
      connectedWires: this.getOtherConnections(c.parents.at(-1)),
    };
  }
}
