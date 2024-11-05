import { Battery } from './battery'
import { Capacitor } from './capacator'
import { CircuitSolver } from './circuit-solver'
import { Resistor } from './resistor'
import { connectParralel } from './test/parralel'
import { Wire } from './wire'
import { defaultGetResistanceOpts } from './wiring.a'

describe("capacitor", () => {



    it("capacitor", () => {
        const battery = new Battery(6, Infinity)
        battery.enabled = true
        ///   const b2 = new Battery()
        //           bat 6V
        //            |
        //           / \
        //          |   |
        //         Cap  2
        //          |   |
        //           \ / 
        //            |

        const resistor_2 = new Resistor(2)
        const capacitor = new Capacitor(1, 50)
        const [parrallelStart, parrallelEnd] = connectParralel([resistor_2], [capacitor])

        Wire.connectNodes(battery, parrallelStart, parrallelEnd, battery)


        const solver = new CircuitSolver(battery)
        solver.recalculate()

        const totalREsistance = +battery.getTotalResistance(null, defaultGetResistanceOpts()).resistance.toPrecision(3)
        expect(totalREsistance).toBe(0.001)



        /**
         * After one time constant (𝜏): The voltage across the capacitor will reach about 63.2% of the maximum voltage 𝑉𝑠.
         * After two time constants (2𝜏): The voltage will be about 86.5% of 𝑉𝑠V s​ .
         * After three time constants (3𝜏): The voltage will reach about 95% of 𝑉𝑠V s​ .
         * After five time constants (5𝜏): The voltage will be over 99% of 𝑉𝑠V s​ .
         */
        const timeConstnat = capacitor.getTimeConstant(totalREsistance)
        let resistances = []
        // one second later
        for (let i = 0; i < 10; i++) {
            battery.checkContent(timeConstnat.seconds / 10)

        }
        const voltage = capacitor.getVoltage()

        battery.checkContent(timeConstnat.seconds)
        battery.checkContent(timeConstnat.seconds)
        battery.checkContent(timeConstnat.seconds)
        battery.checkContent(timeConstnat.seconds)

        expect(+capacitor.charge.coulomb.toPrecision(3)).toBe(6.29e-7)
        expect(capacitor.getVoltage().valueOf()).toBe(0.6290401157868349)

        battery.enabled = false
        debugger
        battery.checkContent(timeConstnat.seconds)

    })
})