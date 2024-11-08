// NOSONAR
import { Battery } from '../battery';
import { Capacitor } from '../capacator';
import { Connection } from '../connection';
import type { CalcNode, PowerSource, RegisterOptions, REgistrationNode, RegistrationNodeObject } from '../interfaces/registration';
import { Current } from '../units/current';
import { Impedance } from '../units/impedance';
import type { Time } from '../units/time';
import { Voltage } from '../units/voltage';
import { Wire } from '../wire';
import { IndexableConstructor, ProcessCurrentOptions, Wiring, type Indexable, type IndexableStatic } from '../wiring.a';
import { ComputationMatrix } from './computation-matrix';



interface ArrayMergeOpts {
    arrayMergeIds: Map<Array<REgistrationNode> | REgistrationNode, string>
}

export class CircuitSolver {

    //registeredNodes: Array<REgistrationNode>


    // resistanceMap = new Map<Array<REgistrationNode> | Array<Array<REgistrationNode>>, Impedance>()
    //nodeResistanceMAp = new Map<Wiring, Impedance>()

    private hasCheckedNetwork = false

    //private maxVoltage: Voltage | null = null
    ground: Connection;

    //private compMatrix = new ComputationMatrix()

    powerSources: Array<PowerSource>
    computed: ComputationMatrix;
    constructor(...powerSources: Array<Battery | Capacitor | {
        source: Wiring,
        ground: Connection
    }>) {
        let needsGround = false;
        this.powerSources = powerSources.map(s => {
            if (s instanceof Battery) {
                this.ground = s.inC;
                return {
                    source: s,
                    ground: s.inC!,
                    breakOnInvalid: true
                } as PowerSource
            } else if (s instanceof Capacitor) {
                needsGround = true
                return {
                    source: s,
                    ground: null,
                    breakOnInvalid: false

                }
            }

            return { breakOnInvalid: true, ...s, };
        })


        if (needsGround && !this.ground) {
            throw new Error("didnt find node with ground")
        }
    }

    public check(deltaTime: Time) {



        if (!this.hasCheckedNetwork) {
            this.recalculate()


            //this.caluclatedImpedanceTotal = this.getTotalResistance(this.registeredNodes)
        }



        for (const source of this.powerSources) {

            if (source.invalidConfig) {
                continue
            }

            this.startProcessCurrent(deltaTime, source)
        }





    }




    public invalidate() {
        this.hasCheckedNetwork = false
    }
    public recalculate() {
        this.computeNetwork()

        const validConfigs = this.powerSources
            .filter(s => !s.invalidConfig);
        this.computed = new ComputationMatrix(validConfigs
            .map(s => ({
                nodes: s.nodes!,
                source: s.source,
                ground: s.ground
            })))

        for (const source of validConfigs) {
            if (source.source.providedVoltage().isPositive()) {
                source.totalImpedance = this.computed.getImpedance(source.source)
            }
        }



    }

    /*from(inC: Capacitor, maxVoltage: Voltage) {
        const subSolver = new CircuitSolver(inC)
        subSolver.ground = this.ground
        subSolver.maxVoltage = maxVoltage
        subSolver.breakOnInvalid = false
        subSolver.recalculate()


        return subSolver
    }*/



    startProcessCurrent(deltaTime: Time, source: PowerSource) {
        let postProcessCallbacks: Array<() => void> = []

        let optionsVoltageOnly: ProcessCurrentOptions = {
            data: this.computed,
            voltageOnlyRun: true,

            voltageDrop: new Voltage(0),
            current: new Current(0),

            supplyVoltage: new Voltage(0),
            deltaTime: deltaTime,
            triggerTimestamp: Date.now(),
            // totalImpedance: source.totalImpedance,
            // voltageChanges: [],
            nodeshistory: [],
            source,
            // currentChanges: [],
            postProcess(cb) {
                postProcessCallbacks.push(cb)
            },
        }

        this.processCurrentRecursive(optionsVoltageOnly, source.nodes)

        let options: ProcessCurrentOptions = {
            ...optionsVoltageOnly,
            voltageOnlyRun: false,
            triggerTimestamp: Date.now(),
            nodeshistory: [],
            // currentChanges: [],
            postProcess(cb) {
                postProcessCallbacks.push(cb)
            },
        }
        this.processCurrentRecursive(options, source.nodes)

        for (const postProcessCallback of postProcessCallbacks) {
            postProcessCallback()
        }


    }

