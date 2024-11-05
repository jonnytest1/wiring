import type { Battery } from './battery';
import type { Capacitor } from './capacator';
import type { Connection } from './connection';
import type { REgistrationNode } from './interfaces/registration';
import { Current } from './units/current';
import { Impedance } from './units/impedance';
import type { Time } from './units/time';
import { Voltage } from './units/voltage';
import type { ProcessCurrentOptions } from './wiring.a';

export class CircuitSolver {

    registeredNodes: Array<REgistrationNode>


    resistanceMap = new Map<Array<REgistrationNode> | Array<Array<REgistrationNode>>, Impedance>()

    caluclatedImpedanceTotal: Impedance

    private hasCheckedNetwork = false


    constructor(private battery: Battery | Capacitor) {


    }

    public check(deltaTime: Time) {
        if (!this.hasCheckedNetwork) {
            this.computeNetwork()
            this.caluclatedImpedanceTotal = this.getTotalResistance(this.registeredNodes)
        }
        this.startProcessCurrent(deltaTime, this.registeredNodes)
    }


    public recalculate() {
        this.computeNetwork()
        this.caluclatedImpedanceTotal = this.getTotalResistance(this.registeredNodes)
    }

    from(inC: Capacitor) {
        const subSolver = new CircuitSolver(inC)
        subSolver.recalculate()
    }



    startProcessCurrent(deltaTime: Time, nodes: Array<REgistrationNode>) {
        let options: ProcessCurrentOptions = {
            voltage: new Voltage(0),
            current: new Current(0),
            time: deltaTime,
            totalImpedance: this.caluclatedImpedanceTotal,
        }
        this.processCurrentRecursive(options, nodes)

    }


    processCurrentRecursive(options: ProcessCurrentOptions, nodes: Array<REgistrationNode>) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            if (node instanceof Array) {
                let postParrallelCurrent = new Current(0)

                const blockImpedance = this.resistanceMap.get(node)
                const blockVoltageDrop = Voltage.fromCurrent(options.current, blockImpedance)

                const afterBlockVoltage = options.voltage.dropped(blockVoltageDrop)

                for (const subNodes of node) {
                    const branchResistance = this.resistanceMap.get(subNodes)
                    if (!branchResistance) {
                        debugger;
                    }
                    const brnachCurrent = Current.fromVoltage(blockVoltageDrop, branchResistance)

                    const subOptinos: ProcessCurrentOptions = {
                        ...options,
                        current: brnachCurrent
                    }
                    const currentOpts = this.processCurrentRecursive(subOptinos, subNodes)
                    postParrallelCurrent = postParrallelCurrent.join(currentOpts.current)

                    if (!currentOpts.current.isPositive()) {
                        // if the return current is 0 its just about propagating that there is no current - voltage checks can be ignored
                        continue
                    }

                    if (!isFinite(branchResistance.impedance)) {
                        continue
                    }


                    if (Math.abs(currentOpts.voltage.dropped(afterBlockVoltage).voltage) > 0.001) {
                        debugger
                    }
                }
                options = {
                    ...options,
                    voltage: afterBlockVoltage,
                    current: postParrallelCurrent
                }
            } else {
                options = node.node.processCurrent({ ...options, fromConnection: node.connection })
            }
        }
        return options
    }



    private getTotalResistance(nodes: Array<REgistrationNode>) {
        let impedance = new Impedance(0)
        for (let i = 0; i < nodes.length; i++) {
            const currentStartElement = nodes[i];

            if (currentStartElement instanceof Array) {
                const subImpedances = currentStartElement.map(subNodes => {
                    const sub = this.getTotalResistance(subNodes);
                    this.resistanceMap.set(subNodes, sub)
                    return sub;
                }).filter(imp => !isNaN(imp.impedance));
                if (!subImpedances.length) {
                    debugger
                    return new Impedance(NaN)
                }
                const parralelBlockImpedance = Impedance.parrallel(subImpedances);
                this.resistanceMap.set(currentStartElement, parralelBlockImpedance);
                impedance = impedance.chain(parralelBlockImpedance)
            } else {
                impedance = impedance.chain(currentStartElement.node.getImpedance({
                    from: currentStartElement.connection
                }))
            }

        }
        return impedance

    }

    public computeNetwork() {
        const nodes: Array<REgistrationNode> = [];
        this.battery.register({
            nodes,
            until: this.battery.inC,
            from: this.battery,
            parrallelLevel: 0,
            registrationTimestamp: Date.now(),
            withSerialise: false,
            forCalculation: true
        });

        this.mergeArrays(nodes)
        this.registeredNodes = nodes;
        this.hasCheckedNetwork = true
    }


    private mergeArrays(nodes: Array<REgistrationNode>) {
        for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
            const nodeEl = nodes[nodeIndex]
            if (nodeEl instanceof Array) {
                for (const subArray of nodeEl) {
                    this.mergeArrays(subArray)
                }

                let same = true
                while (same) {


                    let node = nodeEl[0].at(-1)

                    if ("node" in node) {
                        for (let i = 1; i < nodeEl.length; i++) {
                            const currentEl = nodeEl[i].at(-1)
                            if (!("node" in currentEl) || currentEl.node !== node.node) {
                                same = false
                                break;
                            }
                        }
                        if (same) {
                            for (const subAr of nodeEl) {
                                subAr.pop()
                            }
                            nodes.splice(nodeIndex + 1, 0, node)
                        }

                    } else {
                        same = false
                        //nested parrallel (TODO)

                    }
                }
            } else {
                nodeEl.node.solver = this
            }
        }
    }

}