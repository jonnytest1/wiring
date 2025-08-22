

export declare class JscppDebugger {
    setStopConditions(arg0: { isStatement: boolean; positionChanged: boolean; lineChanged: boolean; }): void
    start(): void

    continue(): void

}


export type ArrayValueType<TypeArray extends Array<TypeArg>> = { [K in keyof TypeArray]: TypeValue<TypeArray[K]> }

export type InitType<Args extends Array<TypeArg>> = {
    args: ArrayValueType<Args>

}
export type Member<T extends TypeValue<TypeArg>, Arg extends Array<TypeArg> = []> = {
    name: string;
    initialize: (rt: Runtime, _this: TypeValue<TypeArg> & InitType<Arg>) => T;
};

export type CharTypeLiteral = {
    type: "primitive",
    name: "char"
}
export type VoidTypeLiteral = {
    type: "primitive",
    name: "void"
}

export type IntTypeLiteral = { type: 'primitive', name: 'int' }
export type LongTypeLiteral = { type: 'primitive', name: 'long' }
export type BoolTypeLiteral = { type: 'primitive', name: 'bool' }
export type LongLongTypeLiteral = { type: 'primitive', name: 'long long' }


export type ClassTypeLiteral<T extends string, M extends ReadonlyArray<Member<TypeValue<TypeArg>, Array<TypeArg>>>, InitTypes extends Array<TypeArg> = never> = {
    name: T,
    type: "class"
    cConstructor(rt: Runtime, _this, args)

}


export type ClassRef<T extends string> = {
    name: T,
    type: "class"
}

export type Primitives = CharTypeLiteral | VoidTypeLiteral | IntTypeLiteral | LongTypeLiteral | LongLongTypeLiteral | BoolTypeLiteral



export type TypeArg = Primitives | ClassTypeLiteral<string, []> | ArrayTypeLiteral<TypeArg>
    | ClassRef<string> | FunctionTypeLiteral<TypeArg, Array<TypeArg>> | PointerType<TypeArg>


export interface PointerType<T extends TypeArg> {
    type: "pointer",
    ptrType: "normal" | "function",
    targetType: T
}

export interface ArrayTypeLiteral<T extends TypeArg> {
    type: "pointer",
    eleType: T
}

export interface FunctionTypeLiteral<RetType extends TypeArg, Sig extends Array<TypeArg>> {
    type: "function",
    retType: RetType,
    signature: Sig
}


export type FncReturnType<T extends FunctionTypeLiteral<TypeArg, Array<TypeArg>>> = T extends FunctionTypeLiteral<infer Ret, Array<TypeArg>> ? Ret : never



export type TypeValue<T extends TypeArg> = {
    t: T,
    v: TypeArgValue<T>,
    args?: Array<TypeValue<TypeArg>>
}

export type StringTypeLiteral = ArrayTypeLiteral<CharTypeLiteral>


export type TypeArgValue<T extends TypeArg> = T extends ArrayTypeLiteral<infer S> ? { target: Array<TypeValue<S>> } :
    // Array<TypeArgValue<S[number]>>
    T extends FunctionTypeLiteral<infer R, infer S> ? { target: (rt: Runtime, self: {}, ...args: Array<TypeValue<TypeArg>>) => IterableIterator<unknown> } :
    T extends CharTypeLiteral ? number :
    T extends IntTypeLiteral ? number :
    T extends LongLongTypeLiteral ? number :
    T extends LongTypeLiteral ? number
    : never




export type ClassMemberObject<T extends ClassTypeLiteral<string, Array<Member<TypeValue<TypeArg>>>>> = T extends ClassTypeLiteral<string, infer M> ? {
    [K in M[number]as `${K["name"]}`]: ReturnType<K["initialize"]>
} : never

export interface IncludeObj {
    load: (runtime: Runtime) => void;
}

export type JscppInclude = Record<string, IncludeObj>;

export interface JscppConfig {
    includes: JscppInclude;

    limits?: Record<Primitives["name"], { max: number }>
    stdio;
    debug?: boolean;
}

export type Runtime = {
    config: JscppConfig;
    longTypeLiteral: LongTypeLiteral;
    boolTypeLiteral: BoolTypeLiteral
    getMember<T extends ClassTypeLiteral<string, M>, M extends Array<Member<TypeValue<TypeArg>>>, K extends keyof ClassMemberObject<T>>(other: TypeValue<T>, arg1: K): { v: ClassMemberObject<T>[K] }
    makeOperatorFuncName(arg0: string): string;
    makeCharArrayFromString(arg0: string): TypeValue<ArrayTypeLiteral<CharTypeLiteral>>;
    getTypeSignature(staticT: TypeArg): string;
    types: Record<string, TypeArg>;
    defVar(name: string, varType: TypeArg, init: TypeValue<TypeArg>): undefined;
    newClass<N extends string, T extends ReadonlyArray<Member<TypeValue<TypeArg>>>>(name: N, members: T): ClassTypeLiteral<N, T>;
    getStringFromCharArray(of: TypeValue<StringTypeLiteral>): string;
    arrayPointerType<T extends TypeArg>(ofType: T): ArrayTypeLiteral<T>;
    getCompatibleFunc(scope: string, name: string, args: undefined[]): (rt: Runtime, thisObj, args) => any;
    charTypeLiteral: CharTypeLiteral;
    registerTypedef: (def, name: string) => void;
    primitiveType: <T extends Primitives["name"]>(type: T) => { type: "primitive", name: T }

    makeNormalPointerValue: <T extends TypeValue<TypeArg>>(target: T) => { target: T }
    normalPointerType<T extends TypeArg>(targetType: T): {
        type: "pointer",
        ptrType: "normal" | "function",
        targetType: T
    }
    val: <T extends TypeArg>(returnType: T, value) => TypeValue<T>
    intTypeLiteral: IntTypeLiteral
    voidTypeLiteral: VoidTypeLiteral

    functionType: <R extends TypeArg, A extends Array<TypeArg>>(retType: R, args: A) => FunctionTypeLiteral<R, A>
    regFunc<T1 extends TypeArg, T2 extends TypeArg, T3 extends TypeArg>(
        fnc: (runtime: Runtime, self: any, t1: TypeValue<T1>, t2: TypeValue<T2>, t3: TypeValue<T3>) => void,
        scope: "global" | TypeArg,
        name: string,
        args: [T1, T2, T3],
        returnType: TypeArg,
        optArgs?: Array<TypeArg>
    ): void;
    regFunc<T1 extends TypeArg, T2 extends TypeArg>(
        fnc: (runtime: Runtime, self: any, t1: TypeValue<T1>, t2: TypeValue<T2>) => void,
        scope: "global" | TypeArg,
        name: string,
        args: [T1, T2],
        returnType: TypeArg,
        optArgs?: Array<TypeArg>
    ): void;
    regFunc<T1 extends TypeArg>(
        fnc: (runtime: Runtime, self: any, t1: TypeValue<T1>) => void,
        scope: "global" | TypeArg,
        name: string,
        args: [T1],
        returnType: TypeArg,
        optArgs?: Array<TypeArg>
    ): void;
    regFunc(
        fnc: (runtime: Runtime, self: any) => void,
        scope: "global" | TypeArg,
        name: string,
        args: [],
        returnType: TypeArg,
        optArgs?: Array<TypeArg>
    ): void;
};

