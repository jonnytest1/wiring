
import { Timer555Plan } from "./555timer"
import { Battery } from './battery'
import { Capacitor } from './capacator'
import { CircuitSolver } from './computation/circuit-solver'
import { LED } from './led'
import { Resistor } from './resistor'
import { Time } from './units/time'
import { Wire } from './wire'
describe("Timer555Plan", () => {

    it("runs?", () => {

        const battery = new Battery(5, Infinity)
        battery.enabled = true

        const timer = new Timer555Plan()
        const init1k = new Resistor(1000)
        const thresholdResistor = new Resistor(100000)
        const capacitor = new Capacitor(1, 10)
        const statusLed = new LED()

        Wire.connect(battery.outC!, init1k.inC!,).connectWire(timer.vcc)
        Wire.connect(init1k.outC!, thresholdResistor.inC!, timer.discharge)
        Wire.connect(thresholdResistor.outC!, timer.threshhold, timer.trigger, capacitor.inC)

        timer.output.connect(statusLed.inC!)
        Wire.connect(battery.inC!, capacitor.outC, statusLed.outC!).connectWire(timer.ground)


        init1k.name = "init1k"
        thresholdResistor.name = "thresholdResistor"
        capacitor.name = "cap"
        statusLed.name = "statusLed"
        timer.debugRefs.comparator16.name = "comparator16"
        timer.debugRefs.comparator33.name = "comparator33"
        timer.debugRefs.srLatch._debug.set._debug.notGate.name = "srInvQNotGate"

        const solver = new CircuitSolver(battery, capacitor)
        solver.recalculate()
        //debugger


        const debugNodes = solver.log({ serialize: true })
        //debugger
        debugger
        const capStep = capacitor.getTimeConstant(solver.powerSources[0].totalImpedance)

        const shortStep = capStep.dividedStep(10)

        solver.check(capStep.dividedStep(3))
        expect(capacitor.getVoltage().voltage).toBeLessThan(timer.debugRefs.comparator16.positiveVoltage.voltage)
        const voltageDiff = timer.debugRefs.comparator16.getVoltageDifferential()
        expect(voltageDiff.voltage).toBeLessThan(0)

        let capVoltagePreTrigger = capacitor.getVoltage().voltage

        while (capVoltagePreTrigger < 1.67) {
            solver.check(capStep.dividedStep(10))
            // might be true initially cause of how the sr latch initializes
            // should be false by here
            expect(timer.debugRefs.dischargeTransistor.open).toBeFalsy()

            expect(timer.debugRefs.comparator16.isEnabled()).toBeTruthy()
            capVoltagePreTrigger = capacitor.getVoltage().voltage
        }


        let capVoltagePostTrigger = capacitor.getVoltage().voltage

        expect(capVoltagePostTrigger).toBeGreaterThan(1.67)
        // still false
        expect(timer.debugRefs.comparator33.isEnabled()).toBeFalsy()
        expect(capVoltagePreTrigger).toBeGreaterThan(timer.debugRefs.comparator16.positiveVoltage.voltage)
        solver.check(capStep.dividedStep(10))
        // trigger off
        expect(timer.debugRefs.comparator16.isEnabled()).toBeFalsy()

        while (capVoltagePostTrigger < 3.33) {
            expect(timer.debugRefs.comparator33.isEnabled()).toBeFalsy()
            capVoltagePostTrigger = capacitor.getVoltage().voltage
            solver.check(capStep.dividedStep(10))
        }
        //debugger
        //shsould be around 1.7V snce it comes directly fr om the capactiro


        const voltageDiffhigher = solver.computed.data.get(timer.debugRefs!.comparator16!.negative!)!.voltageDrop().voltage
        expect(voltageDiffhigher).toBeGreaterThan(3.33)
        //debugger
        expect(capacitor.getVoltage().voltage).toBeGreaterThan(3.3)
        // enable on comparator
        expect(timer.debugRefs.comparator33.isEnabled()).toBeTruthy()
        expect(timer.debugRefs.comparator16.isEnabled()).toBeFalsy()
        // update or gate
        solver.check(capStep.dividedStep(10))
        // => trigger reset
        expect(timer.debugRefs.srLatch._debug.reset._debug.orGate.isEnabled()).toBeTruthy()
        // update not gate (oO 3 times ?)
        solver.check(capStep.dividedStep(10))
        solver.check(capStep.dividedStep(10))
        solver.check(capStep.dividedStep(10))
        //debugger
        //
        expect(timer.debugRefs.srLatch._debug.qInvEnabled.enabled).toBeTruthy()
        // update transistor transistor
        solver.check(capStep.dividedStep(10))
        expect(timer.debugRefs.dischargeTransistor.open).toBeTruthy()

        debugger
        solver.check(shortStep)
        solver.check(shortStep)
        debugger




        let t = new Time(0)
        const charginSTeps: Array<any> = []

        while (t.seconds < 1000000) {
            t.step(shortStep)
            solver.check(shortStep)
            charginSTeps.push([capacitor.isCharging(), capacitor.charge.coulomb])
        }
        debugger

        /*  const capVoltageCharged = capacitor.getVoltage().voltage
 
         const voltageDiffThreshhold = solver.computed.data.get(timer.debugRefs!.comparator33!.positive!)!.voltageDrop().voltage
         expect(voltageDiffhigher).toBe(1.7483099974686578)
 
 
         timer.debugRefs.comparator33.positiveVoltage
         const transistoreOpen = timer.debugRefs.dischargeTransistor.open
         timer.debugRefs.srLatch._debug.set._debug.notGate
         debugger
         const voltageDiff2 = timer.debugRefs.comparator16.getVoltageDifferential()
         expect(voltageDiff2.voltage).toBeLessThan(0)
 
         solver.check(capStep.dividedStep(3))
         const voltageDiff3 = timer.debugRefs.comparator16.getVoltageDifferential()
         expect(voltageDiff3.voltage).toBeLessThan(0)
         debugger */
    })
})