import { Battery } from '../battery';
import { Resistor } from '../resistor';
import { Time } from '../units/time';
import { Wire } from '../wire';
import { CircuitSolver } from './circuit-solver';
import { ComputationMatrix } from './computation-matrix';
import { connectNodes, connectParralel } from "../connection-util"
describe("comp matrix", () => {
    it('wire matrix', () => {
        const battery = new Battery(10, Infinity)
        battery.enabled = true
        ///   const b2 = new Battery()
        //           bat 6V
        //             |
        //             |
        //            500
        //             |
        //             | 
        //            700
        //             |

        const resistor_500 = new Resistor(500)
        const resistor_700 = new Resistor(700)

        const w1 = Wire.connect(battery.outC!, resistor_500.inC!)
        const w2 = Wire.connect(resistor_500.outC!, resistor_700.inC!)
        const w3 = Wire.connect(resistor_700.outC!, battery.inC!)


        const solver = new CircuitSolver(battery)
        solver.recalculate()
        solver.check(new Time(1))

        const cm = new ComputationMatrix([{ nodes: solver.registeredNodes, source: battery }])
        // cm.register(battery, null as never)
        //cm.register(resistor_500, resistor_500.inC!)
        //cm.register(resistor_700, resistor_700.inC!)

        expect(cm.solveCurrent("a").current).toBe(0.008333333333333333)

        const res500drop = cm.data.get(resistor_500.inC!)!.voltageDrop()
        const res700drop = cm.data.get(resistor_700.inC!)!.voltageDrop()
        expect(res500drop.voltage).toBe(4.166666666666667)
        expect(res700drop.voltage).toBe(5.833333333333333)
    });


    it('wire matrix parrallel 1', () => {
        const battery = new Battery(24, Infinity)
        battery.enabled = true
        ///   https://www.electronics-tutorials.ws/dccircuits/kirchhoffs-current-law.html
        //    #Resistors in Parallel
        //
        //           bat 24V
        //             |
        //            / \
        //           /   \
        //          8    12
        //           \   /
        //            \ / 
        //             |

        const resistor_8 = new Resistor(8)
        const resistor_12 = new Resistor(12)

        const w1 = Wire.connect(battery.outC!, resistor_8.inC!, resistor_12.inC!)
        const w3 = Wire.connect(resistor_12.outC!, resistor_8.outC!, battery.inC!)


        const solver = new CircuitSolver(battery)
        solver.recalculate()
        solver.check(new Time(1))

        const cm = new ComputationMatrix([{ nodes: solver.registeredNodes, source: battery }])
        // cm.register(battery, null as never)
        //cm.register(resistor_500, resistor_500.inC!)
        //cm.register(resistor_700, resistor_700.inC!)


        expect(cm.solveCurrent("a").current).toBe(5)

        const res500drop = cm.data.get(resistor_8.inC!)!.current()
        expect(res500drop.current).toBe(3)


        const res12drop = cm.data.get(resistor_12.inC!)!.current()
        expect(res12drop.current).toBe(2)

        const res500Vdrop = cm.data.get(resistor_8.inC!)!.voltageDrop()
        expect(res500Vdrop.voltage).toBe(24)

        const res12Vdrop = cm.data.get(resistor_12.inC!)!.voltageDrop()
        expect(res12Vdrop.voltage).toBe(24)
        debugger
    });

    it('wire matrix parrallel v2', () => {
        const battery = new Battery(132, Infinity)
        battery.enabled = true
        ///   https://www.electronics-tutorials.ws/dccircuits/kirchhoffs-current-law.html
        //    #Kirchhoff’s Current Law Example No1
        //

        const resistor_24 = new Resistor(2.4)
        const resistor_17 = new Resistor(1.7)



        const resistor_60 = new Resistor(60)
        const resistor_20 = new Resistor(20)
        const resistor_30 = new Resistor(30)


        const parralel1 = connectParralel([resistor_24], [resistor_17])
        const parrallel2 = connectParralel([resistor_60], [resistor_20], [resistor_30])

        connectNodes(battery.outC!, parralel1, parrallel2, battery.inC!)

        const solver = new CircuitSolver(battery)
        solver.recalculate()
        solver.check(new Time(1))

        const cm = new ComputationMatrix([{ nodes: solver.registeredNodes, source: battery }])
        // cm.register(battery, null as never)
        //cm.register(resistor_500, resistor_500.inC!)
        //cm.register(resistor_700, resistor_700.inC!)


        expect(cm.solveCurrent("a").current).toBe(12.00532386867791)

        const voltage = cm.data.get(resistor_24.outC!)!.voltageDrop()
        expect(voltage.voltage).toBe(11.94676131322092)
        const voltage17 = cm.data.get(resistor_17.outC!)!.voltageDrop()
        expect(voltage17.voltage).toBe(11.94676131322092)
        const voltage30 = cm.data.get(resistor_30.outC!)!.voltageDrop()
        expect(voltage30.voltage).toBe(120.05323868677911)

        const c24 = cm.data.get(resistor_24.outC!)!.current()
        expect(c24.current).toBe(11.94676131322092)


        debugger
    });





    it('wire matrix multiple source ssame V', () => {
        const batteryA = new Battery(10, Infinity)
        batteryA.enabled = true


        const batteryB = new Battery(10, Infinity)
        batteryA.enabled = true

        ///   https://www.circuitbread.com/tutorials/how-to-solve-complicated-circuits-with-kirchhoffs-voltage-law-kvl
        //    #Resistors in Parallel
        //
        //           bat 10V--300---------700--bat10V
        //             |             |            |
        //             |            100           |
        //             |             |            |
        //              ---------------------------

        const resistor_300 = new Resistor(300)
        const resistor_700 = new Resistor(700)
        const resistor_100 = new Resistor(100)





        const w1 = Wire.connect(batteryA.outC!, resistor_300.inC!)
        const w2 = Wire.connect(batteryB.outC!, resistor_700.inC!)

        const w3 = Wire.connect(resistor_300.outC!, resistor_700.outC!, resistor_100.inC!)

        const w4 = Wire.connect(resistor_100.outC!, batteryB.inC!, batteryA.inC!)


        const solver = new CircuitSolver(batteryA)
        solver.recalculate()

        const solverB = new CircuitSolver(batteryB)
        solverB.recalculate()
        debugger
        const cm = new ComputationMatrix([
            { nodes: solver.registeredNodes, source: batteryA },
            { nodes: solverB.registeredNodes, source: batteryB }
        ])
        // cm.register(battery, null as never)
        //cm.register(resistor_500, resistor_500.inC!)
        //cm.register(resistor_700, resistor_700.inC!)

        const currentP = cm.data.get(resistor_100.inC!)!.current().milliAmpere()
        expect(currentP).toBe(32.258064516130005)

    });


    it('wire matrix multiple source diff V', () => {
        const batteryA = new Battery(10, Infinity)
        batteryA.enabled = true


        const batteryB = new Battery(5, Infinity)
        batteryA.enabled = true

        ///   https://www.circuitbread.com/tutorials/how-to-solve-complicated-circuits-with-kirchhoffs-voltage-law-kvl
        //    Example 2
        //
        //           bat 10V--20---------50--bat5V
        //             |             |          |
        //             |            10          |
        //             |             |          |
        //              -------------------------

        const resistor_20 = new Resistor(20)
        const resistor_50 = new Resistor(50)
        const resistor_10 = new Resistor(10)

        const w1 = Wire.connect(batteryA.outC!, resistor_20.inC!)
        const w2 = Wire.connect(batteryB.outC!, resistor_50.inC!)

        const w3 = Wire.connect(resistor_20.outC!, resistor_50.outC!, resistor_10.inC!)

        const w4 = Wire.connect(resistor_10.outC!, batteryB.inC!, batteryA.inC!)


        const solver = new CircuitSolver(batteryA)
        solver.recalculate()

        const solverB = new CircuitSolver(batteryB)
        solverB.recalculate()
        debugger
        const cm = new ComputationMatrix([
            { nodes: solver.registeredNodes, source: batteryA },
            { nodes: solverB.registeredNodes, source: batteryB }
        ])
        // cm.register(battery, null as never)
        //cm.register(resistor_500, resistor_500.inC!)
        //cm.register(resistor_700, resistor_700.inC!)
        expect(cm.solveCurrent("a").current).toBe(0.32352941176471)
        expect(cm.solveCurrent("b").current).toBe(0.02941176470588)


        const voltageDrop10 = cm.data.get(resistor_10.inC!)!.voltageDrop()
        expect(voltageDrop10.voltage).toBe(3.5294117647059)


        debugger

    });
})