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
}

function trigger(target, key) { // 在 setter 中调用，触发副作用
    let depsMap = bunket.get(target);
    if(!depsMap) return
    let effects = depsMap.get(key);
    effects && effects.forEach(fn => fn());
}

// 使用一个全局变量表示当前的副作用函数
let activeEffect;

// effect函数： 注册副作用函数
function effect(fn) {
    activeEffect = fn;  
    fn(); // 执行fn的时候，会收集activeEffect，所以先把fn赋值给activeEffect
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

effect(() => {
    console.log('effect run');
    document.querySelector('.app').innerHTML = `${proxyObj.text}--${proxyObj.id}`;
});

setTimeout(() => {
    proxyObj.text = '响应式';
}, 1000)

setTimeout(() => {
    proxyObj.id = 579;
}, 2000)
