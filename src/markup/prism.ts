import Prism from "prismjs"

// prism component scripts register into the free `Prism` global, so it must point at this copy before they load.
;(globalThis as { Prism?: typeof Prism }).Prism = Prism

export { Prism }
