import { Charge } from './charge'
import { Voltage } from './voltage'

describe("units", () => {

    it("compare voltages", () => {

        const votlage1 = new Voltage(1)

        const voltage2 = new Voltage(2)
        const charge = new Charge(1)

        const greater = voltage2 > votlage1
        expect(greater).toBeTruthy()

        const greater1 = votlage1 > voltage2
        expect(greater1).toBeFalsy()


        //@ts-expect-error
        const misCompare = charge > votlage1
        debugger
    })

})