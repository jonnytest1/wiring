
export class TypedEventEmitter<T extends Record<string, unknown>> {



    private readonly listeners: { [key in keyof T]?: Array<(val: T[key]) => void> } = {}


    emit<K extends keyof T>(key: K, value?: T[K]) {
        this.listeners[key]?.forEach(callback => callback(value))
    }



    on<K extends keyof T>(key: K, callback: (val: T[K]) => undefined) {
        const keyArray = this.listeners[key] ??= []
        keyArray.push(callback)
    }



}