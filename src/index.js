// 存储副作用
const bunket = new Map();

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
        if (activeEffect) {
            if(!bunket.has(key)) {
                bunket.set(key, new Set())
            }
            // 副作用函数必须叫 effect 才能被收集到
            bunket.get(key).add(activeEffect);
        }
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        bunket.get(key).forEach(fn => fn());
        return true; // 执行成功
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
