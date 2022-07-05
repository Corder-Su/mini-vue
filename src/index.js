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
    effectToRun.forEach(fn => fn());
}

// 使用一个全局变量表示当前的副作用函数
let activeEffect;

// effect函数： 注册副作用函数
function effect(fn) {
    const effectFn = () => {
        cleanUp(effectFn);
        activeEffect = effectFn;
        fn(); // 执行fn的时候，会收集activeEffect，所以先把fn赋值给activeEffect
    };
    
    effectFn.deps = [];
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
    id: '20',
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
 * 问题： id 更改之后，就用不到 text 数据了，但 text 的变更仍然会触发 effect 执行
 *  effect(() => {
        console.log('effect run');
        document.querySelector('.app').innerHTML = proxyObj.id === '20' ? proxyObj.text : 'null';
    });

    setTimeout(() => {
        proxyObj.text = '响应式';
    }, 1000)

    setTimeout(() => {
        proxyObj.id = 579;
    }, 2000)

    setTimeout(() => {
        proxyObj.text = '响应式';
    }, 3000)
 */

/**
 * 解决： 依赖的更新！
 */

effect(() => {
    console.log('effect run');
    document.querySelector('.app').innerHTML = proxyObj.id === '20' ? proxyObj.text : 'null';
});

setTimeout(() => {
    proxyObj.text = '响应式';
}, 1000)

setTimeout(() => {
    proxyObj.id = 579;
}, 2000)

setTimeout(() => {
    proxyObj.text = '响应式';
}, 3000)
