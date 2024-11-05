/// <reference path="./troika-three-text.d.ts"/>

import * as troikaText from 'troika-three-text'
import type { TransformedAsset } from './transformed-asset'
import { Vector3 } from 'three'



export class TransformedText extends troikaText.Text implements TransformedAsset {
    constructor(text: string) {
        super()
        this.text = text
        this.color = "black"
        this.font = "assets/MaterialIcons-Regular.ttf"
        this.fontSize = 6

        this.sync()
        this.rotateX(-Math.PI / 2)


    }




    public transformRelative(relativeVector: Vector3): Vector3 {
        return new Vector3(relativeVector.x * 4, relativeVector.y, relativeVector.z * 1.8)
    }
}