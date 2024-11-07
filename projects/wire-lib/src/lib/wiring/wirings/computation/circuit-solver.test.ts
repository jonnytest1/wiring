import { Battery } from '../battery'
import { Resistor } from '../resistor'
import { connectParralel } from '../test/parralel'
import { Wire } from '../wire'
import { CircuitSolver } from "./circuit-solver"
import { Time } from '../units/time'
import { Collection } from '../collection'
import type { REgistrationNode } from '../interfaces/registration'

import { WireLink } from "../wire-link"
import { Connection } from '../connection'
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
        const resistor_5 = new Resistor(5)

        Wire.connect(battery.outC!, resistor_2.inC!, resistor_4.inC!)
        Wire.connect(resistor_5.outC!, resistor_2.outC!, resistor_4.outC!)
        Wire.connect(resistor_5.inC!, battery.inC!)

        const solver = new CircuitSolver(battery)
        solver.recalculate()
        const laylout = solver.log({ withImp: true })
        expect(laylout).toEqual([
            "Battery:0",
            [
                { "imp": 2, "p": ["Resistor:2"] },
                { "imp": 4, "p": ["Resistor:4"] }
            ],
            "Resistor:5",
            "Battery:0"])

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
        const resistor_5 = new Resistor(5)

        const splitLink = Wire.connect(battery.outC!, resistor_4.inC!).createConnectionLink()

        Wire.connect(resistor_10.inC!, resistor_10b.inC!, splitLink)

        const joinLink = Wire.connect(resistor_10.outC!, resistor_10b.outC!).createConnectionLink()
        Wire.connect(resistor_4.outC!, joinLink, resistor_5.outC!)
        Wire.connect(resistor_5.inC!, battery.inC!)

        const solver = new CircuitSolver(battery)
        solver.recalculate()
        const laylout = solver.log({ withImp: true })




        expect(laylout).toEqual([
            "Battery:0",
            [
                { "imp": 4, "p": ["Resistor:4"] },
                {
                    "imp": 5, "p": [
                        [
                            { "imp": 10, "p": ["Resistor:10"] },
                            { "imp": 10, "p": ["Resistor:10"] }
                        ]]
                }
            ],
            "Resistor:5",
            "Battery:0"])


        solver.check(new Time(0.00001))
        expect(solver.caluclatedImpedanceTotal.impedance.toPrecision(3)).toBe('7.22')

        expect(solver.resistanceMap.get(solver.registeredNodes[1][0])?.impedance).toBe(5)
        expect(resistor_4.voltageDropV.voltage).toBe(6)
        expect(resistor_5.voltageDropV.voltage).toBe(13.5)

    })
})