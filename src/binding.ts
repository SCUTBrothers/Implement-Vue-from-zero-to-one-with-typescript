import Vue from './Vue'
import Directive from './directive'

class Binding {
  key: string
  vue: Vue
  value: any
  instances: Array<Directive>

  constructor(key: string, vue: Vue) {
    this.key = key
    this.vue = vue
    this.instances = []

    let path = parsePath(key)

    this.value = getValue(vue.scope, path)

    this.defineReactive(vue.scope, path)
  }

  defineReactive(scope: object, path: Array<string>) {
    if (path.length === 0) return

    let key: string = path[0]

    let binding = this

    if (path.length === 1) {
      Object.defineProperty(scope, key, {
        set(newVal) {
          if (newVal === this.value) return
          binding.value = newVal
          binding.instances.forEach((instance) => {
            instance.update(newVal)
          })
        },
        get() {
          return binding.value
        },
      })
    } else {
      let subScope = scope[key]

      Object.defineProperty(scope, key, {
        set(newVal) {
          // a.b = {...}
          scope[key] = subScope
        },
        get() {
          return subScope
        },
      })

      this.defineReactive(subScope, path.slice(1))
    }
  }
}

function getValue(scope: object, keys: Array<string>): any {
  if (keys.length === 0) return scope

  let keysCopy = keys.slice(0)

  let key: string = keysCopy.shift()
  let res: any = scope[key]

  // when keys = [], keys.shift() return undefined
  while ((key = keysCopy.shift())) {
    res = res[key]
  }

  return res
}

function parsePath(rawPath: string): Array<string> {
  return rawPath.trim().split('.')
}

export default Binding
