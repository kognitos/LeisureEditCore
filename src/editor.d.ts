import * as JQuery from 'jquery'
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

export declare interface Observable {
    on(event: string, func: (arg: any) => any)
    off(event: string, func: (arg: any) => any)
}

type bindings = {[key: string]: (editor: BasicEditingOptions, e: Event)=> any}

export declare function preserveSelection(func: (sel?: selectionSpec) => any): void
export declare function escapeHtml(html: string): string
export declare function blockText(blocks: block[]): string
export declare function posFor(pos: CaretPosition | DOMCursor): DOMRect
export declare function copyBlock(bl: block): block
export declare function set$(f: (...args)=> any, is: (arg: any)=> boolean): block
export declare function last(array: any[]): any
export declare const defaultBindings: bindings

export declare class LeisureEditCore implements Observable {
    node: JQuery
    options: BasicEditingOptions

    constructor(node: JQuery, options: BasicEditingOptions)
    loadURL(url: string): void
    on(event: string, func: (arg: any) => any)
    off(event: string, func: (arg: any) => any)
    domCursor(n: Node, p: number): DOMCursor
    replace(e: DragEvent, br: blockRange, text: string, select: boolean)
    blockRangeForOffsets(start: number, len: number): blockRange
    showCaret(pos: DOMCursor)
    setHtml(el: HTMLElement, html: string, outer?: boolean): HTMLElement
    blockOffset(node: HTMLElement | Range, offset?: number)
    domCursorForTextPosition(parent: nodely, pos: number, contain?: boolean)
    domCursorForCaret(): DOMCursor
    domCursorForDocOffset(pos: number | DOMCursor): DOMCursor
    docOffsetForCaret(): number
    docOffset(node: HTMLElement | Range | DOMCursor, pos?: number): number
    blockForNode(node: HTMLElement): block
    static setReady: (...args) => any
    selectDocRange(range: selectionSpec)
    getText(): string
    moveCaretForVisibleNewlines(pos?: number | DOMCursor)
    getSelectedDocRange(): selectionSpec
    handleCut(e: JQuery.KeyPressEvent)
    handleCopy(e: JQuery.KeyPressEvent)
    handlePaste(e: JQuery.KeyPressEvent)
    keyPress(e: JQuery.KeyPressEvent)
    handleDelete(e: JQuery.KeyPressEvent, sel: any, forward: boolean)
    backspace(e: JQuery.KeyPressEvent, sel: any, forward: boolean)
    del(e: JQuery.KeyPressEvent, sel: any, forward: boolean)
    mouseUp(e: JQuery.MouseUpEvent): void
    initBindings(name: string, b: (bindings)=> unknown)
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
    getLength(): number
    runControllers(HTMLElement): void
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
    preserveSelectionWithMark(func: ()=> any)
}

export declare class FeatherJQ extends Array {
}

export declare class DataStoreEditingOptions<D extends DataStore> extends BasicEditingOptions {
    data: D
    constructor(data: D)
    dataChanged(changes: any)
}
