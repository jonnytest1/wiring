

export interface CustomControls {
    [key: string]: () => number;
}

declare global {

    function getCustomControls(): CustomControls
}