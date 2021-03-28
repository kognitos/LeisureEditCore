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

export type nodely = Node | JQuery | string

export type selectionSpec = {
    type?: 'None' | 'Range' | 'Caret',
    start: number,
    length: number,
    scrollTop?: number,
    scrollLeft?: number,
}

export declare function preserveSelection(func: (sel?: selectionSpec) => any): void

export declare interface Observable {
    on(event: string, func: (arg: any) => any)
    off(event: string, func: (arg: any) => any)
}

export declare class LeisureEditCore implements Observable {
    node: JQuery
    options: BasicEditingOptions

    on(event: string, func: (arg: any) => any)
    off(event: string, func: (arg: any) => any)
    domCursor(n: Node, p: number): DOMCursor
    replace(e: DragEvent, br: blockRange, text: string, select: boolean)
    blockRangeForOffsets(start: number, len: number): blockRange
    showCaret(pos: DOMCursor)
    setHtml(el: HTMLElement, html: string, outer?: boolean)
    blockOffset(node: HTMLElement | Range, offset?: number)
    domCursorForTextPosition(parent: nodely, pos: number, contain?: boolean)
    docOffsetForCaret(): number
    docOffset(node: HTMLElement | Range | DOMCursor, pos?: number): number
    blockForNode(node: HTMLElement): block
    static setReady: () => any
    selectDocRange(range: selectionSpec)
    getText(): string
}

declare class BasicEditingOptions implements Observable {
    editor: LeisureEditCore

    setEditor(editor: LeisureEditCore)
    on(event: string, func: (arg: any) => any)
    off(event: string, func: (arg: any) => any)
    getContainer(n: Node): Node
    idForNode(n: Node): string
    getBlock(id: string | number): block
    nodeForId(id: string): JQuery
    getPositionForBlock(bl: block): number
    replaceText(repl: replacement)
    rerenderAll()
    renderBlocks(): string
    getFirst(): string
    load(fileName: string, text: string)
    getText(): string
}

export declare class DataStore implements Observable {
    first: string
    blocks: object

    on(event: string, func: (arg: any) => any)
    off(event: string, func: (arg: any) => any)
    load(fileName: string, text: string)
    change(changes: any)
    replaceText(changes: { start: number, end: number, text: string })
    getBlock(thing: object | string, changes?: any)
    changesFor(first: string, oldBlocks: block[], newBlocks: block[])
    makeChanges(func: () => any)
    suppressTriggers(func: () => any)
    blockList(): block[]
    trigger(evt: string)
    load(name: string, text: string)
    on(evt: string, func: (...args: any[]) => any)
    makeChange(changes: any): any
    offsetForBlock(thing: string | block): number
    getLength(): number
    addMark(name: string, offset: number)
    getMarkLocation(name: string): number
    removeMark(name: string)
    getDocSubstring(start: number, end?: number)
}

export declare class FeatherJQ extends Array {
}

export declare class DataStoreEditingOptions<D extends DataStore> extends BasicEditingOptions {
    data: D
    constructor(data: D)
    dataChanged(changes: any)
}
