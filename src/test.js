const { get } = require('http')

let a = {
  _name: 'Nicholas',
  set name(val) {
    console.log('name setter called')
    this._name = val
  },
  _age: 30,
  age: {
    configurable: true,
    get() {},
  },
}

a.age = 20
console.log(a._age)
a.name = 'Mike'
console.log(a.name)
