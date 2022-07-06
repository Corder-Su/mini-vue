Promise.resolve().then(_ => {
    console.log('微任务');
})
console.log('同步任务');