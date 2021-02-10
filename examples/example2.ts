import {
    _
} from 'types.js'

const {
    parseOrgMode,
    Source,
    Results,
    Headline,
    SimpleMarkup,
    Fragment,
} = (window as any).Org
const {
    orgDoc,
    getCodeItems,
    blockSource,
    blockOrg: docBlockOrg,
    ParsedCodeBlock,
    parseYaml,
} = (window as any).DocOrg
const {
    last,
    DataStore,
    DataStoreEditingOptions,
    blockText,
    posFor,
    escapeHtml,
    copyBlock,
    LeisureEditCore,
    set$,
} = (window as any).LeisureEditCore

var orgEditing = null
var plainEditing = null
var data = null

class OrgData extends DataStore {
    getBlock(thing, changes) {
        return typeof thing == 'object' ? thing
            : changes?.sets[thing] ?? super.getBlock(thing)
    }
    changesFor(first, oldBlocks, newBlocks) {
        const changes = super.changesFor(first, oldBlocks, newBlocks)
        this.linkAllSiblings(changes)
        return changes
    }
    load(name, text) {
        this.makeChanges(() => {
            this.suppressTriggers(() => super.load(name, text))
            this.linkAllSiblings({ first: this.first, sets: this.blocks, oldBlocks: [], newBlocks: this.blockList() })
            this.trigger('load')
        })
    }
    parseBlocks(text) { return parseOrgDoc(text) }
    nextSibling(thing, changes) {
        return this.getBlock(this.getBlock(thing, changes)?.nextSibling, changes)
    }
    previousSibling(thing, changes) {
        return this.getBlock(this.getBlock(thing, changes).previousSibling, changes)
    }
    reducePreviousSiblings(thing, changes, func, arg) {
        return greduce(this.getBlock(thing, changes), changes, func, arg, (b) => this.getBlock(b.previousSibling, changes))
    }
    reduceNextSiblings(thing, changes, func, arg) {
        return greduce(this.getBlock(thing, changes), changes, func, arg, (b) => this.getBlock(b.nextSibling, changes))
    }
    lastSibling(thing, changes) { return this.reduceNextSiblings(thing, changes, ((x, y) => y), null) }
    firstSibling(thing, changes) { return this.reducePreviousSiblings(thing, changes, ((x, y) => y), null) }
    parent(thing, changes?) { return this.getBlock(this.firstSibling(thing, changes)?.prev, changes) }
    properties(thing) {
        const props = {}
        var bl = this.getBlock(thing)
        if (bl.type != 'headline') {
            if (bl.type == 'code') {
                _.defaults(props, bl.codeAttributes)
                _.defaults(props, bl.properties)
            } else if (bl.type == 'chunk') _.defaults(props, bl.properties)
            bl = this.parent(bl)
        }
        while (bl) {
            this.scrapePropertiesInto(bl, props)
            bl = this.parent(bl)
        }
        return props
    }
    scrapePropertiesInto(block, props) {
        for (const child of this.children(block)) {
            if (child.type == 'chunk' && child.properties && !_.isEmpty(child.properties)) {
                _.defaults(props, child.properties)
            }
        }
    }
    firstChild(thing, changes) {
        const block = this.getBlock(thing, changes)
        const n = block && this.getBlock(block.next, changes)
        if (n && !n.previousSibling) return n
    }
    lastChild(thing, changes) { return this.lastSibling(this.firstChild(thing, changes), changes) }
    children(thing, changes) {
        const c = []
        this.reduceNextSiblings(this.firstChild(thing, changes), changes, ((x, y) => c.push(y)), null)
        return c
    }
    /** `nextRight` returns the next thing in the tree after this subtree, which is just the
     *  next sibling if there is one, otherwise it's the closest "right uncle" of this node
     */
    nextRight(thing, changes) {
        while (thing) {
            const sib = this.nextSibling(thing, changes)
            if (sib) return sib
            thing = this.parent(thing, changes)
        }
    }
}

function greduce(thing, changes, func, arg, next) {
    if (typeof changes == 'function') {
        next = arg
        arg = func
        func = changes
    }
    if (thing && typeof arg == 'undefined') {
        arg = thing
        thing = next(thing)
    }
    while (thing) {
        arg = func(arg, thing)
        thing = next(thing)
    }
    return arg
}
