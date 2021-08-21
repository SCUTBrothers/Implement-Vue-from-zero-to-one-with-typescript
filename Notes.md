# 从vue的第一个commit开始阅读源码

## 前言

源码中每个函数的执行图用AxGlyph绘制(浙大老师出版的一个超好用的绘图软件，要去某宝激活)，放置在README_agxs中，如果要查阅和自己修改的话，需要下载该软件再打开

## rename

`commit hash`: 871ed9126639c9128c18bb2f19e6afd42c0c5ad9 - rename

源码流程图：vue_vue_871ed9126639c9128c18bb2f19e6afd42c0c5ad9.agx

**完成的任务**
使用ES6的语法对源码进行了重写

## refactor

`commit hash`: cf1732bea21dcc1637d587d295d534535a92d2b7

源码思路：

1. 新增Directive.js， 通过一个新的Directive类来管理directive指示和其涉及到的filter, prefix(默认导出一个具有parse方法的对象)，而不是使用上个版本的parseDirective(attr)方法来解析
2. Directive在更新值(update, 响应式)的时候，不再像上个commit一样要先filter一遍value值，然后传递el, filteredValue, argument, directive, vue等众多值，而是只需要传递要更新的value即可, Directive在update的时候会用实例化时解析好的filters置入内部的实例方法applyFilters进行过滤, 然后再调用Directives中的方法进行更新

> Note：Directive实例的def属性的值指向Directives中的函数，而_update属性值指向def，或者def.update，也同样是指向函数。这里有一个很关键的点就是，Directives函数中的this指向调用该函数的对象，也就是Directive实例, Directive中还包含有el属性，指向指示所作用的元素, 所以Directive.js中的函数参数可以简化。虽然简化了，但是阅读源码的时候容易掉坑

3. 将processNode(el)函数修改为compileNode(node)方法，并将complieNode(node)作为Vue的实例方法
4. 将bindDirective(vue, el, bindings,directive)和bindAccessors(vue.scope, key, directive)改为两个Vue实例方法，并且再对代码进行简化和功能细分. (这两个方法中都需要传入vue实例，所以改为vue实例方法也是自然的)
    - bindDirective(vue, el, bindings, directive) -> Vue.prototype.bind(node, directive) 用于根据directive的key值将其绑定到vue的bindings上，并做一层判定，如果已经绑定了key，则直接将其推入bindings[key]的directives指令数组，如果没有绑定，则代表没有进行响应式, 通过Vue.prototype.createBinding(key)将key响应式化
    - bindAccessors(vue.scope, key, directive) -> Vue.prototype.createBind(key), 初始化一个binding={value: undefined, directives: []}, 并将该binding挂载到vue实例的bindings[key]上，然后将vue实例的scope的key属性的setter和getter指向bindings[key], 这也是所谓的create bind, **即，最终目的是将vue.scope的key值指向一个bindings[key], 对vue.scope[key]进行赋值的时候实际上是对bindings[key]赋值，然后会触发bindings[key]中的update，进行更新**

Note: 抛开实例化Vue时所传入的opts, 来看directive的作用. directive实际是为了确定以v为前缀的属性所代表的指令，这个指令是我们认为赋予的，如指令可能是text, on, class. v前缀属性的属性值，也称为key值，则代表指令处理的目标。比如，v-text="message"，直接含义就是对message进行text处理。text指令即将key的值作为其指向的元素节点的文本内容。

那么该如何获得这个key值呢？这个当然是从vue实例中拿，源码中是从vue的scope属性中拿。我们要实现的是给这个key赋值，然后让指令执行，去更新指令指向的el的值
一种方法是在解析元素的每一个属性的同时，去opts的scope中拿值，然后就去执行指令，结合在一起就是给传入的opts设置响应式. 那不如新建一个对象{}, 让这个对象来作为中介，将这个对象称作为bindings. bindings的作用：1. 通过Object.defineProperty对所需要的key设置setter和getter响应式，给key值设定一个{value, directives}, value初始状态为undefined, 然后外面设置一个key，里面就去更新这个key指向的value值，并且去执行key中的directives 2. 存储所有的key。

那么为什么不用bindings来和opt的scope结合起来做响应式，而是通过scope来做响应式呢？

5. 移除了directives中的CustomFilter方法，这意味着无法在元素节点中使用.buton来进行事件代理

**隔天对于该源码的思路的一些思考**
通过属性选择器获取属性包含selectors(v-on, v-text)等所有元素节点，到遍历这些元素节点，然后遍历克隆元素的属性, 再逐个解析元素的属性和属性值生成directive, 然后将有效的directive保存。后面的步骤很关键，也是源码的核心部分.

