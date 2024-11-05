# WireLib

## Demo

[https://j0nny.dev/wiring](https://j0nny.dev/wiring?template=pico+demo&enablebatteries)

# Setup

add this to index html html>head

- <link href="https://fonts.googleapis.com/icon?family=Material+Icons"
         rel="stylesheet">
- include WiringModule import
- display WiringComponent
- add this for material styles

include this in assets of your angular json ,

```
{
"glob": "**",
"input": "./node_modules/electronics-lib/assets/",
"output": "/assets/"
}
```

```
@use '@angular/material' as mat;

@include mat.core();

```

provide ,
RouterModule.forRoot([]) somewhere for the wiring component to be able to set query params

# Custom Controls

if there is a function "getCustomControls" in the global window object

each key of it can be bound to control components

```typescript
interface CustomControls {
  [key: string]: () => number;
}

function getCustomControls(): CustomControls {
  return {
    control1: () => 1,
  };
}
```
