import type { Connection } from '../connection';
import { Current } from '../units/current';
import { Impedance } from '../units/impedance';
import { Voltage } from '../units/voltage';
import type { Wire } from '../wire';
import type { Wiring } from '../wiring.a';


import type { REgistrationNode } from '../interfaces/registration';

import { encodeNumberToChars } from '../../util/ascii-encode';
import { sum } from '../../util/array';
import { solver } from '../../util/solver';




interface IterateNodesOpts {
    nodes: Array<REgistrationNode>
    currentIndex: string

    currentProvider: Wiring

    source: VoltageSource
}


interface Label {
    index: string
    resistance: Impedance
    currentFraction: () => any
    current: () => Current;
    currentComputed?: Current
    voltageDrop: () => Voltage;
    voltageComputed?: Voltage
}

interface CircuitNodeData {
    node: Wiring;
    resistance: Impedance;
    current: (() => Current);
    voltageDrop: () => Voltage;

    instances: Array<{ ref: string, parent: string }>
}

interface VoltageSource {
    source: Wiring;

    ground: Connection
    nodes: Array<REgistrationNode>;

    /**
    * just for debugging
    * (node=> circuit data doesnt even really make sense cause a node can have different independent connections)
    */
    _registrationNodeData?: Map<REgistrationNode | Array<REgistrationNode>, Label>
}

export class ComputationMatrix {



    data = new Map<Connection, CircuitNodeData>()

    fncs: Array<string>


    finalized = false


    labels: Record<string, Label> = {}
    impedances: Record<string, { index: string, impedance: Impedance }> = {}

    nodeCurrents = new Map<Connection, Array<string>>()
    solution: Record<string, number>;

    usedResistances = new Set<string>()
    usedCurrents = new Set<string>()

    currentExpressions: Record<string, () => {
        currentIndex: string,
        multiplier: number
    }> = {}

    private sourceMaps = new Map<Wiring, string>()

    constructor(private voltageSources: Array<VoltageSource>) {
        this.usedResistances = new Set()
        const sources = voltageSources.filter(s => s.source.providedVoltage().isPositive())

        let currentExpressions: Array<{ index: string, expr: () => string }> = []

        for (let i = 0; i < sources.length; i++) {
            const currentIndex = encodeNumberToChars(i)
            const currentSource = sources[i];
            this.sourceMaps.set(currentSource.source, currentIndex)
            const self = this
            const initialLabel: Label = {
                index: currentIndex,
                currentFraction() {
                    return "1"
                },
                current: () => {
                    return initialLabel.currentComputed ??= this.solveCurrent(currentIndex)
                },
                voltageDrop() {
                    //gets overwritten during registering source
                    // debugger
                    return initialLabel.voltageComputed ??= Voltage.ZERO
                },
                get resistance() {
                    return self.impedanceForNode(currentIndex)
                }
            };
            this.labels[currentIndex] = initialLabel

            this.data.set(currentSource.ground, {
                voltageDrop: () => Voltage.ZERO,
                current: () => this.solveCurrent(currentIndex)
            } as CircuitNodeData)


            this.currentExpressions[currentIndex] = () => ({
                currentIndex,
                multiplier: 1
            })
            currentSource._registrationNodeData = new Map()
            const expr = this.iterateNodes({
                // remeove end battery
                nodes: currentSource.nodes.slice(0, -1),
                currentIndex,
                currentProvider: currentSource.source,
                source: currentSource
            })
            this.impedances[currentIndex] = {
                index: currentIndex,
                impedance: Impedance.combine(expr.resistanceExpr.map(r => this.impedances[r].impedance))
            }

            currentExpressions.push({
                expr: () => `0=${expr.expr()}`,
                index: currentIndex
            })
        }

        let currentExprStr = currentExpressions.map(e => e.expr());

        const expressions = Object.values(this.impedances)
            .filter(e => isFinite(e.impedance.impedance) && this.usedResistances.has(e.index))
            .forEach(e => {

                for (let i = 0; i < currentExprStr.length; i++) {
                    currentExprStr[i] = currentExprStr[i].replace(`R${e.index}__`, `${e.impedance.impedance}`)

                }
            });
        // DO NOT randonly add expressinos unless neccessary 😅 those increase exponentially
        const equations = [...currentExprStr];

        if (equations.length === 1) {
            // lib behaves differently with only one equation
            this.solution = {
                Ia___: +solver(equations[0]).solveFor("Ia___")[0]
            }
        } else {
            for (let i = 0; i < equations.length; i++) {

                let currentExpr = equations[i]

                for (const c of currentExpressions) {
                    currentExpr = currentExpr.replace(new RegExp(`I${c.index}___`, "g"), "")
                }
                const stillHasVariable = currentExpr.match(/I(?<name>[_a-z]*?)___/)
                let name = stillHasVariable?.groups?.["name"];
                while (name) {
                    const expr = this.currentExpressions[name]()
                    equations[i] = equations[i].replace(`I${name}___`, `(${expr.multiplier}*I${expr.currentIndex}___)`)
                    currentExpr = currentExpr.replace(`I${name}___`, ``)


                    const stillHasVariable = currentExpr.match(/I(?<name>[_a-z]*?)___/)
                    name = stillHasVariable?.groups?.["name"];
                }
                //currentExprStr[i] = currentExprStr[i].replace(`R${e.index}__`, `${e.impedance.impedance}`)

            }
            this.solution = solver.solveEquations([...equations])



        }
    }
    getPowerSource(w: Wiring) {
        return this.voltageSources.find(s => s.source === w)
    }

