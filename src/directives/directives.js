import Vue from '../Vue.js'

export default {
  text(value) {
    this.el.textContent = value || ''
  },
  bind() {},
  on: {
    update(handler) {
      let event = this.arg
    },
    unbind() {},
  },
  if(value) {
    this.el.style.display = value ? '' : 'none'
  },
  for: {
    bind() {
      this.el.style.removeAttribute(config.prefix + '-for')

      let container = (this.contianer = this.el.parentNode)
      this.marker = document.createComment(`v-${this.arg}-marker`)
      // 从container中移除this.el, 并替换成this.marker(注释节点)
      container.insertBefore(this.marker, this.el)
      container.removeChild(this.el)
      this.childSeeds = []
    },
    update(collection) {
      // collection代表数组
      if (this.childSeeds.length) {
        this.childSeeds.forEach((child) => {
          child.destroy()
        })
        this.childSeeds = []
      }

      // 1. 根据collection为Binding实例添加childSeed属性，初始化为spore实例对象数组
      // 2. buildItem的时候，会创建一个this.el的深拷贝，推入this.el.parentNode当中
      //  在bind()中，已经将this.el的v-for的属性删除了, 所以循环遍历执行后，插入
      //  this.el.parentNode的所有this.el的深拷贝都不再带有v-for属性
      collection.forEach((item, i) => {
        this.childSeeds.push(this.buildItem(item, i, collection))
      })

      console.log('collection creation done')
    },
    buildItem(data, index, collection) {
      // data为数组中的元素值

      // 创建当前el的自身及子节点的深拷贝
      let node = this.el.cloneNode(true)
      let spore = new Vue({
        el: node,
        data,
        for: true,
        forPrefixRE: new RegExp(`^${this.arg}.`),
        parent: this.seed,
      })
      this.container.insertBefore(node, this.marker)
      // 在buildItem的时候，逐个修改原始collection中的值，让其指向spore.scope
      collection[index] = spore.scope // 在初始状态下spore.scope指向data, 而data为collection[index]
      return spore
    },
  },
}
