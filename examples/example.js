// Generated by CoffeeScript 2.5.1
(function() {
  // OrgData example editor (based on Leisure)
  // =========================================
  // This extends Data store and pushes parsing into the store instead of keeping
  // it in the editing options and options delegate it to the store.
  requirejs.config({
    paths: {
      fingertree: '../build/fingertree',
      jquery: 'jquery-2.1.3.min',
      lodash: '../build/lodash-4.17.2.min'
    }
  });

  require(['./org', './docOrg', '../build/editor', 'jquery'], function(Org, DocOrg, Editor, $) {
    var DataStore, DataStoreEditingOptions, FancyEditing, Fragment, Headline, LeisureEditCore, OrgData, OrgEditing, ParsedCodeBlock, PlainEditing, Results, SimpleMarkup, Source, addChange, blockAttrs, blockLabel, blockSource, blockText, checkStructure, contentSpan, copyBlock, data, displayStructure, docBlockOrg, escapeAttr, escapeHtml, getCodeItems, getId, greduce, last, numSpan, orgDoc, orgEditing, parent, parseOrgDoc, parseOrgMode, parseYaml, plainEditing, posFor, set$, siblings;
    ({parseOrgMode, orgDoc, Source, Results, Headline, SimpleMarkup, Fragment} = Org);
    ({
      orgDoc,
      getCodeItems,
      blockSource,
      blockOrg: docBlockOrg,
      ParsedCodeBlock,
      parseYaml
    } = DocOrg);
    ({last, DataStore, DataStoreEditingOptions, blockText, posFor, escapeHtml, copyBlock, LeisureEditCore, set$} = Editor);
    orgEditing = null;
    plainEditing = null;
    data = null;
    OrgData = class OrgData extends DataStore {
      getBlock(thing, changes) {
        var ref;
        if (typeof thing === 'object') {
          return thing;
        } else {
          return (ref = changes != null ? changes.sets[thing] : void 0) != null ? ref : super.getBlock(thing);
        }
      }

      changesFor(first, oldBlocks, newBlocks) {
        var changes;
        changes = super.changesFor(first, oldBlocks, newBlocks);
        this.linkAllSiblings(changes);
        return changes;
      }

      load(name, text) {
        return this.makeChanges(() => {
          this.suppressTriggers(() => {
            return super.load(name, text);
          });
          this.linkAllSiblings({
            first: this.first,
            sets: this.blocks,
            oldBlocks: [],
            newBlocks: this.blockList()
          });
          return this.trigger('load');
        });
      }

      parseBlocks(text) {
        return parseOrgDoc(text);
      }

      nextSibling(thing, changes) {
        var ref;
        return this.getBlock((ref = this.getBlock(thing, changes)) != null ? ref.nextSibling : void 0, changes);
      }

      previousSibling(thing, changes) {
        return this.getBlock(this.getBlock(thing, changes).previousSibling, changes);
      }

      reducePreviousSiblings(thing, changes, func, arg) {
        return greduce(this.getBlock(thing, changes), changes, func, arg, (b) => {
          return this.getBlock(b.previousSibling, changes);
        });
      }

      reduceNextSiblings(thing, changes, func, arg) {
        return greduce(this.getBlock(thing, changes), changes, func, arg, (b) => {
          return this.getBlock(b.nextSibling, changes);
        });
      }

      lastSibling(thing, changes) {
        return this.reduceNextSiblings(thing, changes, (function(x, y) {
          return y;
        }), null);
      }

      firstSibling(thing, changes) {
        return this.reducePreviousSiblings(thing, changes, (function(x, y) {
          return y;
        }), null);
      }

      parent(thing, changes) {
        var ref;
        return this.getBlock((ref = this.firstSibling(thing, changes)) != null ? ref.prev : void 0, changes);
      }

      properties(thing) {
        var bl, props;
        props = {};
        bl = this.getBlock(thing);
        if (bl.type !== 'headline') {
          if (bl.type === 'code') {
            _.defaults(props, bl.codeAttributes);
            _.defaults(props, bl.properties);
          } else if (bl.type === 'chunk') {
            _.defaults(props, bl.properties);
          }
          bl = this.parent(bl);
        }
        while (bl) {
          this.scrapePropertiesInto(bl, props);
          bl = this.parent(bl);
        }
        return props;
      }

      scrapePropertiesInto(block, props) {
        var child, j, len, ref, results;
        ref = this.children(block);
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          child = ref[j];
          if (child.type === 'chunk' && child.properties && !_.isEmpty(child.properties)) {
            results.push(_.defaults(props, child.properties));
          } else {
            results.push(void 0);
          }
        }
        return results;
      }

      firstChild(thing, changes) {
        var block, n;
        if ((block = this.getBlock(thing, changes)) && (n = this.getBlock(block.next, changes)) && !n.previousSibling) {
          return n;
        }
      }

      lastChild(thing, changes) {
        return this.lastSibling(this.firstChild(thing, changes), changes);
      }

      children(thing, changes) {
        var c;
        c = [];
        this.reduceNextSiblings(this.firstChild(thing, changes), changes, (function(x, y) {
          return c.push(y);
        }), null);
        return c;
      }

      // `nextRight` returns the next thing in the tree after this subtree, which is just the
      // next sibling if there is one, otherwise it's the closest "right uncle" of this node
      nextRight(thing, changes) {
        var sib;
        while (thing) {
          if (sib = this.nextSibling(thing, changes)) {
            return sib;
          }
          thing = this.parent(thing, changes);
        }
        return null;
      }

      // `linkAllSiblings` -- modify changes so that the sibling links will be correct when the changes are applied.
      linkAllSiblings(changes) {
        var block, cur, emptyNexts, id, parent, results, sibling, stack;
        stack = [];
        parent = null;
        sibling = null;
        emptyNexts = {};
        cur = this.getBlock(changes.first, changes);
        while (cur) {
          if (cur.nextSibling) {
            emptyNexts[cur._id] = cur;
          }
          if (cur.type === 'headline') {
            while (parent && cur.level <= parent.level) {
              [parent, sibling] = stack.pop();
            }
          } else if (cur.type === 'chunk' && (cur.properties != null) && parent && !_(parent.propertiesBlocks).includes(cur._id)) {
            if (!parent.propertiesBlocks) {
              parent.propertiesBlocks = [];
            }
            parent.propertiesBlocks.push(cur._id);
          }
          if (sibling) {
            delete emptyNexts[sibling._id];
            if (sibling.nextSibling !== cur._id) {
              addChange(sibling, changes).nextSibling = cur._id;
            }
            if (cur.previousSibling !== sibling._id) {
              addChange(cur, changes).previousSibling = sibling._id;
            }
          } else if (cur.previousSibling) {
            delete addChange(cur, changes).previousSibling;
          }
          sibling = cur;
          if (cur.type === 'headline') {
            stack.push([parent, sibling]);
            parent = cur;
            sibling = null;
          }
          cur = this.getBlock(cur.next, changes);
        }
        results = [];
        for (id in emptyNexts) {
          block = emptyNexts[id];
          results.push(delete addChange(block, changes).nextSibling);
        }
        return results;
      }

    };
    parseOrgDoc = function(text) {
      if (text === '') {
        return [];
      } else {
        return orgDoc(parseOrgMode(text.replace(/\r\n/g, '\n')), true);
      }
    };
    addChange = function(block, changes) {
      if (!changes.sets[block._id]) {
        changes.oldBlocks.push(block);
        changes.newBlocks.push(changes.sets[block._id] = copyBlock(block));
      }
      return changes.sets[block._id];
    };
    greduce = function(thing, changes, func, arg, next) {
      if (typeof changes === 'function') {
        next = arg;
        arg = func;
        func = changes;
      }
      if (thing && typeof arg === 'undefined') {
        arg = thing;
        thing = next(thing);
      }
      while (thing) {
        arg = func(arg, thing);
        thing = next(thing);
      }
      return arg;
    };
    getId = function(thing) {
      if (typeof thing === 'string') {
        return thing;
      } else {
        return thing._id;
      }
    };
    OrgEditing = class OrgEditing extends DataStoreEditingOptions {
      constructor(data) {
        super(data);
        data.on('load', () => {
          return this.editor.setHtml(this.editor.node[0], this.renderBlocks());
        });
      }

      blockLineFor(node, offset) {
        var block;
        ({block, offset} = this.editor.blockOffset(node, offset));
        return this.blockLine(block, offset);
      }

      blockLine(block, offset) {
        var lines, text;
        text = block.text.substring(0, offset);
        lines = text.split('\n');
        return {
          line: lines.length,
          col: last(lines).length
        };
      }

      lineInfo(block, offset) {
        var col, docLine, holder, line, p, startBlock;
        if (block) {
          ({line, col} = this.blockLine(block, offset));
          startBlock = block;
          docLine = line;
          while (block.prev) {
            block = this.getBlock(block.prev);
            docLine += block.text.split('\n').length - 1;
          }
          holder = this.nodeForId(startBlock._id);
          p = posFor(this.editor.domCursorForTextPosition(holder, offset));
          return {
            line: docLine,
            col: col,
            blockLine: line,
            top: Math.round(p.top),
            left: Math.round(p.left)
          };
        } else {
          return {};
        }
      }

      setEditor(editor1) {
        this.editor = editor1;
        return this.editor.on('moved', () => {
          var block, blockLine, col, left, line, offset, top;
          ({block, offset} = this.editor.getSelectedBlockRange());
          if (block) {
            ({line, col, blockLine, top, left} = this.lineInfo(block, offset));
            if (line) {
              return this.updateStatus(`line: ${numSpan(line)} col: ${numSpan(col)} block: ${block._id}:${numSpan(blockLine)} top: ${numSpan(top)} left: ${numSpan(left)}`);
            }
          }
          return this.updateStatus("No selection");
        });
      }

    };
    parent = function(prev, next) {
      return prev.type === 'headline' && (next.type !== 'headline' || prev.level < next.level);
    };
    siblings = function(prev, next) {
      var ref;
      return (prev.type !== 'headline' && next.type !== 'headline') || ((prev.type === (ref = next.type) && ref === 'headline') && prev.level === next.level);
    };
    PlainEditing = class PlainEditing extends OrgEditing {
      nodeForId(id) {
        return $(`#plain-${id}`);
      }

      idForNode(node) {
        var ref;
        return (ref = node.id.match(/^plain-(.*)$/)) != null ? ref[1] : void 0;
      }

      parseBlocks(text) {
        return this.data.parseBlocks(text);
      }

      renderBlock(block) {
        return [`<span id='plain-${block._id}' data-block>${escapeHtml(block.text)}</span>`, block.next];
      }

      updateStatus(line) {
        return $("#plainStatus").html(line);
      }

    };
    FancyEditing = class FancyEditing extends OrgEditing {
      changed(changes) {
        var block, id, j, len, ref, ref1, ref2, rendered, results;
        rendered = {};
        ref = changes.removes;
        for (id in ref) {
          block = ref[id];
          this.removeBlock(block);
        }
        ref1 = changes.newBlocks;
        for (j = 0, len = ref1.length; j < len; j++) {
          block = ref1[j];
          rendered[block._id] = true;
          this.updateBlock(block, changes.old[block._id]);
        }
        ref2 = changes.sets;
        results = [];
        for (id in ref2) {
          block = ref2[id];
          if (!rendered[id]) {
            results.push(this.updateBlock(block, changes.old[block._id]));
          } else {
            results.push(void 0);
          }
        }
        return results;
      }

      nodeForId(id) {
        return id && $(`#fancy-${getId(id)}`);
      }

      idForNode(node) {
        var ref;
        return (ref = node.id.match(/^fancy-(.*)$/)) != null ? ref[1] : void 0;
      }

      parseBlocks(text) {
        return this.data.parseBlocks(text);
      }

      removeBlock(block) {
        var content, node;
        if ((node = this.nodeForId(block._id)).length) {
          if (block.type === 'headline') {
            content = node.children().filter('[data-content]');
            content.children().filter('[data-block]').insertAfter(node);
          }
          return node.remove();
        }
      }

      updateBlock(block, old) {
        var child, content, html, j, len, node, ref, results;
        if ((node = this.nodeForId(block._id)).length) {
          content = node.children().filter('[data-content]');
          if (block.type !== (old != null ? old.type : void 0) || block.nextSibling !== (old != null ? old.nextSibling : void 0) || block.previousSibling !== (old != null ? old.previousSibling : void 0) || block.prev !== (old != null ? old.prev : void 0)) {
            if (block.type !== 'headline' && old.type === 'headline') {
              content.children().filter('[data-block]').insertAfter(node);
            }
            this.insertUpdateNode(block, node);
          }
          if (block.text !== (old != null ? old.text : void 0)) {
            if (node.is('[data-headline]')) {
              content.children().filter('[data-block]').insertAfter(node);
            }
            [html] = this.renderBlock(block, true);
            node = $(this.editor.setHtml(node[0], html, true));
            content = node.children().filter('[data-content]');
            if (block.type === 'headline') {
              ref = this.data.children(block);
              results = [];
              for (j = 0, len = ref.length; j < len; j++) {
                child = ref[j];
                results.push(content.append(this.nodeForId(child._id)));
              }
              return results;
            }
          }
        } else {
          node = $("<div></div>");
          this.insertUpdateNode(block, node);
          [html] = this.renderBlock(block, true);
          return this.editor.setHtml(node[0], html, true);
        }
      }

      insertUpdateNode(block, node) {
        var next, parentNode, prev, ref, ref1, ref2;
        if ((ref = (prev = this.nodeForId(this.data.previousSibling(block)))) != null ? ref.length : void 0) {
          return prev.after(node);
        } else if (!block.prev) {
          return this.editor.node.prepend(node);
        } else if (!block.previousSibling && ((ref1 = (parentNode = this.nodeForId(block.prev))) != null ? ref1.is("[data-headline]") : void 0)) {
          return parentNode.children().filter("[data-content]").children().first().after(node);
        } else if ((ref2 = (next = this.nodeForId(this.data.nextSibling(block)))) != null ? ref2.length : void 0) {
          return next.before(node);
        } else {
          return this.editor.node.append(node);
        }
      }

      renderBlock(block, skipChildren) {
        var child, html, ref;
        html = block.type === 'headline' ? `<div ${blockAttrs(block)} contenteditable='false'>${blockLabel(block)}<div contenteditable='true' data-content>${contentSpan(block.text, 'text')}${!skipChildren ? ((function() {
          var j, len, ref, ref1, results;
          ref1 = (ref = this.data.children(block)) != null ? ref : [];
          results = [];
          for (j = 0, len = ref1.length; j < len; j++) {
            child = ref1[j];
            results.push(this.renderBlock(child)[0]);
          }
          return results;
        }).call(this)).join('') : ''}</div></div>` : block.type === 'code' ? `<span ${blockAttrs(block)}>${blockLabel(block)}${escapeHtml(block.text)}</span>` : `<span ${blockAttrs(block)}>${blockLabel(block)}${escapeHtml(block.text)}</span>`;
        return [html, ((ref = this.data.nextSibling(block)) != null ? ref._id : void 0) || !this.data.firstChild(block) && block.next];
      }

      updateStatus(line) {
        return $("#orgStatus").html(line);
      }

    };
    numSpan = function(n) {
      return `<span class='status-num'>${n}</span>`;
    };
    blockLabel = function(block) {
      return `<span class='blockLabel' contenteditable='false' data-noncontent>[${block.type} ${block._id}]</span>`;
    };
    blockAttrs = function(block) {
      var extra;
      extra = '';
      if (block.type === 'headline') {
        extra += ` data-headline='${escapeAttr(block.level)}'`;
      }
      return `id='fancy-${escapeAttr(block._id)}' data-block='${escapeAttr(block._id)}' data-type='${escapeAttr(block.type)}'${extra}`;
    };
    contentSpan = function(str, type) {
      str = escapeHtml(str);
      if (str) {
        return `<span${type ? ` data-org-type='${escapeAttr(type)}'` : ''}>${str}</span>`;
      } else {
        return '';
      }
    };
    escapeAttr = function(str) {
      if (typeof str === 'string') {
        return str.replace(/['"&]/g, function(c) {
          switch (c) {
            case '"':
              return '&quot;';
            case "'":
              return '&#39;';
            case '&':
              return '&amp;';
          }
        });
      } else {
        return str;
      }
    };
    displayStructure = function(data) {
      var bad, check, checks, cur, i, info, level, p, parentStack, prev, prevParent;
      parentStack = [];
      info = "";
      level = 0;
      cur = data.getBlock(data.first);
      prevParent = null;
      checks = {
        nextSibling: {},
        previousSibling: {},
        prev: {}
      };
      check = cur;
      prev = null;
      while (check) {
        checks.nextSibling[check.previousSibling] = check._id;
        checks.previousSibling[check.nextSibling] = check._id;
        checks.prev[check.next] = check._id;
        prev = check;
        check = data.getBlock(check.next);
      }
      while (cur) {
        bad = [];
        if (cur.nextSibling !== checks.nextSibling[cur._id]) {
          bad.push('nextSibling');
        }
        if (cur.previousSibling !== checks.previousSibling[cur._id]) {
          bad.push('previousSibling');
        }
        if (cur.prev !== checks.prev[cur._id]) {
          bad.push('prev');
        }
        if (!cur.previousSibling) {
          p = cur;
          while (p = data.parent(p)) {
            level++;
          }
        }
        info += `${((function() {
          var j, ref, results;
          results = [];
          for (i = j = 0, ref = level; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
            results.push('   ');
          }
          return results;
        })()).join('')}${cur._id}${checkStructure(cur, bad)}: ${JSON.stringify(cur.text)}\n`;
        if (!cur.nextSibling) {
          level = 0;
        }
        cur = data.getBlock(cur.next);
      }
      return $("#blocks").html(info);
    };
    checkStructure = function(block, bad) {
      var err;
      if (bad.length) {
        return ' <span class="err">[' + ((function() {
          var j, len, results;
          results = [];
          for (j = 0, len = bad.length; j < len; j++) {
            err = bad[j];
            results.push(`${err}: ${block[err]}`);
          }
          return results;
        })()).join(', ') + ']</span>';
      } else {
        return '';
      }
    };
    set$($, function(o) {
      return o instanceof $;
    });
    return $(document).ready(function() {
      var editor;
      window.DATA = data = new OrgData();
      data.on('change', function(changes) {
        return displayStructure(data);
      }).on('load', function() {
        return displayStructure(data);
      });
      window.ED = editor = new LeisureEditCore($("#fancyEditor"), new FancyEditing(data));
      window.ED2 = new LeisureEditCore($("#plainEditor"), new PlainEditing(data));
      return setTimeout((function() {
        return editor.loadURL("example.lorg");
      }), 1);
    });
  });

}).call(this);

//# sourceMappingURL=example.js.map
