import type { WebGLRenderer, Scene, Camera, BufferGeometry, Material, Group } from 'three';
import type { NodeTemplate } from '../../../../wiring.component';
import type { Battery } from '../../../../wirings/battery';
import type { NodeWithPos } from '../../scene-data';
import { TransformedText } from '../text';
import type { BatteryUiComponent } from '../../../battery-ui/battery-ui.component';

export class Battery3d extends TransformedText {
    static typeName = "Battery"
    constructor(private node: NodeWithPos<Battery>) {
        const templateIcon = (node.node.uiNode.constructor as NodeTemplate).templateIcon;
        super(templateIcon);

        this.position.set(node.position.x / 100, 20, node.position.y / 100)
    }



    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
        const icon = (this.node.node.uiNode as BatteryUiComponent).getIcon()
        if (this.text != icon) {
            this.text = icon
            this.sync()
        }

        super.onBeforeRender(renderer, scene, camera, geometry, material, group)

    }
}