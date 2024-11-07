import { Battery } from './battery'
import { Capacitor } from './capacator'
import { CircuitSolver } from './circuit-solver'
import { Resistor } from './resistor'
import { connectParralel } from './test/parralel'
import { Time } from './units/time'
import { Wire } from './wire'
import { defaultGetResistanceOpts } from './wiring.a'

describe("capacitor", () => {



    it("capacitor", () => {
        const battery = new Battery(5, Infinity)
        battery.enabled = true
        /// https://www.electronics-tutorials.ws/rc/rc_1.html
        //         bat 5V
        //          |
        //          |
        //         47k   
        //          |  
        //         Cap     
        //          |       
        //          |

        const resistor_2 = new Resistor(47000)
        const capacitor = new Capacitor(1000, 50)

        Wire.connect(battery.outC!, resistor_2.inC!)
        Wire.connect(resistor_2.outC!, capacitor.inC!)

        Wire.connect(battery.inC!, capacitor.outC!)

        const solver = new CircuitSolver(battery)
        solver.recalculate()

        expect(solver.caluclatedImpedanceTotal.impedance.toPrecision(3)).toBe('4.70e+4')



        /**
         * After one time constant (𝜏): The voltage across the capacitor will reach about 63.2% of the maximum voltage 𝑉𝑠.
         * After two time constants (2𝜏): The voltage will be about 86.5% of 𝑉𝑠V s​ .
         * After three time constants (3𝜏): The voltage will reach about 95% of 𝑉𝑠V s​ .
         * After five time constants (5𝜏): The voltage will be over 99% of 𝑉𝑠V s​ .
         */
        const timeConstnat = capacitor.getTimeConstant(solver.caluclatedImpedanceTotal)
        let resistances = []
        debugger
        solver.check(new Time(timeConstnat.seconds * 0.5))
        const voltagest1 = capacitor.getVoltage()
        expect(voltagest1.voltage.toPrecision(3)).toBe('1.97')
        solver.check(new Time(timeConstnat.seconds * 0.2))
        const voltagest2 = capacitor.getVoltage()
        expect(voltagest2.voltage.toPrecision(3)).toBe('2.52')

        // one second later
        solver.check(timeConstnat)
        solver.check(timeConstnat)
        solver.check(timeConstnat)
        solver.check(timeConstnat)
        solver.check(timeConstnat)
        // now it should be "Steady" since it approximates to 5V
        const voltagestSteady = capacitor.getVoltage()
        expect(voltagestSteady.voltage.toPrecision(3)).toBe('4.98')

        const voltage = capacitor.getVoltage()
        expect(+capacitor.charge.coulomb.toPrecision(3)).toBe(6.29e-7)
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