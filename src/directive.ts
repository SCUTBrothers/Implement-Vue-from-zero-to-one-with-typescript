import { prefix } from './config'
import directives from "./directives/index"
class Directive {
  public el: HTMLElement | Text 
  public key: string
  public updateDirective

  constructor(directiveName: string, key: string) {
    this.setUpdateDirective(directiveName)
    this.key = key
  }

  setUpdateDirective(directiveName: string) {
    this.updateDirective = new directives[directiveName]
  }

  update(value: unknown) {
    this.updateDirective.update(this.el, value)
  }

  static parse(attr: string, value: string): null | Directive {
    if (attr.indexOf(prefix) === -1) return null

    const noprefix: string = attr.slice(prefix.length + 1)

    const isDirName: boolean = directives.hasOwnProperty(noprefix)
    if (!isDirName) throw new Error(`directive name ${prefix}-${noprefix} is not valid`)

    const directiveName: string | void = isDirName ? noprefix : null

    let valid: boolean = value.trim() ? true : false

    if (!valid) throw new Error(`you must input a non-empty value of ${prefix}-${noprefix}`)

    return directiveName && valid
      ? new Directive(directiveName, value)
      : null
  }
}

export default Directive
