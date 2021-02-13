import { DOMCursor } from './domCursor.js'

type replacement = {
    start: number,
    end: number,
    text: string,
}

export type blockRange = {
    type: 'None' | 'Caret',
    offset?: number,
    block?: block,
    length?: number,
}
export type block = {
    _id: string
}

export type selectionSpec = {
    type: 'None' | 'Range' | 'Caret',
    scrollTop: number,
    scrollLeft: number,
}

export declare function preserveSelection(func: (sel?: selectionSpec) => any): void

export declare class LeisureEditCore<D extends DataStore> {
    node: HTMLElement
    options: BasicEditingOptions<D>

    domCursor(n: Node, p: number): DOMCursor
    replace(e: DragEvent, br: blockRange, text: string, select: boolean)
    blockRangeForOffsets(start: number, len: number): blockRange
    showCaret(pos: DOMCursor)
    setHtml(el: HTMLElement, html: string, outer?: boolean)
    blockOffset(node: HTMLElement | Range, offset?: number)
    domCursorForTextPosition(parent: Node, pos: number, contain?: boolean)
    static setReady: () => any
}

declare class BasicEditingOptions<D extends DataStore> {
    data: D
    editor: LeisureEditCore<D>

    getContainer(n: Node): Node
    idForNode(n: Node): string
    getBlock(id: string | number): block
    nodeForId(id: string): Node
    getPositionForBlock(bl: block): number
    replaceText(repl: replacement)
    rerenderAll()
    renderBlocks(): string
    getFirst(): string
}

export declare class DataStore {
    first: string
    blocks: object

    change(changes: any)
    replaceText(start: number, end: number, text: string)
    getBlock(thing: object | string, changes?: any)
    changesFor(first: string, oldBlocks: block[], newBlocks: block[])
    makeChanges(func: () => any)
    suppressTriggers(func: () => any)
    blockList(): block[]
    trigger(evt: string)
    load(name: string, text: string)
    on(evt: string, func: (...args: any[]) => any)
}

export declare class FeatherJQ extends Array {
}

export declare class DataStoreEditingOptions<D extends DataStore> extends BasicEditingOptions<D> {
    constructor(data: D)
}
