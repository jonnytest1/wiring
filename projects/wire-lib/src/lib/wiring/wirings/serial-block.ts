/*import { FromJson, FromJsonOptions } from '../serialisation';
import { UINode } from '../wiring-ui/ui-node.a';
import { Collection } from './collection';
import { Connection } from './connection';
import { ControlCollection, StrucureReturn } from './control-collection.a';
import { Parrallel as ParrallelConnected } from './parrallel';
import { Resistor } from './resistor';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class SerialConnected extends ControlCollection implements Wiring {


    nodes: (Collection & Wiring)[] = [];

    innerInC = new Connection(this, "ser_inner_in")
    innerOutC = new Connection(this, "ser_inner_out")

    constructor(...nodes: Array<Collection & Wiring>) {
        super(null, null)
        this.inC = new Connection(this, "ser_in");
        this.outC = new Connection(this, "ser_out");


        this.addNodes(...nodes)
    }
    uiNode?: UINode<Wiring>;


    blockResistance: number;

    inVoltage: number

    blockDrop: number


    private resistanceAfterNodes: number

    public addNodes(...nodes: Array<Collection & Wiring>) {
        nodes.forEach(node => {
            let lastEl
            if (this.nodes.length) {
                lastEl = this.nodes[this.nodes.length - 1].outC;
            }
            if (lastEl) {
                lastEl.connectedTo = undefined
                Wire.connect(lastEl, node.inC)
            }
            // node.controlContainer = this
            this.nodes.push(node)
            this.connectFirst()
        })
    }

    connectLast() {
        let lastEl = this.innerInC
        if (this.nodes.length) {
            lastEl = this.nodes[this.nodes.length - 1].outC;
        }
        lastEl.connectedTo = undefined
        Wire.connect(lastEl, this.innerOutC)
    }
    connectFirst() {
        let firstEl
        if (this.nodes.length) {
            firstEl = this.nodes[0]?.inC;
        }
        Wire.connect(this.innerInC, firstEl)
    }
    connectContainerNodes() {
        this.connectLast()
        //  this.connectFirst()
    }



    getTotalResistance(from: Wiring, options: GetResistanceOptions): number {
        if (from == this.innerOutC) {
            this.resistanceAfterNodes = this.outC.getTotalResistance(this, options);
            return this.resistanceAfterNodes
        }
        const resistanceWithNodes = this.innerInC.getTotalResistance(this, options);
        this.blockResistance = resistanceWithNodes - this.resistanceAfterNodes
        return resistanceWithNodes
    }
    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (from == this.innerOutC) {
            //this.voltageDrop = this.inVoltage - options.voltage
            return this.outC.pushCurrent(options, this)
        }
        //this.inVoltage = options.voltage
        this.blockDrop = (options.current * this.blockResistance)
        return this.innerInC.pushCurrent({
            ...options,
            //  voltage: options.voltage - this.voltageDrop
        }, this);

    }
    removeAfter(connectedTo: Wire) {
        const nodes = []
        connectedTo.register({ nodes, until: this.innerOutC, from: this });
        nodes.pop()// self
        nodes.pop() //outC

        for (let i = this.nodes.length - 1; i >= 0; i--) {
            for (const node of nodes) {
                if (this.nodes[i] == node) {
                    this.nodes.splice(i, 1);
                    break;
                }
            }
        }
        let lastEl = this.innerInC
        if (this.nodes.length) {
            lastEl = this.nodes[this.nodes.length - 1].outC;
        }
        Wire.connect(lastEl, this.innerOutC)
    }
    register(options: { nodes: any[]; until: Wiring; from?: Wiring; }) {
        if (options.from == this.innerOutC) {
            if (this.innerOutC == options.until) {
                options.nodes.push(this)
                return
            }
            return this.outC.register({ ...options, from: this });
        }
        options.nodes.push(this)
        return this.innerInC.register({ ...options, from: this })
    }

    getStructure(detailed = false): StrucureReturn {
        if (detailed) {
            const nodes = []
            this.register({ nodes, until: this.innerOutC, });
            return nodes;
        }
        return this.nodes.map(node => node instanceof ControlCollection ? node.getStructure() : node);
    }

    toJSON(): any {
        return {
            type: SerialBlock.typeName,
            nodes: this.nodes,
            connectedTo: this.outC.connectedTo
        }
    }
}*/