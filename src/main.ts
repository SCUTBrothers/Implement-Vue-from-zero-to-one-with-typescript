import Vue from './Vue'

let component = Vue.component('Dad', {
  template: `<p><span v-text="son"></span></p>`,
  data: {
    name: 'Nicholas',
    son: 'Henry',
  },
})

let app = new Vue({
  el: '#app',
  data: {
    name: 'Jack',
    son: 'Chris',
  },
  computed: {
    msg() {
      return 'Hello, welcome to the new world'
    },
  },
  components: {
    Dad: component,
  },
})
