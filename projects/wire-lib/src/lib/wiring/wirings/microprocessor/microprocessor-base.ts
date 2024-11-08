import { Collection } from '../collection';
import { Connection } from '../connection';
import type { RegisterOptions, REgistrationNode } from '../interfaces/registration';
import { noConnection, noResistance } from '../resistance-return';
import { Resistor } from '../resistor';
import { Impedance } from '../units/impedance';
import type { Voltage } from '../units/voltage';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, IndexableConstructor, ProcessCurrentOptions, ProcessCurrentReturn, ResistanceReturn, Wiring } from '../wiring.a';
import type { Executer } from './code-processor/executer';
export type PinMode = "OUT" | "IN"


interface ConstructorOpts {
    pinCount: number

    tagMap: {
        inputPwr: Array<number>
        ground: Array<number>
    }

}

interface PinData {
    con: Connection;
    outputValue: number;
    mode: PinMode | "off";
    boundResistor?: Resistor;


    toggle?: () => void
}

export abstract class MicroProcessorBase extends Collection {

    pinList: Array<Connection>


    reversePinMap: Map<Connection, number> = new Map()
    outCResistancePrecentageMap = new Map<Connection, number>()


    topRow: Array<Connection>
    bottomRow: Array<Connection>

    pinMap: {
        [pin: number]: PinData
    } = {}


    tagMap: {
        inputPwr: Array<number>
        ground: Array<number>
    }
    resistancetotal: number;
    selfresolved: boolean;
    batteryConnection: Connection;
    resistance: number;
    abstract operationResistance: number;
    lastTriggerTimestamp: number;
    restCurrent: CurrentCurrent;
    voltageDrop: Voltage;
    abstract executer: Executer;
    registerTimestamp: any;
    topLevelNodes: REgistrationNode[];


    gpios: Array<PinData> = []

    constructor(options: ConstructorOpts) {
        super(null, null)
        this.pinList = this.createPinConnectionList(options)
        this.tagMap = options.tagMap
        this.setup()
    }



    private createPinConnectionList(options: ConstructorOpts): Connection[] {
        return new Array(options.pinCount)
            .fill(undefined)
            .map((u, i) => new Connection(this, `array_${i}`));
    }

    /**
     * i goes left to right
     * @param con 
     * @param i 
     * @returns 
     */
    getTopRowPinId(con, i) {
        return 40 - i
    }
    getBottomRowPinId(con, i) {
        return i + 1
    }
    setup() {
        const half = this.pinList.length / 2
        this.topRow = this.pinList.slice(0, half)
        this.bottomRow = this.pinList.slice(half)

        for (let inputI = 0; inputI < this.topRow.length; inputI++) {
            const con = this.topRow[inputI]
            const pinId = this.getTopRowPinId(con, inputI)

            this.registerConnection(con, pinId)

            // connectionWire.name = `${40 - inputI}-inputwire-${inpt.name}`

        }

        for (let outputI = 0; outputI < this.bottomRow.length; outputI++) {
            const con = this.bottomRow[outputI]
            const pinIndex = this.getBottomRowPinId(con, outputI)


            this.registerConnection(con, pinIndex)
            // output.inC.connectedTo = new Wire()
            //  output.inC.connectedTo.inC = this
            //  output.name = `pin-${outputI + 1}`



        }
        for (const pin of this.tagMap.ground) {
            this.pinMap[pin].mode = "OUT"
        }
    }
    registerConnection(con: Connection, pinId: number) {
        con.parent = this

        const pinOptions: PinData = {
            con: con,
            mode: "off",
            outputValue: 0

        };

        if (!this.tagMap.ground.includes(pinId) && !this.tagMap.inputPwr.includes(pinId)) {
            const boundREsistor = new Resistor(Infinity);
            con.parent = boundREsistor
            pinOptions.boundResistor = boundREsistor

            this.gpios.push(pinOptions)


            pinOptions.toggle = () => {
                pinOptions.outputValue = 1 - pinOptions.outputValue

                boundREsistor.resistance = pinOptions.outputValue == 0 ? Infinity : 10

            }
        }
        this.pinMap[pinId] = pinOptions
        this.reversePinMap.set(con, pinId)
    }

    getId(con: Connection) {
        return this.reversePinMap.get(con)
    }


    override getImpedance(): Impedance {
        return new Impedance(this.operationResistance)
    }


    override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
        const fromPin = this.reversePinMap.get(options.fromConnection)
        if (this.tagMap.ground.includes(fromPin)) {
            debugger
        }
        this.voltageDrop = options.voltageDrop
        if (!this.voltageDrop.isPositive() && this.executer.running) {
            this.executer.kill()
        } else if (!this.executer.running && this.voltageDrop.isPositive()) {
            this.executer.start()
        }

