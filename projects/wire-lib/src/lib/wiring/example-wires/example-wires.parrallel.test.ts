
import { promises } from "fs"
import { join } from 'path'
import { LocalStorageSerialization } from '../storage'
import type { Battery } from '../wirings/battery'
import { deserialize, startDeserialize } from '../wiring-serialisation.ts/main-deserialisation'
import { ResolvablePromise } from '../../utils/resolvable-promise'
import { CircuitSolver } from '../wirings/computation/circuit-solver'
describe("example wires", () => {
  global.Image = (function () {
    //mocked
  }) as any

  function flatten(ar: Array<any>) {
    return ar.map(el => {
      if (el instanceof Array) {
        return flatten(el)
      }
      return el.constructor.name
    })

  }

  it("parrallel temaplte", async () => {
    const jsonFile = await promises.readFile(join(__dirname, "parrallel.template.json"), { encoding: "utf8" })
    const json = JSON.parse(jsonFile)
    const nodes = []


    const controlRegfs = {};
    const controllerRefs: Record<string, { setControlRef: (controlRef, uuid: string) => void; }> = {};

    const controlRefsinitialized = new ResolvablePromise<void>();
    const deserialised = startDeserialize<Battery>(json[0], {
      //controlRefs: controlRegfs,
      constorlRefsInitialized: controlRefsinitialized.prRef,
      //controllerRefs: controllerRefs,
      displayNodes: [],
      loadElement: deserialize,
      references: {}
    })


    expect(deserialised?.node).toBeDefined()

    const solver = new CircuitSolver(deserialised.node)
    solver.recalculate()


    const structure1 = solver.log()
    expect(structure1[0]).toEqual(
      [
        'Battery',
        [
          ['LED', 'Resistor'],
          ['LED', 'Resistor']
        ],
        'Battery'
      ])


    const serialised = solver.log({ serialize: true })



    debugger
  })




})