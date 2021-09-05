import Vue from './Vue'
import Directive from './directive'

class Binding {
  _scope: object
  key: string
  value: any
  directives: Array<Directive>
  vue: Vue

  constructor(key: string, vue: Vue ) {
    this._scope = vue.scope
    this.vue = vue
    this.key = key
    this.directives = []

    this.value = this.getValue(key)

    this.defineReactive(key)
  }

  defineReactive(key: string) {
    Object.defineProperty(this._scope, key, {
      get() {
        return this.value
      },
      set(newVal: any) {
        if (newVal === this.value) return
        this.directives.forEach((directive) => {
          directive.update(newVal)
        })
      }
    })
  }

getValue(key: string): any {

  let value = this._scope[key] || null

  return value
}

}



export default Binding
