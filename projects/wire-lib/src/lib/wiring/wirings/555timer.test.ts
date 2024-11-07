

import { Timer555Plan } from "./555timer"
import { Battery } from './battery'
import { Capacitor } from './capacator'
import { CircuitSolver } from './computation/circuit-solver'
import { ComputationMatrix } from './computation/computation-matrix'
import { LED } from './led'
import { Resistor } from './resistor'
import { Capacitance } from './units/capacitance'
import { Wire } from './wire'
describe("Timer555Plan", () => {

    it("runs?", () => {

        const battery = new Battery(5, Infinity)
        battery.enabled = true


        const timer = new Timer555Plan()

        const init1k = new Resistor(1000)
        init1k.name = "init1k"

        const thresholdResistor = new Resistor(100000)
        thresholdResistor.name = "thresholdResistor"

        const capacitor = new Capacitor(1, 10)

        const statusLed = new LED()
        statusLed.name = "statusLed"


        Wire.connect(battery.outC!, init1k.inC!,).connectWire(timer.vcc)

        Wire.connect(init1k.outC!, thresholdResistor.inC!, timer.discharge)

        Wire.connect(thresholdResistor.outC!, timer.threshhold, timer.trigger, capacitor.inC)



        timer.output.connect(statusLed.inC!)
        Wire.connect(battery.inC!, capacitor.outC, statusLed.outC!).connectWire(timer.ground)

        const solver = new CircuitSolver(battery, capacitor)
        solver.recalculate()
        //debugger


        timer.debugRefs.comparator16.name = "comparator16"
        timer.debugRefs.comparator33.name = "comparator33"

        const debugNodes = solver.log({ withImp: true })
        //debugger

        const capStep = capacitor.getTimeConstant(solver.powerSources[0].totalImpedance)

        solver.check(capStep.step(3))
        expect(capacitor.getVoltage().voltage).toBeLessThan(timer.debugRefs.comparator16.positiveVoltage.voltage)
        const voltageDiff = timer.debugRefs.comparator16.getVoltageDifferential()
        expect(voltageDiff.voltage).toBeLessThan(0)

        solver.check(capStep.step(3))
        expect(capacitor.getVoltage().voltage).toBeGreaterThan(timer.debugRefs.comparator16.positiveVoltage.voltage)


        debugger
        const voltageDiffhigher = solver.computed.data.get(timer.debugRefs!.comparator16!.negative!)!.voltageDrop().voltage

        debugger
        const voltageDiff2 = timer.debugRefs.comparator16.getVoltageDifferential()
        expect(voltageDiff2.voltage).toBeLessThan(0)

        solver.check(capStep.step(3))
        const voltageDiff3 = timer.debugRefs.comparator16.getVoltageDifferential()
        expect(voltageDiff3.voltage).toBeLessThan(0)
        debugger
    })
})