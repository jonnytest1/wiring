


export interface SymbolRef<T> {
    s: symbol
    types: T
}

export function create<T>() {
    return { s: Symbol() } as SymbolRef<T>
}



export function assignSymbol<T>(obj: any, s: SymbolRef<T>, data: T) {

    Object.assign(obj, {
        [s.s]: data
    })


}


export function getSymbolData<T>(obj, symbol: SymbolRef<T>): T {
    return obj[symbol.s]
}


export function implementsSymbol<T>(obj, symbol: SymbolRef<T>): boolean {
    return !!obj[symbol.s]
}