export abstract class Executer {

    running: boolean = false



    start() {
        this.running = true
    }
    kill() {
        this.running = false
    }


    abstract update(newcode: string): void
}