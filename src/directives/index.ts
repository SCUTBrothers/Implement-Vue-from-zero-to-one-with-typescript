import on from './on'
import each from './for'

export default {
  on,
  for: each,
  text(value: string | void) {
    this.el.textContent = value || ''
  },
}