    processCurrentRecursive(options: ProcessCurrentOptions, nodes: Array<REgistrationNode>) {
        for (const element of nodes) {
            const node = element
            if (node instanceof Array) {

                // isFinite(blockImpedance.impedance) ? Voltage.fromCurrent(options.current, blockImpedance) : Voltage.ZERO

                for (const subNodes of node) {
                    const subOptinos: ProcessCurrentOptions = {
                        ...options,
                        // current: new Current(NaN),
                        nodeshistory: [...options.nodeshistory]
                    }
                    this.processCurrentRecursive(subOptinos, subNodes)
                }
            } else {
                options.nodeshistory.push(node.node)

                if (options.voltageOnlyRun) {
                    if (node.connection) {
                        const connectionData = this.computed.data.get(node.connection)
                        if (!connectionData) {
                            debugger;
                        }
                        const v = connectionData.voltageDrop()
                        node.node.setVoltage(node.connection, v)
                    }
                } else {
                    if (node.connection) {
                        const connectionData = this.computed.data.get(node.connection)
                        if (!connectionData) {
                            debugger;
                        }
                        options = {
                            ...options,
                            current: connectionData.current(),
                            voltageDrop: connectionData.voltageDrop()
                        }


                    }
                    options = node.node.processCurrent({
                        ...options,
                        fromConnection: node.connection
                    })

                }


            }
        }
        return options
    }

    public computeNetwork() {

        for (const source of this.powerSources) {
            const nodes: Array<REgistrationNode> = [];
            source.ground ??= this.ground
            const optinos: RegisterOptions = {
                source,
                nodes,
                until: source.ground,
                from: null,
                parrallelLevel: 0,
                registrationTimestamp: Date.now(),
                withSerialise: false,
                forCalculation: true,
                callConnections: [],
                next: this.nextRegistration.bind(this),
                add: node => {
                    optinos.nodes.push(node)
                }
            };

            this.nextRegistration(source.source, optinos)
            this.removeSkippedLoops(nodes, { source });

            const arrayMergeIds = new Map<Array<REgistrationNode> | REgistrationNode, string>()
            this.mergeArrays(nodes, {
                arrayMergeIds
            })


            const ground = nodes.at(-1);
            if (!(ground instanceof Array)) {
                if (ground.node !== this.ground.parent) {
                    source.invalidConfig = true

                    if (source.breakOnInvalid) {
                        debugger
                    }
                }
            }
            source.nodes = nodes
        }
        this.hasCheckedNetwork = true
    }
    removeSkippedLoops(nodes: REgistrationNode[], opts: { source: PowerSource }) {


        const last = nodes.at(-1)

        if (last instanceof Array) {

            for (let i = last.length - 1; i >= 0; i--) {

                const hasBattery = this.removeSkippedLoops(last[i], opts)
                if (hasBattery === "noground") {
                    last.splice(i, 1)
                }

            }
            let changed = false
            if (last.length == 1) {
                changed = true
                nodes.splice(nodes.length - 1, 1, ...last[0])
            } else if (last.length == 0) {
                changed = true
                nodes.splice(nodes.length - 1, 1)
            }

            if (nodes.length === 0) {
                return "noground"
            }
            if (changed) {
                return this.removeSkippedLoops(nodes, opts)
            }
        } else if (last.connection !== opts.source.ground) {
            return "noground"
        }
        return true
    }


