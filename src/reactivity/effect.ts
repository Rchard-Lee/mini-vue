// 抽离出一个ReactiveEffect类
class ReactiveEffect {
  private _fn
  constructor(fn){
    this._fn = fn
  }
  run() {
    // 将全局的activeEffect指向当前实例化的ReactiveEffect对象
    activeEffect = this
    this._fn()
  }
}

// 收集依赖(target——key——dep)
// 用于存储target —— depsMap（key——dep）对应关系
let targetMap = new Map() 
export function track(target, key) {
  // 拿取target和depsMap（key——dep）的对应关系的值
  let depsMap = targetMap.get(target)
  // 第一次没有值，将当前对应关系放入到targetMap中
  if(!depsMap){
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 拿取key——dep的对应关系的值
  let dep = depsMap.get(key)
  if(!dep) {
    // 第一次没有值，创建一个Set（用于去重，依赖不需要重复收集）之后去存储key对应的依赖
    dep = new Set()
    depsMap.set(key, dep)
  }

  // ?? 那么如何去拿到当前需要放入到set的依赖呢 —— 用一个全局变量作为effect和trace的桥接
  // 开始收集依赖
  dep.add(activeEffect)
  

}

// 触发依赖
export function trigger(target, key) {
  let depsMap = targetMap.get(target)
  let dep = depsMap.get(key)
  dep.forEach(element => {
    element.run()
  });
}

let activeEffect
export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}