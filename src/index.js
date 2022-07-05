// 存储副作用
const bunket = new Map();

const data = {
    text: 'Hello mini-vue3',
    id: '20',
};

const proxyObj = new Proxy(data, {
    get(target, key) {
        if(!bunket.has(key)) {
            bunket.set(key, new Set())
        }
        // 副作用函数必须叫 effect 才能被收集到
        bunket.get(key).add(effect);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        bunket.get(key).forEach(fn => fn());
        return true; // 执行成功
    }
});

function effect() {
    document.querySelector('.app').innerHTML = `${proxyObj.text}--${proxyObj.id}`;
}

effect();

setTimeout(() => {
    proxyObj.text = '响应式';
}, 1000)

setTimeout(() => {
    proxyObj.id = 579;
}, 2000)
