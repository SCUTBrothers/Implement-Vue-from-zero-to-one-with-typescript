import Directive from './directive'

type binding = { value: unknown; instances: Array<Directive> }

class Vue {
  private _el: HTMLElement
  private _bindings: { [propName: string]: binding }
  private _data: object
  private _components: object

  scope: object

  constructor(options: { el: string | HTMLElement; [propName: string]: any }) {
    if (typeof options.el === 'string') {
      this._el = document.querySelector(options.el) as HTMLElement
    } else if (typeof options.el === 'object') {
      this._el = options.el
    }

    this._bindings = {}
    this.scope = {}

    this._data = options.data || {}
    this._components = options.components || {}

    this._compileNode(this._el, true)

    for (let key in this._bindings) {
      this.scope[key] = this._data[key]
    }
  }

  _compileNode(node: HTMLElement, root: boolean): void {
    const nodeType: number = node.nodeType
    const nodeName: string = node.nodeName
    const nodeValue: string | void = node.nodeValue
    const nodeAttrs: NamedNodeMap | void = node.attributes

    if (nodeType === 3) {
      return
    } else if (nodeType === 1) {
      if (!root) {
        let isComponent: boolean
        let component: HTMLElement | void
        for (let key in this._components) {
          if (key.toLowerCase() === nodeName.toLowerCase()) {
            isComponent = true
            component = this._components[key]
          }
        }
        if (isComponent) {
          const marker: Comment = document.createComment(
            `this is the marker of component ${nodeName}`
          )

          const container: HTMLElement = node.parentNode as HTMLElement

          container.insertBefore(marker, node)
          if (component) {
            container.insertBefore(component, marker)
          }
          container.removeChild(node)
        }
      }
      let attrs = [].map.call(nodeAttrs, (attr) => {
        return {
          name: attr.name,
          value: attr.value,
        }
      })

      attrs.forEach((attr: { name: string; value: any }) => {
        let directive: Directive | void = Directive.parse(attr.name, attr.value)
        if (directive) this._bind(node, directive)
      })

      let children: NodeList = node.childNodes
      if (children.length) {
        ;[].forEach.call(children, (child) => {
          this._compileNode(child, false)
        })
      }
    }
  }

  _bind(node: HTMLElement, directive: Directive): void {
    directive.el = node

    let key = directive.key

    let binding: binding = this._bindings[key] || this._createBinding(key)

    binding.instances.push(directive)

    // if (directive.bind) directive.bind(binding.value)

    // if (binding.value) directive.update(binding.value)
  }

  _createBinding(key: string): binding {
    let binding: binding = {
      value: undefined,
      instances: [],
    }

    this._bindings[key] = binding

    Object.defineProperty(this.scope, key, {
      get() {
        return binding.value
      },
      set(newVal: unknown) {
        if (newVal === binding.value) return
        binding.value = newVal

        binding.instances.forEach((instance: Directive) => {
          instance.update(newVal)
        })
      },
    })

    return binding
  }

  static component(
    name: string,
    options: { template: string; [propName: string]: any }
  ): HTMLElement {
    let template: string = options.template

    let el: HTMLElement = document.createElement('div')
    el.innerHTML = template

    new Vue({ el, data: options.data })

    return el
  }
}

export default Vue
