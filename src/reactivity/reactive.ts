import { trigger, track } from "./effect"

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // 查询target中对应key值
      const res = Reflect.get(target, key)

      // 依赖收集
      track(target, key)
      return res
    },

    set(target, key, value) {
      // 给target中对应key设置新值
      const res = Reflect.set(target, key, value)

      // 触发依赖
      trigger(target, key)
      return res
    }
  })
}