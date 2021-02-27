const quitSkip = ['quit', 'skip'];
function differentLines(pos1, pos2) {
    return (pos1.bottom - 4 <= pos2.top) || (pos2.bottom - 4 <= pos1.top);
}
function selectRange(r) {
    if (r) {
        //debug("select range", r, new Error('trace').stack)
        const sel = getSelection();
        if (!(sel.rangeCount == 1 && sameRanges(sel.getRangeAt(0), r))) {
            sel.setBaseAndExtent(r.startContainer, r.startOffset, r.endContainer, r.endOffset);
        }
    }
}
function differentPosition(pos1, pos2) {
    if (differentLines(pos2, pos1))
        return true;
    if (pos1.right == undefined || pos2.right == undefined) {
        return Math.floor(pos1.left) != Math.floor(pos2.left);
    }
    const r1 = Math.floor(pos1.right);
    const r2 = Math.floor(pos2.right);
    const l1 = Math.floor(pos1.left);
    const l2 = Math.floor(pos2.left);
    return (r1 != r2 || l1 != l2) && (r2 < l1 || r1 < l2 || ((r1 < r2) == (l1 < l2) && (r1 > r2) == (l1 > l2)));
}
function getTextPosition(textNode, offset) {
    let r;
    if (offset < textNode.length) {
        spareRange.setStart(textNode, offset);
        spareRange.setEnd(textNode, offset + 1);
        r = getClientRect(spareRange);
        if (!r || (r.width == 0 && r.height == 0)) {
            spareRange.selectNodeContents(textNode.parentNode);
            if (spareRange.getClientRects().length == 0) {
                r = textNode.parentNode.getBoundingClientRect();
            }
        }
    }
    else {
        spareRange.setStart(textNode, offset);
        spareRange.collapse(true);
        r = getClientRect(spareRange);
    }
    if (!r || (r.width == 0 && r.height == 0)) {
        if (offset == 0)
            textNode.parentNode.insertBefore(positioner, textNode);
        else if (offset == textNode.length || textNode.splitText(offset)) {
            textNode.parentNode.insertBefore(positioner, textNode.nextSibling);
        }
        spareRange.selectNode(positioner);
        r = spareRange.getBoundingClientRect();
        positioner.parentNode.removeChild(positioner);
        textNode.parentNode.normalize();
    }
    return r;
}
// Thanks to (rangy)[this: https://github.com/timdown/rangy] for the isCollapsed logic
function isCollapsed(node) {
    if (node) {
        const type = node.nodeType;
        return type == 7 || // PROCESSING_INSTRUCTION
            type == 8 || // COMMENT
            (type == node.TEXT_NODE && (node.data == '' || isCollapsed(node.parentNode))) ||
            /^(script|style)$/i.test(node.nodeName) ||
            (type == node.ELEMENT_NODE && !node.offsetParent);
    }
}
export function isText(n) { return n.nodeType == n.TEXT_NODE; }
export function isElement(n) { return n.nodeType == n.ELEMENT_NODE; }
export class DOMCursor {
    constructor(node, pos, filter) {
        if (node instanceof Range) {
            filter = pos;
            this.pos = node.startOffset ?? 0;
            this.node = node.startContainer;
        }
        else {
            this.node = node;
            this.pos = typeof pos == 'number' ? pos : 0;
        }
        this.filter = pos instanceof Function ? pos : filter ?? ((_n) => true);
        this.computeType();
        this.savedTextPosition = null;
    }
    isCollapsed() { return !this.isEmpty() && isCollapsed(this.node); }
    computeType() {
        this.type = !this.node ? 'empty'
            : this.node.nodeType == this.node.TEXT_NODE ? 'text'
                : 'element';
        return this;
    }
    equals(other) { return this.node == other.node && this.pos == other.pos; }
    newPos(node, pos) {
        if (node instanceof Range)
            return new DOMCursor(node, this.filter);
        return new DOMCursor(node, pos, this.filter);
    }
    toString() { return `DOMCursor(${this.type}, ${this.pos}${this.type == 'text' ? ', ' + this.posString() : ''})`; }
    posString() {
        const data = this.text().data;
        return `${data.substring(0, this.pos)}|${data.substring(this.pos)}`;
    }
    textPosition() {
        if (this.isEmpty())
            return null;
        return this.savedTextPosition ?? (this.savedTextPosition = getTextPosition(this.text(), this.pos));
    }
    isDomCaretTextPosition() {
        const p = this.textPosition();
        let r = document.caretRangeFromPoint(p.left, p.top);
        return r.startContainer == this.node && r.startOffset == this.pos;
    }
    /** returns the character at the position */
    character() {
        const p = this.type == 'text' ? this : this.save().firstText();
        return p.text().data[p.pos];
    }
    /** returns true if the cursor is empty */
    isEmpty() { return this.type == 'empty'; }
    setFilter(f) { return new DOMCursor(this.node, this.pos, f); }
    addFilter(filt) {
        if (typeof filt == 'string') {
            const selector = filt;
            filt = (n) => isElement(n.node) && n.node.matches(selector);
        }
        const oldFilt = this.filter;
        const newFilt = filt;
        return this.setFilter((n) => {
            let r1 = oldFilt(n);
            if (quitSkip.includes(r1))
                return r1;
            let r2 = newFilt(n);
            if (quitSkip.includes(r2))
                return r2;
            return r1 && r2;
        });
    }
    /** moves to the next filtered node */
    next(up) {
        const saved = this.save();
        let n = this.nodeAfter(up);
        move: while (!n.isEmpty()) {
            const res = this.filter(n);
            switch (res) {
                case 'skip':
                    n = n.nodeAfter(true);
                    continue;
                case 'quit': break move;
                default: if (res)
                    return n;
            }
            n = n.nodeAfter();
        }
        return this.restore(saved).emptyNext();
    }
    /** moves to the previous filtered node */
    prev(up) {
        const saved = this.save();
        let n = this.nodeBefore(up);
        move: while (!n.isEmpty()) {
            const res = this.filter(n);
            switch (res) {
                case 'skip':
                    n = n.nodeBefore(true);
                    continue;
                case 'quit':
                    break move;
                default:
                    if (res)
                        return n;
            }
            n = n.nodeBefore();
        }
        return this.restore(saved).emptyPrev();
    }
    /** returns all of the nodes this cursor finds */
    nodes() {
        const result = [];
        let n = this;
        while (!(n = n.next()).isEmpty()) {
            result.push(n.node);
        }
        return result;
    }
    /** move the document selection to the current position */
    moveCaret(r) {
        if (!this.isEmpty()) {
            if (!r)
                r = document.createRange();
            r.setStart(this.node, this.pos);
            r.collapse(true);
            selectRange(r);
        }
        return this;
    }
    scrollIntoViewIfNeeded() {
        const n = this.node.nodeType == this.node.TEXT_NODE ? this.node.parentNode : this.node;
        //TS doesn't know Element has scrollIntoViewIfNeeded()
        n.scrollIntoViewIfNeeded();
        return this;
    }
    text() { return this.node; }
    element() { return this.node; }
    adjustForNewline() {
        if (this.isEmpty())
            return this;
        const s = this.save();
        let n = this;
        if (this.pos == 0 && this.text().data[0] == '\n') {
            while (!n.isEmpty() && (n = n.prev()).type != 'text')
                ;
            return n.isEmpty() ? s
                : n.text().data[n.pos - 1] == '\n' ? s
                    : n;
        }
        if (this.pos == this.text().length && this.text().data[this.pos - 1] == '\n') {
            //while (!n.isEmpty() && (n = n.prev()).type != 'text');
            while (!n.isEmpty() && (n = n.next()).type != 'text')
                ;
            return n.text().data[n.pos] == '\n' ? s : n;
        }
        return this;
    }
    /** create a range between two positions */
    range(other, r) {
        if (!r)
            r = document.createRange();
        if (!other)
            other = this;
        r.setStart(this.node, this.pos);
        r.setEnd(other.node, other.pos);
        return r;
    }
    /** find the first text node (the 'backwards' argument is optional and if true, indicates to find the first text node behind the cursor). */
    firstText(backwards) {
        let n = this;
        while (!n.isEmpty() && (n.type != 'text' || (!backwards && n.pos == n.text().data.length))) {
            n = backwards ? n.prev() : n.next();
        }
        return n;
    }
    /** count the characters in the filtered nodes until we get to (node, pos). Includes (node, 0) up to but not including (node, pos) */
    countChars(node, pos) {
        const start = this.copy();
        if (node instanceof DOMCursor) {
            pos = node.pos;
            node = node.node;
        }
        let n = this;
        let tot = 0;
        while (!n.isEmpty() && n.node != node) {
            if (n.type == 'text')
                tot += n.text().length;
            n = n.next();
        }
        if (n.isEmpty() || n.node != node)
            return -1;
        if (n.type == 'text') {
            tot += pos;
            if (start.node == n.node)
                tot -= start.pos;
        }
        return tot;
    }
    /** moves the cursor forward by count characters if contain is true and the final location is 0 then go to the end of the previous text node (node, node.length), if contain is false but containIfSpace is true and the final location is 0 and is also a space, then go to the end of the previous text node (provided we didn't start there). */
    forwardChars(count, contain) {
        if (count == 0)
            return this;
        let n = this;
        count += this.pos;
        while (!n.isEmpty() && 0 <= count) {
            if (n.type == 'text') {
                if (count < n.text().length) {
                    if (count == 0 && contain) {
                        n = n.prev();
                        while (n.type != 'text')
                            n = n.prev();
                        return n.newPos(n.node, n.text().length);
                    }
                    else
                        return n.newPos(n.node, count);
                }
                count -= n.text().length;
            }
            n = n.next();
        }
        return n.emptyNext();
    }
    /** returns true if the node is an element and has the attribute or if it is a text node and its parent has the attribute */
    hasAttribute(a) {
        return this.node && this.node.nodeType == this.node.ELEMENT_NODE && this.element().hasAttribute(a);
    }
    /** returns the attribute if the node is an element and has the attribute */
    getAttribute(a) {
        return this.node && this.node.nodeType == this.node.ELEMENT_NODE && this.element().getAttribute(a);
    }
    /** adds text node filtering to the current filter; the cursor will only find text nodes */
    filterTextNodes() { return this.addFilter((n) => n.type == 'text'); }
    /** adds visible text node filtering to the current filter; the cursor will only find visible text nodes */
    filterVisibleNodes() { return this.addFilter((n) => !n.isCollapsed()); }
    /** adds visible text node filtering to the current filter; the cursor will only find visible text nodes */
    filterVisibleTextNodes() { return this.filterTextNodes().filterVisibleNodes(); }
    /** adds parent filtering to the current filter; the cursor will only find nodes that are contained in the parent (or equal to it) */
    filterParent(parent) {
        return !parent ? this.setFilter((n) => 'quit')
            : this.addFilter((n) => parent.contains(n.node) || 'quit');
    }
    /** adds range filtering to the current filter; the cursor will only find nodes that are contained in the range */
    filterRange(startContainer, startOffset, endContainer, endOffset) {
        let start;
        if (typeof startOffset != 'number') {
            if (startContainer instanceof Range) {
                const r = startContainer;
                start = r.startContainer;
                startOffset = r.startOffset;
                endContainer = r.endContainer;
                endOffset = r.endOffset;
            }
            else {
                start = startContainer;
            }
        }
        return this.addFilter((n) => {
            const startPos = start.compareDocumentPosition(n.node);
            if (startPos == 0 && startOffset <= n.pos && n.pos <= endOffset)
                return true;
            if (startPos & this.node.DOCUMENT_POSITION_FOLLOWING) {
                const endPos = endContainer.compareDocumentPosition(n.node);
                if ((endPos == 0 && n.pos <= endOffset) ||
                    (endPos & this.node.DOCUMENT_POSITION_PRECEDING)) {
                    return true;
                }
            }
            return 'quit';
        });
    }
    /** gets all of the text at or after the cursor (useful with filtering; see above) */
    getText(len) {
        let n = this.mutable().firstText();
        if (n.isEmpty())
            return '';
        let t = n.text().data.substring(n.pos);
        len = len ?? Number.MAX_SAFE_INTEGER;
        while (!(n = n.next()).isEmpty() && t.length < len) {
            if (n.type == 'text') {
                t += n.text().data;
                len -= n.text().length;
            }
        }
        if (t.length > len)
            return t.substring(0, len);
        if (!t.length)
            return '';
        while (n.type != 'text')
            n = n.prev();
        n = n.newPos(n.node, n.text().length);
        while (n.pos > 0 && reject(n.filter(n)))
            n.pos--;
        return t.substring(0, t.length - n.text().length + n.pos);
    }
    /** gets all of the text at or after the cursor (useful with filtering; see above) */
    getTextTo(other) {
        let n = this.mutable().firstText();
        if (n.isEmpty())
            return '';
        let t = n.text().data.substring(n.pos);
        if (n.node != other.node) {
            while (!(n = n.next()).isEmpty()) {
                if (n.type == 'text')
                    t += n.text().data;
                if (n.node == other.node)
                    break;
            }
        }
        if (!t.length)
            return '';
        while (n.type != 'text')
            n.prev();
        n = n.newPos(n.node, n.node == other.node ? other.pos : n.text().length);
        while (n.pos > 0 && reject(n.filter(n)))
            n.pos--;
        return t.substring(0, t.length - n.text().length + n.pos);
    }
    char() { return this.type == 'text' && this.text().data[this.pos]; }
    /** returns whether the current character is a newline */
    isNL() { return this.char() == '\n'; }
    /** returns whether the current node ends with a newline */
    endsInNL() { return this.type == 'text' && this.text().data[this.text().length - 1] == '\n'; }
    /** moves to the beginning of the node */
    moveToStart() { return this.newPos(this.node, 0); }
    /** moves to the beginning of the next node */
    moveToNextStart() { return this.next().moveToStart(); }
    /** moves to the textual end the node (1 before the end if the node ends in a newline) */
    moveToEnd() {
        const end = this.text().length - (this.endsInNL() ? 1 : 0);
        return this.newPos(this.node, end);
    }
    /** moves to the textual end the previous node (1 before the end if the node ends in a newline) */
    moveToPrevEnd() { return this.prev().moveToEnd(); }
    /** moves forward until the given function is false or 'found', returning the previous position if the function is false or the current position if the function is 'found' */
    forwardWhile(test) {
        let n = this.immutable();
        let prev = n;
        let t;
        while (n = n.forwardChar()) {
            if (n.isEmpty() || !(t = test(n)))
                return prev;
            if (t == 'found')
                return n;
            prev = n;
        }
    }
    /** checks whether a condition is true until the EOL */
    checkToEndOfLine(test) {
        let n = this.immutable();
        let tp = n.textPosition();
        while (!n.isEmpty() && test(n)) {
            if (differentLines(tp, n.textPosition()))
                return true;
            n = n.forwardChar();
        }
        return n.isEmpty();
    }
    /** checks whether a condition is true until the EOL */
    checkToStartOfLine(test) {
        let n = this.immutable();
        let tp = n.textPosition();
        while (!n.isEmpty() && test(n)) {
            if (differentLines(tp, n.textPosition()))
                return true;
            n = n.backwardChar();
        }
        return n.isEmpty();
    }
    /** moves to the end of the current line */
    endOfLine() {
        const tp = this.textPosition();
        return this.forwardWhile((n) => !differentLines(tp, n.textPosition()));
    }
    /** moves to the next line, trying to keep the current screen pixel column.  Optionally takes a goalFunc that takes the position's screen pixel column as input and returns -1, 0, or 1 from comparing the input to the an goal column */
    forwardLine(goalFunc) {
        if (!goalFunc)
            goalFunc = (_n) => -1;
        let line = 0;
        let tp = this.textPosition();
        return this.forwardWhile((n) => {
            const pos = n.textPosition();
            if (differentLines(tp, pos)) {
                tp = pos;
                line++;
            }
            if (line == 1 && goalFunc(pos.left + 2) > -1)
                return 'found';
            return line != 2;
        });
    }
    /** moves backward until the given function is false or 'found',
returning the previous position if the function is false or the current
position if the function is 'found' */
    backwardWhile(test) {
        let n = this.immutable();
        let prev = n;
        let t;
        while (n = n.backwardChar()) {
            if (n.isEmpty() || !(t = test(n)))
                return this.restore(prev);
            if (t == 'found')
                return this.restore(n);
            prev = n;
        }
        return this;
    }
    /** moves to the start of the current line */
    startOfLine() {
        const tp = this.textPosition();
        return this.backwardWhile((n) => !differentLines(tp, n.textPosition()));
    }
    differentPosition(c) { return differentPosition(this.textPosition(), c.textPosition()); }
    differentLines(c) { return differentLines(this.textPosition(), c.textPosition()); }
    /** moves to the previous line, trying to keep the current screen pixel column.  Optionally takes a goalFunc that takes the position's screen pixel column as input and returns -1, 0, or 1 from comparing the input to an internal goal column */
    backwardLine(goalFunc) {
        // optional goalFunc takes the position's screen pixel column as input
        // It returns -1, 0, or 1, comparing the input to the internal goal column
        if (!goalFunc)
            goalFunc = (_n) => -1;
        let tp = this.textPosition();
        let line = 0;
        return (this.backwardWhile((n) => {
            const pos = n.textPosition();
            if (differentLines(tp, pos)) {
                tp = pos;
                line++;
            }
            if (line == 1 && [-1, 0].includes(goalFunc(n.textPosition().left - 2)))
                return 'found';
            return line != 2;
        })).adjustBackward();
    }
    adjustBackward() {
        const p = this.textPosition();
        return this.backwardWhile((n) => !differentPosition(p, n.textPosition()));
    }
    forwardChar() {
        if (this.pos + 1 <= this.text().length)
            return this.newPos(this.node, this.pos + 1);
        let n = this;
        while (!(n = n.next()).isEmpty()) {
            if (n.text().length != 0)
                break;
        }
        return n;
    }
    boundedForwardChar() {
        const n = this.save().forwardChar();
        return n.isEmpty() ? n.prev() : n;
    }
    /** move backward by one character.  If spanSpace is true and it moves over a space and ends up at the start of a node, move to the end of the previous node instead. */
    backwardChar() {
        let p = this;
        const oldNode = this.node;
        while (!p.isEmpty() && p.pos == 0)
            p = p.prev();
        if (p.isEmpty())
            return p;
        return p.newPos(p.node, (p.node != oldNode ? p.pos : p.pos - 1));
    }
    boundedBackwardChar() {
        const n = this.save().backwardChar();
        return n.isEmpty() ? n.next() : n;
    }
    /** scroll the position into view.  Optionally takes a rectangle representing a toolbar at the top of the page (sorry, this is a bit limited at the moment) */
    show(topRect) {
        const p = this.textPosition();
        if (p) {
            const top = topRect?.width && topRect.top == 0 ? topRect.bottom : 0;
            if (p.bottom > window.innerHeight)
                window.scrollBy(0, p.bottom - window.innerHeight);
            else if (p.top < top)
                window.scrollBy(0, p.top - top);
        }
        return this;
    }
    immutable() { return this; }
    /** call a function with a mutable version of this cursor */
    withMutations(func) {
        const m = this.copy().mutable();
        func(m);
        return m.immutable();
    }
    mutable() { return new MutableDOMCursor(this.node, this.pos, this.filter); }
    save() { return this; }
    restore(c) { return c.immutable(); }
    copy() { return this; }
    /** low level method that moves to the unfiltered node after the current one */
    nodeAfter(up) {
        let node = this.node;
        while (node) {
            if (node.nodeType == node.ELEMENT_NODE && !up && node.childNodes.length) {
                return this.newPos(node.childNodes[0], 0);
            }
            else if (node.nextSibling) {
                return this.newPos(node.nextSibling, 0);
            }
            else {
                up = true;
                node = node.parentNode;
            }
        }
        return this.emptyNext();
    }
    /** returns an empty cursor whose prev is the current node */
    emptyNext() {
        // return an empty next node where
        //   prev returns this node
        //   next returns the same empty node
        return {
            __proto__: emptyDOMCursor,
            filter: this.filter,
            prev: (up) => up ? this.prev(up) : this,
            nodeBefore: (up) => up ? this.nodeBefore(up) : this,
        };
    }
    /** low level method that moves to the unfiltered node before the current one */
    nodeBefore(up) {
        let node = this.node;
        while (node) {
            let newNode;
            if (node.nodeType == node.ELEMENT_NODE && !up && node.childNodes.length) {
                newNode = node.childNodes[node.childNodes.length - 1];
            }
            else if (node.previousSibling) {
                newNode = node.previousSibling;
            }
            else {
                up = true;
                node = node.parentNode;
                continue;
            }
            return this.newPos(newNode, newNode.nodeType == node.ELEMENT_NODE ? newNode.childNodes.length
                : newNode.nodeType == node.TEXT_NODE ? newNode.length
                    : 0);
        }
        return this.emptyPrev();
    }
    /** returns an empty cursor whose next is the current node */
    emptyPrev() {
        // return an empty prev node where
        //   next returns this node
        //   prev returns the same empty node
        return {
            __proto__: emptyDOMCursor,
            filter: this.filter,
            next: (up) => up ? this.next(up) : this,
            nodeAfter: (up) => up ? this.nodeAfter(up) : this,
        };
    }
}
DOMCursor.debug = false;
DOMCursor.differentLines = differentLines;
DOMCursor.selectRange = selectRange;
DOMCursor.differentPosition = differentPosition;
DOMCursor.getTextPosition = getTextPosition;
DOMCursor.isCollapsed = isCollapsed;
class EmptyDOMCursor extends DOMCursor {
    moveCaret() { return this; }
    show() { return this; }
    nodeAfter() { return this; }
    nodeBefore() { return this; }
    next() { return this; }
    prev() { return this; }
    forwardWhile(_test) { return this; }
    backwarddWhile(_test) { return this; }
    moveToStart() { return this; }
    moveToNextStart() { return this; }
    moveToEnd() { return this; }
    moveToPrevEnd() { return this; }
    getText() { return ''; }
    getTextTo(_other) { return ''; }
    addFilter(_filt) { return this; }
    setFilter(_filt) { return this; }
}
//singleton empty DOM cursor
var emptyDOMCursor = new EmptyDOMCursor(null);
class MutableDOMCursor extends DOMCursor {
    constructor(node, pos, filter) {
        super(node, pos, filter);
    }
    setFilter(filt) {
        this.filter = filt;
        return this;
    }
    newPos(node, pos) {
        this.node = node;
        this.pos = pos;
        this.savedTextPosition = null;
        return this.computeType();
    }
    copy() { return new MutableDOMCursor(this.node, this.pos, this.filter); }
    mutable() { return this; }
    immutable() { return new DOMCursor(this.node, this.pos, this.filter); }
    save() { return this.immutable(); }
    withMutations(filt) {
        filt(this);
        return this;
    }
    restore(c) {
        this.node = c.node;
        this.pos = c.pos;
        this.filter = c.filter;
        this.savedTextPosition = c.savedTextPosition;
        this.type = c.type;
        return this;
    }
    emptyPrev() {
        this.type = 'empty';
        Object.assign(this, {
            next: (up) => {
                this.revertEmpty();
                return up ? this.next(up) : this;
            },
            nodeAfter: (up) => {
                this.computeType();
                return up ? this.nodeAfter(up) : this;
            },
            prev: () => this,
            nodeBefore: () => this,
        });
        return this;
    }
    revertEmpty() {
        this.computeType();
        delete this.next;
        delete this.prev;
        delete this.nodeAfter;
        delete this.nodeBefore;
        return this;
    }
    emptyNext() {
        this.type = 'empty';
        Object.assign(this, {
            prev: (up) => {
                this.revertEmpty();
                return up ? this.prev(up) : this;
            },
            nodeBefore: (up) => {
                this.computeType();
                return up ? this.nodeBefore(up) : this;
            },
            next: () => this,
            nodeAfter: () => this,
        });
        return this;
    }
}
function sameRanges(r1, r2) {
    return r1.compareBoundaryPoints(r1.START_TO_START, r2) == 0 &&
        r1.compareBoundaryPoints(r1.END_TO_END, r2) == 0;
}
function debug(...args) { if (DOMCursor.debug)
    console.log(...args); }
function reject(filterResult) { return !filterResult || quitSkip.includes(filterResult); }
var positioner = document.createElement('DIV');
positioner.setAttribute('style', 'display: inline-block');
positioner.innerHTML = 'x';
var spareRange = document.createRange();
var emptyRect = new DOMRect();
function chooseUpper(r1, r2) { return r1.top < r2.top; }
function chooseLower(r1, r2) { return r1.top > r2.top; }
function getClientRect(r) {
    const rects = r.getClientRects();
    if (rects.length == 1)
        return rects[0];
    if (rects.length != 2)
        return emptyRect;
    let result = rects[0];
    let comp = chooseLower;
    let d = r.startContainer.data;
    if (d[r.startOffset] == '\n' && r.startOffset > 0 && d[r.startOffset] != '\n') {
        comp = chooseUpper;
    }
    for (const rect of rects) {
        if (comp(rect, result))
            result = rect;
    }
    return result;
}
DOMCursor.emptyDOMCursor = emptyDOMCursor;
DOMCursor.MutableDOMCursor = (MutableDOMCursor);
//# sourceMappingURL=domCursor.js.map