1. directive如何保存？实际上directive对象的信息主要有attr, key, filters, def, _update。 其中最重要的是key值，这代表了指令的处理对象。一个key可以对应多个指令，而key的值在后续也要确定，所以key值应该是对应{value: undefined(set after), directives[]}, 所有与key相关的directive都会保存在directives数组中。在根节点及其子元素中，key会在不同元素节点的不同v-属性中使用多次，所以key有多个directives也不奇怪。这样来看，key值需要是唯一的，而它的directives则代表如何去使用这个key值，在这里我才大概明白了directive的含义： directive代表在哪个el上以何种_update方法来使用这个key值。
2. 那么如何保存这个key值呢？首先，key的第一个特性是唯一性，所以可以用一个容器来管理和存放这个key，由此想到的容器是对象container = {}. 把所有的key值放到container中，同时这个key指向的信息应该包含有value和directives. 即container = {key: {value : ..., directives: [...]}, ...}, key代表使用的变量，而value代表后续为这个key赋予的值，directive则代表使用这个key的指令directive. 使用对象保证了key的唯一性，但是也会出现覆盖的情况, 如不同的元素使用相同的key, 那么解决方法就是，每次为container添加key的时候，首先判定container当中是否有key，如果没有，代表是第一次使用这个key。如果有key了，代表其他元素或者属性也使用了这个key。所以将directive推入directives当中
3. 2中解决了如何组织key的信息的问题，那么还有一个问题需要解决。如何对key的value进行赋值？如何在对key赋值的时候，同时去执行key中的directive? 我可以去直接获取和修改container的key中value, 然后再for循环执行directives. 比如我要去修改某个使用的key，我就去通过vue.container[key].value=newVal，然后再for循环遍历vue.container[key].directives.update,不过，这样太不优雅了. 另一个好的方法是使用setter和getter，通过Object.defineProperty(obj, key, descriptor)来设置key的get和set。那么这个obj是直接使用container吗？不是的，因为不能同时存在数据属性和访问器属性。在源码中是再创建一个对象scope = {}来设置key的setter和getter, 将scope的key重定位到container的key：scope[key] => container[key]. 重定位的意思是什么呢？scope[key]设置值的时候去给container[key]设置值，然后执行将要设置的值代入container[key]的directives中遍历执行; 获取scope[key]的时候，返回container[key]. 这有点像是scope访问器属性给container数据属性做信号转接的中间层，scope接收信号，然后去“数据库”container中取值或者设置值，或许这就是发布订阅模式把。我觉得最开始You是没有想到发布订阅模式，这是实现数据响应式的有效手段而已。
4. 3中解决了对key的value进行赋值并同时执行directives的问题。最后需要说明的是，scope[key]如何和container[key]进行连接？可以知道的是scope[key]是访问器属性而不是数据属性，无法保存数据。源码中是采用函数柯理化的形式在scope[key]的set()和get()函数中保存container[key]，相当于scope中不仅有container的数据，还有了对该数据的setter和getter.(? 那么bindings还有没有存在的必要呢？感觉bindings/container的作用现在就只剩下判断是否已经设置了key, 对scope也能直接做到. 更新：bindings的作用就是额外保存binding, 因为scope[key]保存的binding是私有属性，无法在外部获取)。
5. 另外，是先全部生成container，然后再遍历container，去初始化scope吗？源码中不是，因为这样会多有一次container的遍历。源码中是在遍历元素和元素的节点属性时，就去初始化container, 然后判断key是否有初始化过，没有初始化过，则在createBinding中Object.defineProperty()的外部初始化binding: {value, directives}(这样才能使用函数柯理化), 然后再将binding返回，挂载到bindings[key]上。然后在bind实例方法中将directive推入到binding的directives中。由于binding是对象，所以bindings[key]和scope[key]函数柯理化保存的binding是同一个对象

## WIP

`commit hash`: 79760c09d50caca7ca27cd85991eb2c6e9ba3231

将main.js拆分成main.js, config.js和vue.js
- config.js放置如prefix,selector等内容
- vue.js放置vue的构造函数和原型方法
- main.js作为程序的执行入口

最主要的内容是在watchArray.js中针对value值为数组的key添加数组拦截方法：即为被watch到的arr实例添加常见的会改变数组的内容的方法(mutatorMethods)，如["push", "pop", "shift", "unshift", "slice", "sort", "reverse"]共7种，这个arr实例在使用这些方法的时候，实际上是使用自身的方法，而不是数组原型对象上的方法。修改后的方法的主要功能就是：用apply去调用对应的数组原型对象上的实际方法，然后再执行一个回调函数，如去通知数组对应的directive，或者是key对应的setter