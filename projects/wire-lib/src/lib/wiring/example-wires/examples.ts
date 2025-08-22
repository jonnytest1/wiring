import parrallel from "./parrallel.template.json"

import pico from "./pico.template.json"
import esp from "./esp.tempalte.json"
import espBle from "./esp-ble.template.json"
import relay from "./relay.template.json"
import transformator from "./transformator.template.json"
import timer from "./timer.template.json"


// = BLEAddress()
espBle[0].prov.connectedTo.code = `
#include <BLEDevice.h>
#include <Arduino.h>


void setup(){

    BLEClient pClient = BLEDevice::createClient();
    pClient.connect("10:C0:29:66:FE:6C");
    
    
    
}


void loop(){
    looppundefined;


}

`
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
        name: "esp ble",
        content: JSON.stringify(espBle)
    }, {
        name: "555",
        content: JSON.stringify(timer)
    },
]





