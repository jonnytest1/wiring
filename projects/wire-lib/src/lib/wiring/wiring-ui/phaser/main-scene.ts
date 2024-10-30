
import { Scene } from 'phaser';

import {
    AmbientLight, Mesh, SphereGeometry, MeshStandardMaterial, Object3DEventMap,
    WebGLRenderer, PerspectiveCamera, PCFSoftShadowMap, DirectionalLight,
    SpotLight, Fog, Scene as ThreeScene, Line, WireframeGeometry, BoxGeometry,
    AxesHelper,
    MeshBasicMaterial,
    TextureLoader
} from 'three';
import * as THREE from "three"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry"
import type { NodeEl, NodeTemplate } from '../../wiring.component';
import { nodesSubject } from './scene-data';
import { takeWhile } from 'rxjs';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import * as troikaText from 'troika-three-text'
import { Wire } from '../../wirings/wire';
import { ParrallelWire } from '../../wirings/parrallel-wire';
import type { Wiring } from '../../wirings/wiring.a';
import { ImageAsset } from './asset/image';
import { TransformedAsset } from './asset/transformed-asset';
import { TransformedText } from './asset/text';
import { LineMesh } from './asset/line-mesh';
import { CustomControls } from './controls';

export class GameScene extends Scene {
    ball: Mesh<SphereGeometry, MeshStandardMaterial, Object3DEventMap>;
    threeScene: ThreeScene;
    wires: Set<Wire>;
    nodeComponent: Map<Wiring, Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], Object3DEventMap> | (TransformedAsset & Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], Object3DEventMap>)>;

    wireElements: Array<LineMesh> = []


    constructor(private nodes: NodeEl[]) {
        super({
            key: 'GameScene'
        });
    }




    create() {
        this.threeScene = this.create3DWorld();
        const diameter = 30;

        this.threeScene.add(new AxesHelper(200));



        const yAxis = new Line()
        this.threeScene.add(yAxis)

        for (let i = 0; i < 100; i++) {
            // const point =

        }


        /* const g = new BoxGeometry(10, 5, 1);
         const m = new MeshBasicMaterial({
             map: new TextureLoader()
                 .load("assets/icons/pipico.png")
         })
         const msh = new Mesh(g, m)
         msh.position.set(20, 20, 20)
         this.threeScene.add(msh)
         */

        //set(scene.game.config.width as number / 2, this.startY, GameOptions.ballStartingStep * -GameOptions.stepSize.z);


        //threeScene.add(this.ball)


        nodesSubject.pipe(takeWhile(() => !this.scene.isActive()))
            .subscribe(async nodes => {

                this.wires = new Set<Wire>();
                this.nodeComponent = new Map<Wiring, Mesh | (TransformedAsset & Mesh)>()
                const asyncList = []
                for (let node of nodes) {
                    const icon = (node.node.uiNode.constructor as NodeTemplate).templateIcon

                    if (icon.startsWith("asset:")) {
                        const msh = new ImageAsset(node)
                        this.threeScene.add(msh)
                        this.nodeComponent.set(node.node, msh)

                        asyncList.push(msh.ready.prRef)

                    } else {
                        const textMesh1 = new TransformedText(icon) // new THREE.Mesh(text.geometry, materials);
                        textMesh1.position.set(node.position.x / 100, 20, node.position.y / 100)
                        //textMesh1.rotateZ(Math.PI)
                        this.threeScene.add(textMesh1)
                        this.nodeComponent.set(node.node, textMesh1)


                    }

                    const nodeWires = node.node.uiNode.getWires()
                    nodeWires.forEach(wire => {
                        if (wire instanceof ParrallelWire) {
                            for (const inWire of wire.inC) {
                                for (const outC of wire.outC) {
                                    const tWire = new Wire();
                                    tWire.inC = inWire;
                                    tWire.outC = outC;
                                    this.wires.add(tWire);
                                }
                            }
                        } else {
                            this.wires.add(wire);
                        }
                    });

                }

                await Promise.all(asyncList)
                this.drawWires()
            })
    }


    drawWires() {

        for (const wireEl of this.wireElements) {
            this.threeScene.remove(wireEl)
        }
        this.wireElements.length = 0

        this.wires.forEach((wire, i, i2) => {

            const connectionParent = wire.inC?.parent;
            const relativeFrom = connectionParent?.uiNode?.getInOutComponent(wire.inC?.id)?.getRelativeOutVector();
            const nodeComp = this.nodeComponent.get(connectionParent)

            let relativeVector = new THREE.Vector3(relativeFrom.x / 10, 1, relativeFrom.y / 10);
            if ("transformRelative" in nodeComp) {
                relativeVector = nodeComp.transformRelative(relativeVector)
            }

            const wireFrom = nodeComp.position.clone().add(relativeVector)


            const toParent = wire.outC?.parent;
            const relativeTo = toParent?.uiNode?.getInOutComponent(wire.outC?.id)?.getRelativeInVector();
            const toComp = this.nodeComponent.get(toParent)

            let relativeToVector = new THREE.Vector3(relativeTo.x / 10, 1, relativeTo.y / 10);
            if ("transformRelative" in toComp) {
                relativeToVector = toComp.transformRelative(relativeToVector)
            }


            const wireTo = toComp.position.clone().add(relativeToVector)
            if (!wireTo || !relativeFrom) {
                return undefined;
            }
            const line = new LineMesh(wireFrom, wireTo)
            this.threeScene.add(line)
            this.wireElements.push(line)
        })
    }


    create3DWorld(): ThreeScene {
        const width: number = this.game.config.width as number;
        const height: number = this.game.config.height as number;

        // create a new THREE scene
        const threeScene: ThreeScene = new ThreeScene();

        // create the renderer
        const renderer: WebGLRenderer = new WebGLRenderer({
            canvas: this.sys.game.canvas,
            context: this.sys.game.context as WebGLRenderingContext,
            antialias: true
        });
        renderer.autoClear = false;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFSoftShadowMap;

        // add a camera
        const camera = new PerspectiveCamera(45, width / height, 1, 10000);
        const controls = new CustomControls(camera, renderer.domElement, this);
        controls.minDistance = 5;
        controls.maxDistance = 600;
        controls.maxPolarAngle = Math.PI / 2;

        camera.position.set(20, 140, 20);
        camera.lookAt(20, 0, 20);

        controls.target.set(20, 0, 20)
        // add an ambient light
        const ambientLight: AmbientLight = new AmbientLight(0xffffff, 1);
        threeScene.add(ambientLight);

        // add a directional light
        const directionalLight: DirectionalLight = new DirectionalLight(0xffffff, 0.5);
        directionalLight.castShadow = true;
        directionalLight.position.set(270, 200, 0);
        directionalLight.target.position.set(270, 100, -1000);
        threeScene.add(directionalLight);
        threeScene.add(directionalLight.target)

        // add a spotlight
        const spotLight: SpotLight = new SpotLight(0xffffff, 0.2, 0, 0.4, 0.5, 0.1);
        spotLight.position.set(270, 1000, 0);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.camera.near = 1;
        spotLight.shadow.camera.far = 10000;
        spotLight.shadow.camera.fov = 80;
        spotLight.target.position.set(270, 0, -320);
        threeScene.add(spotLight);
        threeScene.add(spotLight.target);

        // add a fog effect
        const fog: Fog = new Fog(0x011025, 500, 2000);
        threeScene.fog = fog;

        // create an Extern Phaser game object
        const view: Phaser.GameObjects.Extern = this.add.extern();

        // custom renderer
        // next line is needed to avoid TypeScript errors
        // @ts-expect-error
        view.render = () => {
            renderer.state.reset();
            renderer.render(threeScene, camera);
        };
        return threeScene;
    }
}