    getImpedance(source: Wiring): Impedance {
        const ref = this.sourceMaps.get(source);
        if (ref) {
            return this.impedanceForNode(ref)
        } else {
            debugger
        }
    }

    getCurrent(source: Wiring): Current {
        const ref = this.sourceMaps.get(source);
        if (ref) {
            return this.solveCurrent(ref)
        } else {
            debugger
        }
    }

    impedanceForNode(nodeRef: string) {
        return this.impedances[nodeRef].impedance
    }

    iterateNodes(opts: IterateNodesOpts) {
        let expr: Array<(() => string)> = []

        let resistanceExprParts: Array<string> = []


        for (let nodeI = 0; nodeI < opts.nodes.length; nodeI++) {
            const node = opts.nodes[nodeI]
            const nodeRef = opts.currentIndex + "_" + encodeNumberToChars(nodeI)
            if (node instanceof Array) {




                let lanesImpedances = node.map((parrallelLane, i) => {
                    const laneRef = nodeRef + "_" + encodeNumberToChars(i)
                    const subExpression = this.iterateNodes({
                        ...opts,
                        nodes: parrallelLane,
                        currentIndex: laneRef
                    })

                    const combined = Impedance.combine(subExpression.resistanceExpr.map(r => this.impedances[r].impedance))
                    const branchLabel: Label = {
                        index: laneRef,
                        current: () => {
                            return branchLabel.currentComputed ??= Current.fromVoltage(branchLabel.voltageDrop(), combined);
                        },
                        voltageDrop: () => {
                            return branchLabel.voltageComputed ??= this.labels[nodeRef].voltageDrop();
                        },
                        currentFraction: function () {
                            debugger
                        },
                        resistance: combined
                    };
                    this.labels[laneRef] = branchLabel

                    opts.source._registrationNodeData.set(parrallelLane, branchLabel)


                    this.impedances[laneRef] = {
                        impedance: combined,
                        index: laneRef
                    }

                    this.currentExpressions[laneRef] = () => {
                        if (!this.currentExpressions[opts.currentIndex]) {
                            debugger
                        }

                        const parnetResistanceTotal = this.impedances[opts.currentIndex].impedance.impedance
                        const branchPercentage = parnetResistanceTotal / combined.impedance


                        const parentCurrentRef = this.currentExpressions[opts.currentIndex]()


                        //return `${parentCurrentRef} * ${branchPercentage}`

                        return {
                            ...parentCurrentRef,
                            multiplier: parentCurrentRef.multiplier * branchPercentage
                        }
                    }


                    return combined
                })
                const impedanceExp = Impedance.parrallel(lanesImpedances)

                const parentLabel: Label = {
                    resistance: impedanceExp,
                    index: nodeRef,
                    currentFraction() {
                        debugger
                    },
                    current: () => {
                        return parentLabel.currentComputed ??= this.labels[opts.currentIndex].current()
                    },
                    voltageDrop: () => {



                        const parent = this.labels[opts.currentIndex];
                        const parnetVoltage = parent.voltageDrop()

                        let resistancePercent = impedanceExp.percentOf(parent.resistance);
                        if (!isFinite(resistancePercent)) {
                            debugger
                        }


                        if (!impedanceExp.isFinite()) {
                            // the first element gets all the voltage if its infinite (comparator use case)
                            if (nodeRef.endsWith("_a")) {
                                resistancePercent = 1
                            } else {
                                resistancePercent = 0
                            }


                        }

                        return parentLabel.voltageComputed ??= parnetVoltage.fraction(resistancePercent)
                    }

                };
                this.labels[nodeRef] = parentLabel
                opts.source._registrationNodeData.set(node, parentLabel)



                this.impedances[nodeRef] = {
                    impedance: impedanceExp,
                    index: nodeRef
                }

                resistanceExprParts.push(`${nodeRef}`)


                //this.currentExpressions[nodeRef] = () => `-(R${nodeRef}*${opts.currentIndex})`


                expr.push(() => {
                    this.usedResistances.add(nodeRef)
                    return `-(R${nodeRef}__*I${opts.currentIndex}___)`;
                })

            } else {

                const compImpedance = node.node.getImpedance({ from: node.connection });
                if (compImpedance.isPositive()) {
                    this.impedances[nodeRef] = {
                        index: nodeRef,
                        impedance: compImpedance

                    }

                    resistanceExprParts.push(`${nodeRef}`)

                }

                const providedVoltage = node.node.providedVoltage()

                if (providedVoltage.isPositive() && node.node === opts.currentProvider) {
                    expr.push(() => `+${providedVoltage.voltage}`)
                    //this.currentExpressions[nodeRef] = () => `+${providedVoltage.voltage}`
                    const voltage = this.labels[opts.currentIndex]?.voltageDrop


                    opts.source._registrationNodeData.set(node, {
                        resistance: Impedance.ZERO
                    } as Label)
                    this.labels[opts.currentIndex].voltageDrop = () => {
                        //debugger
                        return this.labels[opts.currentIndex].voltageComputed = (voltage?.() ?? Voltage.ZERO).with(providedVoltage)
                    }

                }

                const nodeLabel: Label = {
                    index: nodeRef,
                    current: () => {
                        const currents = this.nodeCurrents.get(node.connection);

                        //  nodeLabel.currentComputed = this.labels[opts.currentIndex].current()
                        return new Current(sum(currents.map(c => {
                            this.usedCurrents.add(c)
                            return this.labels[c].current().current;
                        })));
                    },
                    voltageDrop: () => {
                        if (nodeLabel.voltageComputed) {
                            return nodeLabel.voltageComputed
                        }

                        const parents = this.data.get(node.connection).instances



                        const voltages = parents.map(parentStr => {
                            const parent = this.labels[parentStr.parent];
                            const parnetVoltage = parent.voltageDrop()

                            let resistancePercent = compImpedance.percentOf(parent.resistance);
                            if (!compImpedance.isFinite()) {
                                // the first element gets all the voltage if its infinite (comparator use case)
                                if (parentStr.ref.endsWith("_a")) {
                                    resistancePercent = 1
                                } else {
                                    resistancePercent = 0
                                }


                            }

                            return parnetVoltage.fraction(resistancePercent)
                        })

                        return nodeLabel.voltageComputed = Voltage.fromParents(voltages)

                    },
                    currentFraction: function () {
                        debugger
                    },
                    resistance: compImpedance
                };

                let previusNodeCurrents = this.nodeCurrents.get(node.connection);
                if (!previusNodeCurrents) {
                    previusNodeCurrents = []
                    this.nodeCurrents.set(node.connection, previusNodeCurrents)
                }
                previusNodeCurrents.push(opts.currentIndex)
                if (compImpedance.isPositive()) {


                    expr.push(() => {
                        this.usedResistances.add(nodeRef)
                        const currents = this.nodeCurrents.get(node.connection)
                        currents.forEach(c => {
                            this.usedResistances.add(c)
                        })
                        //this.currentExpressions[nodeRef] = () => `-(R${nodeRef}*(${currents.join("+")}))`

                        return `-(R${nodeRef}__*(${currents.map(c => `I${c}___`).join("+")}))`;
                    })

                }
                this.labels[nodeRef] = nodeLabel
                opts.source._registrationNodeData.set(node, nodeLabel)

                const prev = this.data.get(node.connection)
                if (prev) {
                    prev.instances.push({
                        parent: opts.currentIndex,
                        ref: nodeRef
                    })
                } else {
                    this.data.set(node.connection, {
                        ...nodeLabel,
                        node: node.node,
                        resistance: compImpedance,
                        instances: [{
                            parent: opts.currentIndex,
                            ref: nodeRef
                        }]
                    })
                }


            }
        }

        return { expr: () => expr.map(e => e()).join("+"), resistanceExpr: resistanceExprParts };
    }

    solveCurrent(currentRef: string) {
        let current = this.solution[`I${currentRef}___`]
        return new Current(current)

    }


    /*register(node: Wiring, from: Connection,) {
        let current = "i"
        const compImpedance = node.getImpedance({ from: from });

        const providedVoltage = node.providedVoltage()

        if (providedVoltage.isPositive()) {
            this.expr = this.expr.add(providedVoltage.voltage)
        }


        if (compImpedance.isPositive()) {
            this.expr = this.expr.subtract(`${compImpedance.impedance}${current}`)
        }

        /* this.data.set(con, {
             node: con.parent,
             resistance: compImpedance,
             current: () => this.currentMap.get(current),
             voltage: () => Voltage.fromCurrent(this.solveCurrent(current), compImpedance)
         })*
    }*/
    calulcateFor(outC: Connection | null, inC: Connection | null, arg2: Voltage) {

        if (!this.finalized) {
            //this.solveCurrent("i")
            debugger
            this.finalized = true
        }
        debugger
    }

}