    nextRegistration(node: CalcNode, options: RegisterOptions): void | false {
        const from = options.from
        if (node instanceof Connection && options.nodes.length && from) {
            const lastNode = options.nodes.at(-1)
            if (!(lastNode instanceof Array)) {
                lastNode.out = node
            }

        }

        if (node.calculationData?.voltageBefore?.get(from)?.isGreaterThan(options.source.maxVoltage)) {
            //debugger
            return
        }
        if (node && options.callConnections.includes(node) && from != options.source.ground) {
            return false
        }

        //this.compMatrix.register(options.from, node)
        options.callConnections.push(node)

        options.add = node => {
            if (!(node instanceof Array)) {
                node.connection = from
            }
            options.nodes.push(node)
        }

        const registration = node.register(options)

        return registration
    }


    private mergeArrays(nodes: Array<REgistrationNode>, opts: ArrayMergeOpts) {
        let arrayId = ""
        for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
            const nodeEl = nodes[nodeIndex]
            if (nodeEl instanceof Array) {

                let subIds = []

                for (const subArray of nodeEl) {
                    const subArrayId = this.mergeArrays(subArray, opts)

                    opts.arrayMergeIds.set(subArray, subArrayId)
                    subIds.push(subArrayId)
                }

                let same = true
                while (same) {


                    let node = nodeEl[0].at(-1)

                    let isArray = node instanceof Array


                    if (nodeEl.length == 1) {
                        same = false
                    }
                    for (let i = 1; i < nodeEl.length; i++) {
                        const currentEl = nodeEl[i].at(-1)

                        if (isArray !== (currentEl instanceof Array)) {
                            same = false
                            break;
                        }

                        if (currentEl instanceof Array) {
                            const currentHash = opts.arrayMergeIds.get(currentEl)
                            const firstHash = opts.arrayMergeIds.get(node)
                            if (firstHash !== currentHash) {
                                same = false
                                break;
                            }

                            debugger
                        } else {
                            if (currentEl.node !== (node as RegistrationNodeObject).node) {
                                same = false
                                break;
                            }
                        }
                    }
                    if (same) {

                        const emptiedArrays: Array<number> = []
                        for (let subArIndex = 0; subArIndex < nodeEl.length; subArIndex++) {
                            const subAr = nodeEl[subArIndex]
                            subAr.pop()

                            if (subAr.length == 0) {
                                emptiedArrays.push(subArIndex)
                            }
                        }
                        for (const emptiedArrayIndex of emptiedArrays) {
                            nodeEl.splice(emptiedArrayIndex, 1)
                        }
                        nodes.splice(nodeIndex + 1, 0, node)

                        if (nodeEl.length == 0) {
                            nodes.splice(nodeIndex, 1)
                            nodeIndex--
                            same = false
                        }
                    }




                }

                const mergeId = `(${subIds.join("|")})`;
                opts.arrayMergeIds.set(nodeEl, mergeId)
                arrayId += mergeId
            } else {
                arrayId += `${(nodeEl.node.constructor as IndexableConstructor).typeName}${nodeEl.node.nodeUuid}|`
                nodeEl.node.solver = this
            }
        }

        return arrayId
    }



    log(o: { withImp?: boolean } = {}) {
        const debugMap = this.powerSources
            .filter(s => s.source.providedVoltage().isPositive())
            .map(s => this.logMap(s.nodes, {
                ...o, source: s
            }))
        console.log(debugMap)
        return debugMap
    }


    private logMap(nodes: Array<REgistrationNode>, o: { withImp?: boolean, source: PowerSource }) {


        return nodes.map(node => {
            if (node instanceof Array) {
                let nodes = node.map(s => {
                    const subNodes = this.logMap(s, o);
                    if (o.withImp) {
                        const label = this.computed.getPowerSource(o.source.source)._registrationNodeData.get(s)

                        return {
                            imp: label.resistance,
                            p: subNodes
                        }
                    }
                    return subNodes;
                })

                return nodes
            } else {
                let name = node.node.name ?? (node.node.constructor as IndexableConstructor).typeName;
                if (o.withImp) {

                    const vS = this.computed.getPowerSource(o.source.source);

                    const label = vS?._registrationNodeData?.get(node)

                    name += ":" + label?.resistance?.impedance
                }

                return name
            }
        })
    }
}