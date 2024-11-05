import { Battery } from './battery'
import { Wire } from './wire'
import { Comparator } from "./comparator"
import { LED } from './led'
import { CircuitSolver } from './circuit-solver'
import { Resistor } from './resistor'
import { Time } from './units/time'
describe("comparator", () => {



    it("basic", () => {

        const battery = new Battery(2, Infinity)
        battery.enabled = true
        ///   + and minus will be swapped for testing
        //           bat 6V
        //            |
        //           / \____
        //           2      |             vcc
        //           +----|\       <- +
        //           2___ | >-|    <-     comparator  vout
        //           |    |/  |    <- -   
        //           2      | led         gnd
        //           |      | |
        //            \    / /
        //             \__/_/
        //               |

        const comparator = new Comparator()
        const led = new LED()
        Wire.connect(comparator.vOut, led.inC!);
        // voltage divider
        const resistor1 = new Resistor(2)
        const resistor2 = new Resistor(2)
        const resistor3 = new Resistor(2)
        const divider1Wire = Wire.connect(resistor1.outC!, resistor2.inC!, comparator.positive);
        const divider2Wire = Wire.connect(resistor2.outC!, comparator.negative, resistor3.inC!);

        Wire.connect(battery.outC!, resistor1.inC!, comparator.vcc)

        Wire.connect(resistor3.outC!, comparator.ground, led.outC!, battery.inC!)
        /**
        const nodesArray = [Battery, [
            [resistor1,
                [
                    [comparator],
                    [
                        [resistor2],
                        [
                            [comparator],
                            [resistor3]
                        ],
                    ]
                ],

            ],
            [comparator, led]
        ], Battery] */

        const solver = new CircuitSolver(battery)
        solver.check(new Time(0.00001))
        expect(solver.caluclatedImpedanceTotal.impedance.toPrecision(3)).toBe("2.73")
        expect(led.brightness).toBe(0)

        // swap posiitve and negative
        divider1Wire.remove(comparator.positive)
        divider1Wire.connect(comparator.negative)

        divider2Wire.remove(comparator.negative)
        divider2Wire.connect(comparator.positive)

        solver.recalculate()

        solver.check(new Time(0.00001))
        expect(solver.caluclatedImpedanceTotal.impedance.toPrecision(3)).toBe("2.73")
        expect(led.brightness.toPrecision(3)).toBe("83.3")
    })
})