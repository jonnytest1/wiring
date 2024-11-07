export class Capacitance {
    // in farad

    constructor(public readonly farad: number) {

    }
    static fromMicro(microFarad: number) {
        return new Capacitance(microFarad / 1000000)
    }
}   