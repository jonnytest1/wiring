



declare module "troika-three-text" {
    export class Text extends (await import("three")).Mesh {
        text: string
        color: string
        font: string
        fontSize: number

        sync();
    }

}
