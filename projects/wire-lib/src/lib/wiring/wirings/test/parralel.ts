import type { Collection } from '../collection'
import { ParrallelWire } from '../parrallel-wire'
import { Wire } from '../wire'

export function connectParralel(...nodes: Array<Array<Collection>>): [ParrallelWire, ParrallelWire] {
    const parrallelStart = new ParrallelWire()
    const parrallelEnd = new ParrallelWire()

    nodes.forEach(connectedSet => {
        Wire.connectNodes(...connectedSet)
        parrallelStart.newOutC(connectedSet[0].inC)
        parrallelEnd.newInC(connectedSet[connectedSet.length - 1].outC)
    })
    return [parrallelStart, parrallelEnd];
}