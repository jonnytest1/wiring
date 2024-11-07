import type { ConnectConfig } from 'rxjs'
import { Collection } from './collection'
import { Wire } from './wire'
import { Connection } from './connection'

export function connectParralel(...nodes: Array<Array<Collection>>) {
    const parrallelStart = new Wire()
    const parrallelEnd = new Wire()

    nodes.forEach(connectedSet => {
        connectNodes(...connectedSet)
        parrallelStart.connect(connectedSet[0].inC)
        parrallelEnd.connect(connectedSet[connectedSet.length - 1].outC)
    })
    return new Collection(parrallelStart.createConnectionLink(), parrallelEnd.createConnectionLink())
}


// | Array<Collection> | ParrallelWire
export function connectNodes(...nodes: Array<Collection | Connection>) {
    let lastEl: Collection | Connection;
    nodes.forEach(node => {
        /* if (node instanceof Array) {
             node = new Parrallel(...node);
         }*/

        if (lastEl) {
            let inC = lastEl
            if (inC instanceof Collection) {
                inC = inC.inC!;
            }

            let outC = node
            if (outC instanceof Collection) {
                outC = outC.outC!;
            }
            Wire.connect(inC, outC);
        }
        // node.controlContainer = this
        // this.nodes.push(node)
        // this.connectFirst()
        lastEl = node;
    });
}