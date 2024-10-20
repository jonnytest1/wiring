import { Collection } from '../collection';
import { Connection } from '../connection';
import { noConnection, noResistance } from '../resistance-return';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from '../wiring.a';
import type { Executer } from './code-processor/executer';
export type PinMode = "OUT" | "IN"


interface ConstructorOpts {
    pinCount: number

    tagMap: {
        inputPwr: Array<number>
        ground: Array<number>
    }

}

export abstract class MicroProcessorBase extends Collection {

    pinList: Array<Connection>


    reversePinMap: Map<Connection, number> = new Map()
    outCResistancePrecentageMap = new Map<Connection, number>()


    topRow: Array<Connection>
    bottomRow: Array<Connection>

    pinMap: {
        [pin: number]: {
            con: Connection,
            outputValue: number
            mode: PinMode | "off"
        }
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
    voltageDrop: number;
    abstract executer: Executer;

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
            const inpt = this.topRow[inputI]
            // connectionWire.name = `${40 - inputI}-inputwire-${inpt.name}`
            inpt.parent = this
            //connectionWire.outC = this
            const pinId = this.getTopRowPinId(inpt, inputI)
            this.pinMap[pinId] = {
                con: inpt,
                mode: "off",
                outputValue: 0
            }
            this.reversePinMap.set(inpt, pinId)
        }

        for (let outputI = 0; outputI < this.bottomRow.length; outputI++) {
            const output = this.bottomRow[outputI]
            // output.inC.connectedTo = new Wire()
            //  output.inC.connectedTo.inC = this
            //  output.name = `pin-${outputI + 1}`
            output.parent = this
            const pinIndex = this.getBottomRowPinId(output, outputI)
            this.pinMap[pinIndex] = {
                con: output,
                "mode": "off",
                outputValue: 0
            }
            this.reversePinMap.set(output, pinIndex)
        }
        for (const pin of this.tagMap.ground) {
            this.pinMap[pin].mode = "OUT"
        }
    }

    getId(con: Connection) {
        return this.reversePinMap.get(con)
    }

    override getTotalResistance(from: Wiring | null, options: GetResistanceOptions): ResistanceReturn {
        options.addStep(this)

        const fromPin = this.reversePinMap.get(from as Connection)
        if (this.tagMap.inputPwr.includes(fromPin)) {
            let parrallelIndex = options.forParrallel;

            parrallelIndex--;


            this.resistancetotal = 0
            let resistanceAfter: Array<ResistanceReturn> | "NaN"

            for (const pinid in this.pinMap) {
                const pin = this.pinMap[pinid]

                if (pin.mode === "OUT") {
                    this.selfresolved = false
                    const connectionResistance = pin.con.getTotalResistance(this, {
                        ...options,
                        forParrallel: parrallelIndex + 1
                    })
                    if (isNaN(connectionResistance.resistance)) {
                        continue
                    }

                    if (this.tagMap.ground.includes(+pinid)) {
                        if (this.selfresolved == false) {
                            this.batteryConnection = pin.con
                        }
                        continue
                    }

                    if (connectionResistance.resistance !== 0) {
                        this.outCResistancePrecentageMap.set(pin.con, 1 / connectionResistance.resistance)
                        this.resistancetotal += 1 / connectionResistance.resistance;
                    } else {
                        this.resistancetotal += Infinity
                        this.outCResistancePrecentageMap.set(pin.con, Infinity)
                    }
                    if (!resistanceAfter && connectionResistance.afterBlock) {
                        resistanceAfter = connectionResistance.afterBlock
                    }
                    if (isNaN(connectionResistance.resistance) && resistanceAfter === undefined) {
                        resistanceAfter = "NaN"
                    }
                }

            }

            // adding default resistance for operation
            this.resistancetotal += 1 / this.operationResistance



            if (resistanceAfter == "NaN") {
                return noConnection(this)
            }
            this.resistance = 1 / this.resistancetotal;

            /*resistanceAfter.push({
              resistance: this.resistance,
              afterBlock: [],
              steps: [this]
            })*/


            if (this.resistancetotal == 0) {
                return {
                    resistance: 0,
                    afterBlock: resistanceAfter,
                    steps: [this]
                }
            }
            if (!resistanceAfter) {
                if (!this.batteryConnection) {
                    this.getBatteryConnection(options);
                }
                resistanceAfter = [this.batteryConnection.getTotalResistance(this, {
                    ...options,
                    forParrallel: parrallelIndex + 1
                })]
            }
            const resistanceAfterEl = resistanceAfter.pop()
            //return this.resistance + this.outC.getTotalResistance(this, options)

            return {
                ...resistanceAfter,
                resistance: resistanceAfterEl.resistance + this.resistance,
                afterBlock: resistanceAfter,
                steps: [this]
            }
        } else if (this.tagMap.ground.includes(fromPin)) {
            this.selfresolved = true

            if (this.batteryConnection) {
                const resistanceRet = this.batteryConnection.getTotalResistance(this, {
                    ...options,
                });

                /*resistanceAfter.push({
                  resistance: this.resistance,
                  afterBlock: [],
                  steps: [this]
                })*/

                return {
                    ...noResistance(this),
                    afterBlock: [resistanceRet, ...resistanceRet.afterBlock]
                }
            }
            return noResistance(this)
        }



        return noConnection(this)

    }


    protected getBatteryConnection(options: GetResistanceOptions) {
        for (const pinid in this.pinMap) {
            const pin = this.pinMap[pinid];

            if (pin.mode === "OUT") {

                this.selfresolved = false
                const connectionResistance = pin.con.getTotalResistance(this, {
                    ...options,
                    forParrallel: options.forParrallel - 1
                })
                if (isNaN(connectionResistance.resistance)) {
                    continue
                }

                if (this.tagMap.ground.includes(+pinid)) {
                    if (this.selfresolved == false) {
                        this.batteryConnection = pin.con
                        return
                    }
                }
            }
        }
    }


    override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        const fromPin = this.reversePinMap.get(from as Connection)


        if (this.tagMap.ground.includes(fromPin)) {
            if (!this.lastTriggerTimestamp || this.lastTriggerTimestamp !== options.triggerTimestamp) {
                this.lastTriggerTimestamp = options.triggerTimestamp
                if (!this.batteryConnection) {
                    this.getBatteryConnection({ forParrallel: 1, addStep() { } })
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

}