        return options
    }


    override register(options: RegisterOptions) {

        if (this.registerTimestamp === options.registrationTimestamp) {

            return
        }
        const fromPin = this.reversePinMap.get(options.from)


        const instance: REgistrationNode = { name: (this.constructor as IndexableConstructor).typeName };
        if (options.forCalculation) {
            instance.node = this
            instance.connection = options.from
        }


        this.registerTimestamp = options.registrationTimestamp;


        const subNodes: Array<Array<REgistrationNode>> = [[instance]]
        this.topLevelNodes = options.nodes;
        this.topLevelNodes.push(subNodes)

        const groundNodes: Array<{
            connection: Connection,
            pinid: number
            nodes: Array<REgistrationNode>
        }> = []


        Object.keys(this.pinMap)
            // .filter(pinid => !this.tagMap.ground.includes(+pinid))
            .filter(pinid => this.pinMap[pinid].mode === "OUT")
            .forEach(pinid => {
                const pinData = this.pinMap[+pinid];
                const container = pinData.con
                //if (container != this.batteryConnection) {



                const outputSubNodes: Array<REgistrationNode> = []

                if (this.tagMap.ground.includes(+pinid)) {
                    groundNodes.push({
                        pinid: + pinid,
                        connection: container,
                        nodes: outputSubNodes
                    })
                    container.register({ ...options, from: this, nodes: outputSubNodes })
                } else {
                    subNodes.push(outputSubNodes)


                    pinData.boundResistor.register({
                        ...options, from: container, nodes: outputSubNodes,
                        add(w) {
                            outputSubNodes.push(w)
                        }
                    })
                    container.register({
                        ...options, from: pinData.boundResistor, nodes: outputSubNodes,
                        add(w) {
                            outputSubNodes.push(w)
                        }
                    })
                }


                //debugger
                //}
            })


        const grouindWithItems = groundNodes.filter(el => el.nodes.length)

        if (grouindWithItems.length === 1) {
            this.batteryConnection = grouindWithItems[0].connection

            this.topLevelNodes.push(...grouindWithItems[0].nodes)
        } else {
            debugger
        }
    }

    /* override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
         const fromPin = this.reversePinMap.get(from as Connection)
 
 
         if (this.tagMap.ground.includes(fromPin)) {
             if (!this.lastTriggerTimestamp || this.lastTriggerTimestamp !== options.triggerTimestamp) {
                 this.lastTriggerTimestamp = options.triggerTimestamp
                 if (!this.batteryConnection) {
                     this.getBatteryConnection({
                         forParrallel: 1, addStep() { },
                         checkTime: Date.now()
                     })
                 }
                 if (!this.batteryConnection) {
 
                     throw new Error("didnt find power supply durion resistance calculation")
                 }
                 this.restCurrent = this.batteryConnection.pushCurrent({
                     ...options
                     , current: options.currentAfterBlock,
                     voltage: options.voltageAfterBlock
                 }, this);
                 this.restCurrent = {
                     ...this.restCurrent,
                     afterBlockCurrent: [...this.restCurrent.afterBlockCurrent, this.restCurrent]
 
                 }
             }
             return this.restCurrent
         }
 
 
 
         this.voltageDrop = (options.current * this.resistance)
 
         if (this.voltageDrop == 0 && this.executer.running) {
             this.executer.kill()
         } else if (!this.executer.running && this.voltageDrop > 0) {
             this.executer.start()
         }
 
         const rstCurrent = Object.keys(this.pinMap)
             .filter(pinid => !this.tagMap.ground.includes(+pinid))
             .filter(pinid => this.pinMap[pinid].mode === "OUT")
             .map(pinid => {
                 const container = this.pinMap[+pinid].con
                 const voltage = options.voltage
                 const percentage = this.outCResistancePrecentageMap.get(container)
                 let current;
                 if (isFinite(this.resistancetotal)) {
                     current = options.current * (percentage)
                 } else if (isFinite(percentage)) {
                     current = 0
                 } else {
                     current = options.current
                 }
                 if (this.pinMap[+pinid].mode === "OUT") {
                     let pushVoltage = voltage;
                     let pushCurrent = current;
                     if (this.pinMap[+pinid].outputValue == 0) {
                         pushVoltage = 0
                         pushCurrent = 0
                     }
 
                     // const connectionCurrent = this.
                     return container.pushCurrent({
                         ...options,
                         current: pushCurrent,
                         voltage: pushVoltage,
                         currentAfterBlock: options.current,
                         voltageAfterBlock: voltage - this.voltageDrop
                     }, this);
                 }
             }).reduce((col, cur) => {
                 if (cur?.afterBlockCurrent) {
                     return cur.afterBlockCurrent.pop()
                 }
                 return col
             }, null)
 
 
         // in case its not completely connected
         if (rstCurrent == null) {
             return null
         }
         return {
             ...rstCurrent,
             voltage: rstCurrent.voltage
         };
     }
 */
}