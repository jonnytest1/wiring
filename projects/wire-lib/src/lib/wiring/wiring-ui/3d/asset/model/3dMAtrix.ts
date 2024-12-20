import { WebGLRenderer, Scene, Camera, BufferGeometry, Material, Group, SpotLight, Vector3, SpotLightHelper, PointLight, Mesh, MeshBasicMaterial, SphereGeometry, MeshLambertMaterial, Color } from 'three';
import type { NodeWithPos } from '../../scene-data';
import { ImageAsset } from '../image';
import type { Esp32 } from '../../../../wirings/microprocessor/esp32';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
export class Esp8x8Matrix extends ImageAsset {

    static typeName = "Esp32"

    leds: Array<Array<{ light: PointLight, dotMaterial: MeshBasicMaterial }>> = []

    constructor(private node: NodeWithPos<Esp32>) {
        super(node)

        this.receiveShadow = true

        /* const loader = new GLTFLoader();
         loader.load('assets/models/ESP32-S3-MATRIX_ASM.gltf', function (gltf) {
             const pcb = gltf.scene.getObjectByName("PCB_ASM")
             const led = gltf.scene.getObjectByName("LED_ASM")
             debugger
 
         }, undefined, function (error) {
 
             console.error(error);
 
         });*/

        for (let rowI = 0; rowI < 8; rowI++) {
            this.leds[rowI] = []
            for (let colI = 0; colI < 8; colI++) {

                const light = new PointLight(0xffffff, 1000, .5);
                const dotMaterial = new MeshBasicMaterial({ color: new Color() });
                // light.add(new Mesh(this.geometry, new MeshBasicMaterial({ color: 0xff0040 })));
                //  light.castShadow = true
                // light.shadow.camera.near = 1;
                // light.shadow.camera.far = 1000;
                //  light.shadow.camera.fov = 80;




                light.add(new Mesh(new SphereGeometry(0.05, 16, 8), dotMaterial))

                this.add(light);
                this.leds[rowI][colI] = { light, dotMaterial }
            }

        }
    }


    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
        for (const led of this.leds) {
            // this.remove(led)
        }
        // this.leds.length = 0
        if (this.node.node.ledMatrix) {

            for (let rowI = 0; rowI < this.leds.length; rowI++) {
                const ledRow = this.leds[rowI]
                for (let colI = 0; colI < ledRow.length; colI++) {
                    const led = this.node.node.ledMatrix[rowI]?.[colI]

                    const light = this.leds[rowI]?.[colI];

                    /**
                     * x: updown
                     * y: left right
                     * z: y level
                     */
                    light.light.position.set(0.86 + rowI * 0.74, -2.05 + colI * 0.739, 3 - .2).sub(this.topLeftVec);
                    // light.position.add(new Vector3(rowI, 5, colI))

                    if (!led || led == "transparent") {
                        light.light.color.copy(new Color("black"))
                    } else {
                        light.light.color.copy(new Color(led));
                    }

                    light.dotMaterial.color.copy(light.light.color)


                }
            }
        }


    }






}