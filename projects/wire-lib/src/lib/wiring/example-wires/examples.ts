import parrallel from "./parrallel.template.json"

import pico from "./pico.template.json"
import esp from "./esp.tempalte.json"
import relay from "./relay.template.json"
import transformator from "./transformator.template.json"
import timer from "./timer.template.json"


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
    }, {
        name: "esp demo",
        content: JSON.stringify(esp)
    }, {
        name: "555",
        content: JSON.stringify(timer)
    },
]





