import { extend } from "../shared"

// 抽离出一个ReactiveEffect类
class ReactiveEffect {
  private _fn
  deps = []
  active = true
  onStop?: () => void
  public _scheduler

  constructor(fn, scheduler?){
    this._fn = fn
    this._scheduler = scheduler
  }
  run() {
    // 将全局的activeEffect指向当前实例化的ReactiveEffect对象
    activeEffect = this 
    // 返回_fn函数调用后的值
    return this._fn()
  }

  stop() {
    if(this.active){
      cleanupEffect(this)
      if(this.onStop){
        this.onStop()
      }
      this.active = false
    } 
  }
}

function cleanupEffect(effect){
  effect.deps.forEach( (dep: any) => {
    dep.delete(effect)
  });
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

  // 只有当有effect(fn)的时候才需要对activeEffect进行处理
  // 如果只是对reactive(对象)进行get操作，activeEffect此时是为undefined的
  if(!activeEffect) return
  // ?? 那么如何去拿到当前需要放入到set的依赖呢 —— 用一个全局变量作为effect和trace的桥接
  // 开始收集依赖
  dep.add(activeEffect)
  
  // 双向收集，这里记录当前的activeEffect对应哪些dep
  activeEffect.deps.push(dep)

}

// 触发依赖
export function trigger(target, key) {
  let depsMap = targetMap.get(target)
  let dep = depsMap.get(key)
  dep.forEach(effect => {
    // 如果_scheduler有值，之后触发更新的时候，执行scheduler
    if(effect._scheduler){
      effect._scheduler()
    }else{
      effect.run()
    }
  });
}

let activeEffect
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  extend(_effect, options)


  _effect.run()
  // 返回一个runner函数，调用这个函数可以返回fn执行后的结果
  // 同时通过bind函数将返回的runner函数的this指向当前的_effect实例
  const runner: any =  _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function stop(runner) {
  runner.effect.stop()
}