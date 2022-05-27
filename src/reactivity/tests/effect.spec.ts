import { reactive } from '../reactive'
import { effect, stop } from '../effect'
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10
    })
    let nextAge = 0
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    // update
    user.age++
    expect(nextAge).toBe(12)
  })
  
  it("should return runner when call effect", () => {
    // 1. 调用：effect(fn) = 返回 => 调用：function runner() = 返回 => fn调用后的结果
    let foo = 10
    const runner = effect( () => {
      foo++
      return "foo"
    }) 
    expect(foo).toBe(11)
    const r = runner()
    expect(foo).toBe(12)
    expect(r).toBe("foo")
  })

  it("scheduler", () => {
    // 1.通过effect的第二个参数给定一个scheduler，scheduler是一个函数
    // 2.effect第一次执行的时候还会执行effect的fn
    // 3.当响应式对象set（也就是更新）的时候，不会执行fn而是执行scheduler
    // 4.如果说当执行runner的时候，会再次执行fn
    let dummy;
    let run: any
    
    const obj = reactive({foo: 1})
    // Mock函数的作用:在项目中，一个模块的方法内常常会去调用另外一个模块的方法。
    // 在单元测试中，我们可能并不需要关心内部调用的方法的执行过程和结果
    // 只想知道它是否被正确调用即可，甚至会指定该函数的返回值。
    // 此时，使用Mock函数是十分有必要。
    // jest.fn()是创建Mock函数最简单的方式
    const scheduler = jest.fn(() => {
      run = runner;
    })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    // 一开始scheduler不会执行
    expect(scheduler).not.toHaveBeenCalled()
    // 执行的是effect的fn
    expect(dummy).toBe(1)
    // 响应式对象更新
    obj.foo++
    // 此时执行scheduler而不是effect的fn
    expect(scheduler).toHaveBeenCalledTimes(1)
    // effect的fn没有执行
    expect(dummy).toBe(1)
    // 当执行runner的时候，会再次执行effect的fn
    run()
    // effect的fn执行了
    expect(dummy).toBe(2)
  })

  it("stop", () => {
    // 实现原理：删除deps中收集的effect

    let dummy
    const obj = reactive( {prop: 1})
    const runner = effect( () => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    // 后续更新响应式的值的时候不会更新
    stop(runner)
    obj.prop = 3
    expect(dummy).toBe(2)

    runner()
    // 调用runner之后才会再次更新
    expect(dummy).toBe(3)
  })

  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    })
    const onStop = jest.fn()
    let dummy
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      {
        onStop,
      }
    )

    stop(runner)
    // 作用：在stop的回调函数，可以进行一些处理
    expect(onStop).toBeCalledTimes(1)
  } )
})