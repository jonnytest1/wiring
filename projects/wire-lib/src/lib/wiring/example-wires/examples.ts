import parrallel from "./parrallel.template.json"

import pico from "./pico.template.json"
import relay from "./relay.template.json"
import transformator from "./transformator.template.json"


export const examples = [
    {
        name: "parralel wires",
        content: JSON.stringify(parrallel)
    },
    {
        name: "pico demo",
        content: JSON.stringify(pico)
    }, {
        name: "relay demo",
        content: JSON.stringify(relay)
    }, {
        name: "transformator demo",
        content: JSON.stringify(transformator)
    },
]





