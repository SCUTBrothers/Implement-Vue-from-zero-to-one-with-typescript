import directives from './directives/index'
import { prefix } from './config'

/**
 *
 * @param  {} directiveName,  something like "<key>[:<arg>]", eg., "on: click", "bind: class", "for", "if". Note, arg may contain spaces which should be trimmed
 * @param  {} expression, expression can be getted from attr.value originally, attr must has prefix, and be valid
 */

class Directive {
  static readonly KEY_RE = /^[^:]+/
  static readonly ARG_RE = /(?=:)([^:]+)$/

  public el: HTMLElement
  public arg: string
  public key: string

  private _update

  constructor(directiveName: string, arg: string, expression: string) {
    let directive: { update?: object; [propName: string]: object }
    directive = directives[directiveName]

    if (typeof directive === 'function') {
      this._update = directive
    } else {
      for (let prop in directive) {
        if (prop === 'update') {
          // directive.update动态确定
          this._update = directive.update
          continue
        }
        this[prop] = directive[prop]
      }
    }

    this.arg = arg

    this.key = expression
  }

  static parse(attr: string, expression: string): null | Directive {
    if (attr.indexOf(prefix) === -1) return null

    let noprefix: string
    noprefix = attr.slice(prefix.length + 1)

    let isMatchDirName: boolean
    isMatchDirName = Directive.KEY_RE.test(noprefix)
    if (!isMatchDirName)
      console.warn(`directive name ${prefix}-${noprefix} is not valid`)
    let isMatchArg: boolean
    isMatchArg: Directive.ARG_RE.test(noprefix)

    let directiveName: string | void
    let directive: object | void
    directiveName = isMatchDirName ? noprefix.match(Directive.KEY_RE)[0] : null
    directive = directiveName ? directives[directiveName] : null

    let arg: string | void
    arg = isMatchArg ? noprefix.match(Directive.ARG_RE)[0] : null

    let valid: boolean = expression ? true : false

    if (!directive) console.warn(`unknown directive: ${directiveName}`)
    if (!valid) console.warn(`invalid directive expression: ${expression}`)

    return directive && valid
      ? new Directive(directiveName, arg, expression)
      : null
  }

  update(value: any): void {
    this._update(value)
  }
}

export default Directive
