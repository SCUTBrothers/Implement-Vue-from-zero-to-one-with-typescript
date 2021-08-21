import Directive from './directive'
import Binding from './binding'

class Vue {
  private _el: HTMLElement
  private _bindings: { [propName: string]: Binding }
  private _data: object
  private _components: { [propName: string]: HTMLElement }

  scope: { [propName: string]: any }

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

    // 当采用嵌套属性时，需要在this._compileNode前将this._data的值拷贝到this.scope
    // 并在this._bind中在给directive收集到binding的instances中后，触发一次directive的update
    // 不这样做的话，则要嵌套遍历data和scope的属性
    for (let key in this._data) {
      this.scope[key] = this._data[key]
    }

    this._compileNode(this._el, true)
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

    /**
     *
     * this._bindings[key]中的key仍然保留嵌套形式的字符串，如key = "a.b.c", 并不会做嵌套解除处理
     * 相应地，this._bindings[key]指向的binding实例的binding.key也是保留嵌套形式的字符串
     * binding.instances也是保存指向同一binding.key的多个directive实例
     *
     * 在this._createBinding(key)中，完成的任务是，对binding.key进行嵌套解析，按照嵌套路径去this.scope中一直向前走，如a.b.c，走到最后一层嵌套b的时候，
     * 为该嵌套b对象的c属性设置响应式，Object.defineProperty，将binding.value留在c属性的getter中，
     * binding.value = newVal和binding.instances.forEach((instance)=>instance.update(newVal))留在c属性的setter中
     *
     * 这样binding.key = "a.b.c"的binding实例就留在了this.scope[a][b][c]访问器属性的setter和getter闭包中，同时，在this._bindings["a.b.c"]中可以直接访问
     * 该binding实例(与this.scope[a][b][c]闭包中的binding实例指针相同)
     */
    let binding: Binding = this._bindings[key] || this._createBinding(key)

    binding.instances.push(directive)

    // if (directive.bind) directive.bind(binding.value)

    if (binding.value) directive.update(binding.value)
  }

  _createBinding(key: string): Binding {
    let binding = new Binding(key, this)

    this._bindings[key] = binding

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
