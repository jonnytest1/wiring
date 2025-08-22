import type { ArrayValueType, ClassRef, ClassTypeLiteral, FncReturnType, FunctionTypeLiteral, JscppConfig, Member, Runtime, TypeArg, TypeValue } from './jscpp-type';

export * from "./jscpp-type"
export function instantiate<C extends ClassTypeLiteral<string, []>>(rt: Runtime, typeArg: C, args: C extends ClassTypeLiteral<any, any, infer Init> ? ArrayValueType<Init> : []): TypeValue<ClassRef<C["name"]>> {
    const classType = rt.types[rt.getTypeSignature(typeArg)] as ClassTypeLiteral<string, []>
    const _this = {
        v: {},
        t: typeArg,
        args
    }
    classType.cConstructor(rt, _this, args)
    return _this as unknown as TypeValue<ClassRef<C["name"]>>
}

export function newClassBound<Init extends Array<TypeArg>>(rt: Runtime) {
    return rt.newClass.bind(rt) as <N extends string, T extends ReadonlyArray<Member<TypeValue<TypeArg>, Init>>>(name: N, members: T, preinit?: (rt: Runtime, args: Array<TypeValue<TypeArg>>) => void) => ClassTypeLiteral<N, T, Init>;
}



export function newStaticClassBound<Init extends Array<TypeArg>>(rt: Runtime) {

    const staticCLassGen = rt.newClass.bind(rt) as <N extends string, T extends ReadonlyArray<Member<TypeValue<TypeArg>, Init>>>(name: N, members: T, preinit?: (rt: Runtime, args: Array<TypeValue<TypeArg>>) => void) => ClassTypeLiteral<N, T, []>;
    function staticClassGenerator<N extends string, T extends ReadonlyArray<Member<TypeValue<TypeArg>, Init>>>(name: N, members: T, preinit?: (rt: Runtime, args: Array<TypeValue<TypeArg>>) => void): ClassTypeLiteral<`${N}StaticGen`, T, []> {
        const staticCl = staticCLassGen(`${name}StaticGen`, members, preinit);

        const instance = instantiate(rt, staticCl, []);

        rt.defVar(`${name}Static`, staticCl, instance);

        return staticCl
    }

    return staticClassGenerator
}



export type VisitFnc = (intr: JspCC, node: unknown, param: unknown) => Generator


declare global {





    interface JspCC {
        run(code: string, inputStr: string, config: JscppConfig);
    }

    interface Window {
        JSCPP: JspCC
    }
}


export function consumeFunction<Fnc extends TypeValue<FunctionTypeLiteral<TypeArg, Array<TypeArg>>>>(rt: Runtime, fnc: Fnc, args: Array<TypeValue<TypeArg>> = []): TypeValue<FncReturnType<Fnc["t"]>> {
    const ret = []
    const obj = {};
    for (const val of fnc.v.target(rt, obj, ...args)) {
        ret.push(val)
    }
    if (fnc.t.retType) {
        return ret[0]
    }
    return ret as never
}

export function stringTypeLiteral(rt: Runtime) {
    return rt.arrayPointerType(rt.charTypeLiteral)
}


