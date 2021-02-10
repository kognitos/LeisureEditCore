export default new Promise((resolve, reject)=>
    require(['editor.js'], (Editor)=> resolve(Editor))
);
