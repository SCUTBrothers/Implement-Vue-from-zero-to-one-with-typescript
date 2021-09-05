import Directive from './directive'
import Binding from './binding'
import textParser from "./parse/textParser"

class Vue {
  private _el: HTMLElement
  private _bindings: { [propName: string]: Binding }
  private _data: object

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

    for (let key in this._data) {
      this.scope[key] = this._data[key]
    }

    this._compileNode(this._el)
  }

  _compileNode(node: HTMLElement | Text): void {
    const nodeType: number = node.nodeType

    if (nodeType === 3) {

      this._compileTextNode(node as Text)
      return
    } else if (nodeType === 1) {

      const nodeAttrs: NamedNodeMap | void = (node as HTMLElement).attributes

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
        /**
         *  拷贝前的children A: [textNode, elNode, textNode]
         * 拷贝后的children B: [textNode, elNode, textNode]
         * 由于在_compileTextNode中，会在遍历到的textNode之前插入解析后的多个文本节点，同时将该textNode删除
         * 对于forEach来说，它遍历的范围在第一次调用callback的时候就确定，新加入A的数组元素不会被遍历到，而如果数组A中有元素被删除了，那么forEach遍历就会停止
         * 这样就会导致第一个textNode后的所有节点不会被遍历到
         * 这种情况确实会发生，因为NodeList A会由于其parentNode的删除旧的包含可能包含mustache语法的文本节点，会产生数组元素删除操作
         * 
         * 因此，我们需要对A的浅拷贝B进行遍历，这样浅拷贝B数组中的元素不会发生删除，而且数组元素还是引用到原有节点树上的节点元素, 仍然是对原有节点树上的节点元素进行遍历操作
         */
        ;[].forEach.call([].slice.call(children), (child) => {
          this._compileNode(child)
        })
      }
    }
  }

  _compileTextNode(textNode: Text) {
    let textTemplate = textNode.nodeValue
    let tokens = textParser(textTemplate)
    tokens.forEach((token) => {
      let el: Text  = document.createTextNode("")
      if (token.key) {
        let directive: Directive = new Directive("text", token.key)
        directive.el = el
        this._bind(el, directive)
      } else {
        el.nodeValue = token.text
      }
      textNode.parentNode.insertBefore(el, textNode)
    })

    textNode.parentNode.removeChild(textNode)
  }

  _bind(node: HTMLElement | Text, directive: Directive): void {
    directive.el = node

    let key = directive.key

    let binding: Binding = this._bindings[key] || this._createBinding(key)
    binding.directives.push(directive)

    if (binding.value) directive.update(binding.value)
  }

  _createBinding(key: string): Binding {
    let binding = new Binding(key, this)

    this._bindings[key] = binding

    return binding
  }
}

export default Vue
