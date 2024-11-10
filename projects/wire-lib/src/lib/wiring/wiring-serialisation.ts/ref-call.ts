import type { Wiring } from '../wirings/wiring.a'

type CallbackFucntion = (obj: Wiring) => void


export class ReferenceCall {


    callbacks: Array<CallbackFucntion> = []


    resolvedWith: Wiring
    constructor(public reference: string, callback: CallbackFucntion) {
        this.callbacks.push(callback)
    }

    static resolve(obj: Wiring) {
        const el = new ReferenceCall("", () => {

        })
        el.resolvedWith = obj

        return el
    }


    then(cb: CallbackFucntion) {

        if (this.resolvedWith) {
            cb(this.resolvedWith)
        } else {
            this.callbacks.push(cb)
        }
    }


    resolve(obj: Wiring) {
        this.callbacks.forEach(cb => cb(obj))
    }

}