import { Battery } from './battery'
import { Resistor } from './resistor'
import { connectParralel } from './test/parralel'
import { Wire } from './wire'
import { CircuitSolver } from "./circuit-solver"
import { Time } from './units/time'
import { Collection } from './collection'
import type { REgistrationNode } from './interfaces/registration'
describe("circuit-sovler", () => {




    it("calcualates circuit", () => {
        const battery = new Battery(6, Infinity)
        battery.enabled = true
        ///   const b2 = new Battery()
        //           bat 6V
        //            |
        //           / \
        //          |   |
        //          4   2
        //          |   |
        //           \ / 
        //            | 
        //            5
        //            |

        const resistor_2 = new Resistor(2)
        const resistor_4 = new Resistor(4)

        const [parrallelStart, parrallelEnd] = connectParralel([resistor_2], [resistor_4])

        const resistor_5 = new Resistor(5)

        Wire.connectNodes(battery, parrallelStart, parrallelEnd, resistor_5, battery)

        const solver = new CircuitSolver(battery)
        solver.check(new Time(0.00001))
        expect(solver.caluclatedImpedanceTotal.impedance.toPrecision(3)).toBe("6.33")
        // expect(+parrallelStart.voltageDrop.toPrecision(3)).toBe(1.26)
        expect(+resistor_5.voltageDropV.voltage.toPrecision(3)).toBe(4.74)
        //expect(+parrallelStart.resistance.toPrecision(3)).toBe(1.33)
        // expect(+parrallelStart.voltageDropV.voltage.toPrecision(3)).toBe(1.26)
        const resistorCurrents = {
            2: +resistor_2.incomingCurrent.current.toPrecision(3),
            4: +resistor_4.incomingCurrent.current.toPrecision(3),
            5: +resistor_5.incomingCurrent.current.toPrecision(3),
        }
        expect(resistorCurrents).toEqual({
            "2": 0.632,  // seems about right oO
            "4": 0.316,
            "5": 0.947
        })
    })



    it("calculates nested parralel", () => {
        const battery = new Battery(6, Infinity)
        battery.enabled = true
        ///   const b2 = new Battery()

        //           bat 6V
        //            |
        //           / \
        //          |   |
        //          4  / \
        //          | 10 10
        //          |  \ /
        //           \ / 
        //            | 
        //            5
        //

        const resistor_4 = new Resistor(4)


        const resistor_10 = new Resistor(10)
        const resistor_10b = new Resistor(10)
        const innerParrallel = connectParralel([resistor_10], [resistor_10b])

        const innerCol = new Collection(innerParrallel[0].newInC(), innerParrallel[1].newOutC())
        const [parrallelStart, parrallelEnd] = connectParralel([innerCol], [resistor_4])


        const resistor_5 = new Resistor(5)
        Wire.connectNodes(battery, parrallelStart, parrallelEnd, resistor_5, battery)

        const solver = new CircuitSolver(battery)
        solver.check(new Time(0.00001))
        expect(solver.caluclatedImpedanceTotal.impedance.toPrecision(3)).toBe('7.22')

        expect(solver.resistanceMap.get(solver.registeredNodes[1][0])?.impedance).toBe(5)
        expect(resistor_4.voltageDropV.voltage).toBe(6)
        expect(resistor_5.voltageDropV.voltage).toBe(13.5)

    })
})