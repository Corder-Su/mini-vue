// 存储副作用 weakMap - Map - Set(去重)
const bunket = new WeakMap();

function track(target, key) { // 在getter 中调用，收集副作用
    if (!activeEffect) return
    
    let depsMap = bunket.get(target);
    if(!depsMap) {
        bunket.set(target, (depsMap = new Map()));
    }

    let deps = depsMap.get(key);
    if(!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps); // 将相应属性对应的 set 收集到 effectFn 的 deps 数组中；
}

function trigger(target, key) { // 在 setter 中调用，触发副作用
    let depsMap = bunket.get(target);
    if(!depsMap) return
    const effects = depsMap.get(key);

    const effectToRun = new Set(effects);
    effectToRun.forEach(effectFn => {
        if (effectFn === activeEffect) return;
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
}

// 使用一个全局变量表示当前的副作用函数
let activeEffect;
const effectStack = [];

// effect函数： 注册副作用函数
function effect(fn, options = {}) {
    const effectFn = () => {
        cleanUp(effectFn);
        activeEffect = effectFn;
        effectStack.push(activeEffect);
        let res = fn(); // 执行fn的时候，会收集activeEffect，所以先把fn赋值给activeEffect
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
        return res;
    };
    
    effectFn.deps = [];
    effectFn.options = options; // 将参数对象挂到 effectFn 上
    if (options.lazy) {
        return effectFn;
    }
    effectFn();
}

// cleanUp 函数, 清空
function cleanUp(effectFn){
    let deps = effectFn.deps;
    for (let i = 0; i < deps.length; i ++) {
        deps[i].delete(effectFn);
    }
    deps.length = 0; // maybe bug ? 能修改原数组的 length 吗
}

const data = {
    text: 'Hello mini-vue3',
    id: 20,
};

const proxyObj = new Proxy(data, {
    get(target, key) {
        track(target, key);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        trigger(target, key);
    }
});


/**
 *  2. 为了实现连续多次修改，只执行一次副作用， 定义一个任务队列
 */
const jobQueue = new Set();
const p = Promise.resolve();

let isFlushing = false;
function flushJob() {
    if (isFlushing) return;

    isFlushing = true;
    p.then( _ => {
        jobQueue.forEach(job => job());
    }).finally( _ => {
        isFlushing = false;
    })
}

// const effectFn = effect(() => {
//     console.log(proxyObj.id);
// },{
//     lazy: true
// })

// effectFn();

function computed(fn) {
    let dirty = true,
        value;

    const effectFn = effect(fn,{
        lazy: true,
        scheduler() {
            dirty = true;
             (data, 'value');
        }
    });

    const data = {
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            track(data, 'value');
            return value;
        }
    }
    return data;
}

let reactiveData = computed(() => {
    console.log('conduct effectFn');
    return proxyObj.id + 1;
})
// console.log(reactiveData.value);
// console.log(reactiveData.value);
// console.log(reactiveData.value);

// proxyObj.id ++;
// console.log(reactiveData.value);

effect(() => {
    console.log(reactiveData.value);
})

proxyObj.id++;
proxyObj.id++;
proxyObj.id++;
