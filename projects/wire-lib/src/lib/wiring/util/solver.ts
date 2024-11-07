import nerdamer, { type Expression } from "nerdamer"
import "nerdamer/Solve"
import "nerdamer/Algebra"
import "nerdamer/Calculus"



type TypeFixedNerdamer = typeof nerdamer & {
    solveEquations(eqn: Array<string>, solveFor?: Array<string>): Record<string, number>
}

const tfNerdamer = nerdamer as TypeFixedNerdamer

//@ts-ignore
nerdamer.set('SOLUTIONS_AS_OBJECT', true)


export const solver = tfNerdamer