require(['./org', './docOrg', '../build/editor.js', 'jquery-2.1.3.min.js'],
        (Org, DocOrg, Editor, $)=> {
    window.Org = Org;
    window.DocOrg = DocOrg;
    window.LeisureEditCore = Editor;
    window.$ = $;
    import('./example2.js');
})
