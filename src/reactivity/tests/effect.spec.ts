import { reactive } from '../reactive'
import { effect } from '../effect'
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
})