import type { Injector, ViewContainerRef } from '@angular/core';
import { Vector2 } from './util/vector';
import type { NodeEl, NodeTemplate } from './wiring.component';
import type { Battery } from './wirings/battery';
import type { Collection } from './wirings/collection';
import type { Connection } from './wirings/connection';
import type { ParrallelWire } from './wirings/parrallel-wire';
import type { Wire } from './wirings/wire';
import type { Wiring } from './wirings/wiring.a';
import { iterateJsonStringify } from '../utils/json-stringify-iterator';
import { UINode } from './wiring-ui/ui-node';


export interface ControllerRef {
  setControlRef: (controlRef, key: string) => void
}
type keys = "abc" | "def"
export interface FromJsonOptions {
  inC?: Connection,
  wire?: Wire | ParrallelWire
  displayNodes?: NodeEl[],
  viewRef?: ViewContainerRef,
  injectorFactory?: (pos: Vector2) => Injector

  controlRefs: Record<string, Array<Wiring>>
  controllerRefs: Record<string, ControllerRef>

  constorlRefsInitialized: Promise<void>
  templateName?: string

  uiSerialisationMap?: Map<FromJson<"">, new (...args) => UINode>;
  loadElement: (json, context: FromJsonOptions) => { node: unknown, wire: Wire }
}


export interface FromJson<T extends string = ""> {
  name: string

  uiConstructor?: NodeTemplate,

  //fromJSON: (json: any, context: FromJsonOptions) => T extends "Battery" ? Battery : Wire
}


type UIJson = {
  ui: {
    x: number,
    y: number,
    rotation?: number
  }
}

let jsonStringifyTime: number;

export function getJsonStringifyTime() {
  return jsonStringifyTime
}


export function wiringJsonStringify(node: Battery) {
  try {
    jsonStringifyTime = Date.now()
    return iteratationWiringStringify(node)
  } finally {
    jsonStringifyTime = null
  }
}


function iteratationWiringStringify(node: Wiring, c = {}) {
  const jsonRepresentation = iterateJsonStringify(node, c, iteratationWiringStringify);
  if (node?.nodeUuid && typeof jsonRepresentation === "object") {
    jsonRepresentation["nodeUuid"] = node.nodeUuid
  }

  return jsonRepresentation
}


export class JsonSerializer {

  static async createUiRepresation(node: Wiring & Collection, json: UIJson, optinos: FromJsonOptions) {
    await optinos.constorlRefsInitialized;
    const uiConstructor = optinos.uiSerialisationMap.get(node.constructor)
    if (uiConstructor && json.ui?.x && json.ui.y && optinos.viewRef) {
      const position = new Vector2(json.ui)
      const element = optinos.viewRef.createComponent(uiConstructor, {
        injector: optinos.injectorFactory(position)
      })

      element.instance.node = node
      element.instance.setPosition(position)
      element.instance.initNodes()
      node.uiNode = element.instance
      optinos.displayNodes.push({
        uiInstance: element.instance,
        componentRef: element
      })
      if (json.ui.rotation) {
        element.instance.setRotation(json.ui.rotation)
      }


    }
  }

}