import { inspect } from './Value';
import { Option } from "./Option";
import { HashMap } from "./HashMap";
import { HashSet } from "./HashSet";
import { Stream } from "./Stream";
import { Seq, IterableArray } from "./Seq";
import { WithEquality, Ordering, ToOrderable } from "./Comparison";
import * as L from "../list/index";
/**
 * A general-purpose list class with all-around good performance.
 * quasi-O(1) (actually O(log32(n))) access, append, replace.
 * It's backed by a bit-mapped vector trie.
 * @param T the item type
 */
export declare class Vector<T> implements Seq<T> {
    private _list;
    /**
     * @hidden
     */
    protected constructor(_list: L.List<T>);
    /**
     * The empty vector.
     * @param T the item type
     */
    static empty<T>(): Vector<T>;
    /**
     * Build a vector from a series of items (any number, as parameters)
     * @param T the item type
     */
    static of<T>(...data: T[]): Vector<T>;
    /**
     * Build a vector from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    static ofIterable<T>(elts: Iterable<T>): Vector<T>;
    /**
     * Curried predicate to find out whether the vector is empty.
     *
     *     LinkedList.of(Vector.of(1), Vector.empty<number>())
     *         .filter(Vector.isEmpty)
     *     => LinkedList.of(Vector.empty<number>())
     */
    static isEmpty<T>(v: Vector<T>): boolean;
    /**
     * Curried predicate to find out whether the vector is empty.
     *
     *     LinkedList.of(Vector.of(1), Vector.empty<number>())
     *         .filter(Vector.isNotEmpty)
     *     => LinkedList.of(Vector.of(1))
     */
    static isNotEmpty<T>(v: Vector<T>): boolean;
    /**
     * Get the length of the collection.
     */
    length(): number;
    /**
     * true if the collection is empty, false otherwise.
     */
    isEmpty(): boolean;
    /**
     * Dual to the foldRight function. Build a collection from a seed.
     * Takes a starting element and a function.
     * It applies the function on the starting element; if the
     * function returns None, it stops building the list, if it
     * returns Some of a pair, it adds the first element to the result
     * and takes the second element as a seed to keep going.
     *
     *     Vector.unfoldRight(
     *          10, x=>Option.of(x)
     *              .filter(x => x!==0)
     *              .map<[number,number]>(x => [x,x-1]))
     *     => Vector.of(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
     */
    static unfoldRight<T, U>(seed: T, fn: (x: T) => Option<[U, T]>): Vector<U>;
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     */
    get(index: number): Option<T>;
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    single(): Option<T>;
    /**
     * Replace the value of element at the index you give.
     * Will throw if the index is out of bounds!
     */
    replace(index: number, val: T): Vector<T>;
    /**
     * Replace the first occurence (if any) of the element you give by
     * the new value you give.
     *
     *     Vector.of(1, 2, 3, 4, 2).replaceFirst(2, 5)
     *     => Vector.of(1, 5, 3, 4, 2)
     *
     */
    replaceFirst(element: T & WithEquality, newVal: T & WithEquality): Vector<T>;
    /**
     * Replace all occurences of the element you give by
     * the new value you give.
     *
     *     Vector.of(1, 2, 3, 4, 2).replaceAll(2, 5)
     *     => Vector.of(1, 5, 3, 4, 5)
     *
     */
    replaceAll(element: T & WithEquality, newVal: T & WithEquality): Vector<T>;
    /**
     * Append an element at the end of the collection.
     */
    append(val: T): Vector<T>;
    /**
     * Append multiple elements at the end of the collection.
     * Note that arrays are also iterables.
     */
    appendAll(elts: Iterable<T>): Vector<T>;
    /**
     * Remove multiple elements from a vector
     *
     *     Vector.of(1,2,3,4,3,2,1).removeAll([2,4])
     *     => Vector.of(1,3,3,1)
     */
    removeAll(elts: Iterable<T & WithEquality>): Vector<T>;
    /**
     * Get the first value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    head(): Option<T>;
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    last(): Option<T>;
    /**
     * Return a new vector containing all the elements in this
     * vector except the last one, or the empty vector if this
     * is the empty vector.
     *
     *     Vector.of(1,2,3).init()
     *     => Vector.of(1,2)
     */
    init(): Vector<T>;
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    dropWhile(predicate: (x: T) => boolean): Vector<T>;
    /**
     * Search for the first item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    find(predicate: (v: T) => boolean): Option<T>;
    /**
     * Search for the last item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    findLast(predicate: (v: T) => boolean): Option<T>;
    /**
     * Search for the first item matching the predicate you pass,
     * returning its index in the form of Option.Some if found,
     * Option.None otherwise.
     */
    findIndex(predicate: (v: T) => boolean): Option<number>;
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    allMatch<U extends T>(predicate: (v: T) => v is U): this is Vector<U>;
    allMatch(predicate: (v: T) => boolean): boolean;
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    anyMatch(predicate: (v: T) => boolean): boolean;
    /**
     * Returns a pair of two collections; the first one
     * will only contain the items from this collection for
     * which the predicate you give returns true, the second
     * will only contain the items from this collection where
     * the predicate returns false.
     *
     *     Vector.of(1,2,3,4).partition(x => x%2===0)
     *     => [Vector.of(2,4),Vector.of(1,3)]
     */
    partition<U extends T>(predicate: (v: T) => v is U): [Vector<U>, Vector<Exclude<T, U>>];
    partition(predicate: (x: T) => boolean): [Vector<T>, Vector<T>];
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    contains(v: T & WithEquality): boolean;
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[Vector.arrangeBy]]
     */
    groupBy<C>(classifier: (v: T) => C & WithEquality): HashMap<C, Vector<T>>;
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[Vector.groupBy]]
     */
    arrangeBy<K>(getKey: (v: T) => K & WithEquality): Option<HashMap<K, T>>;
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     Vector.of(1,1,2,3,2,3,1).distinctBy(x => x);
     *     => Vector.of(1,2,3)
     */
    distinctBy<U>(keyExtractor: (x: T) => U & WithEquality): Vector<T>;
    [Symbol.iterator](): Iterator<T>;
    /**
     * Call a function for element in the collection.
     */
    forEach(fun: (x: T) => void): Vector<T>;
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    map<U>(fun: (x: T) => U): Vector<U>;
    /**
     * Call a predicate for each element in the collection,
     * build a new collection holding only the elements
     * for which the predicate returned true.
     */
    filter<U extends T>(fun: (v: T) => v is U): Vector<U>;
    filter(fun: (v: T) => boolean): Vector<T>;
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     *
     *     Vector.of(1,2,6).mapOption(x => x%2===0 ?
     *         Option.of(x+1) : Option.none<number>())
     *     => Vector.of(3, 7)
     */
    mapOption<U>(mapper: (v: T) => Option<U>): Vector<U>;
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    flatMap<U>(mapper: (v: T) => Vector<U>): Vector<U>;
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     Vector.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    fold(zero: T, fn: (v1: T, v2: T) => T): T;
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldLeft("!", (xs,x) => x+xs);
     *     => "cba!"
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    foldLeft<U>(zero: U, fn: (soFar: U, cur: T) => U): U;
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldRight("!", (x,xs) => xs+x);
     *     => "!cba"
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    foldRight<U>(zero: U, fn: (cur: T, soFar: U) => U): U;
    /**
     * Returns the index of the first occurence of the value you give, if present
     *
     *     Vector.of(1, 2, 3, 4, 3).indexOf(3)
     *     => Option.of(2)
     */
    indexOf(element: T & WithEquality): Option<number>;
    /**
     * Randomly reorder the elements of the collection.
     */
    shuffle(): Vector<T>;
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    transform<U>(converter: (x: Vector<T>) => U): U;
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    equals(other: Vector<T & WithEquality>): boolean;
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    hashCode(): number;
    /**
     * Get a human-friendly string representation of that value.
     *
     * Also see [[Vector.mkString]]
     */
    toString(): string;
    /**
     * Used by the node REPL to display values.
     * Most of the time should be the same as toString()
     */
    [inspect](): string;
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     Vector.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    mkString(separator: string): string;
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     * also see [[Vector.sortOn]]
     */
    sortBy(compare: (v1: T, v2: T) => Ordering): Vector<T>;
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     *     Vector.of({a:3,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a)
     *     => Vector.of({a:1,b:"test"},{a:2,b:"a"},{a:3,b:"b"})
     *
     * You can also sort by multiple criteria, and request 'descending'
     * sorting:
     *
     *     Vector.of({a:1,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a,{desc:elt=>elt.b})
     *     => Vector.of({a:1,b:"test"},{a:1,b:"b"},{a:2,b:"a"})
     *
     * also see [[Vector.sortBy]]
     */
    sortOn(...getKeys: Array<ToOrderable<T> | {
        desc: ToOrderable<T>;
    }>): Vector<T>;
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     *
     *     Vector.of(1,2,3).toMap(x=>[x.toString(), x])
     *     => HashMap.of(["1",1], ["2",2], ["3",3])
     */
    toMap<K, V>(converter: (x: T) => [K & WithEquality, V]): HashMap<K, V>;
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     Vector.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    toSet<K>(converter: (x: T) => K & WithEquality): HashSet<K>;
    /**
     * Convert to array.
     */
    toArray(): T[];
    /**
     * @hidden
     */
    hasTrueEquality(): boolean;
    /**
     * Combine any number of iterables you give in as
     * parameters to produce a new collection which combines all,
     * in tuples. For instance:
     *
     *     Vector.zip(Vector.of(1,2,3), ["a","b","c"], LinkedList.of(8,9,10))
     *     => Vector.of([1,"a",8], [2,"b",9], [3,"c",10])
     *
     * The result collection will have the length of the shorter
     * of the input iterables. Extra elements will be discarded.
     *
     * Also see [the non-static version](#zip), which only combines two
     * collections.
     * @param A A is the type of the tuple that'll be generated
     *          (`[number,string,number]` for the code sample)
     */
    static zip<A extends any[]>(...iterables: IterableArray<A>): Vector<A>;
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Vector.of(1,2,3).zip(["a","b","c"])
     *     => Vector.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     *
     * Also see [[Vector.zip]] (static version which can more than two
     * iterables)
     */
    zip<U>(other: Iterable<U>): Vector<[T, U]>;
    /**
     * Reverse the collection. For instance:
     *
     *     Vector.of(1,2,3).reverse();
     *     => Vector.of(3,2,1)
     */
    reverse(): Vector<T>;
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     Vector.of("a","b").zipWithIndex().map(([v,idx]) => v+idx)
     *     => Vector.of("a0", "b1")
     */
    zipWithIndex(): Vector<[T, number]>;
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    takeWhile(predicate: (x: T) => boolean): Vector<T>;
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate,
     * but starting from the end of the collection.
     *
     *     Vector.of(1,2,3,4).takeRightWhile(x => x > 2)
     *     => Vector.of(3,4)
     */
    takeRightWhile(predicate: (x: T) => boolean): Vector<T>;
    /**
     * Split the collection at a specific index.
     *
     *     Vector.of(1,2,3,4,5).splitAt(3)
     *     => [Vector.of(1,2,3), Vector.of(4,5)]
     */
    splitAt(index: number): [Vector<T>, Vector<T>];
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    Vector.of(1,2,3,4,5,6).span(x => x <3)
     *    => [Vector.of(1,2), Vector.of(3,4,5,6)]
     */
    span(predicate: (x: T) => boolean): [Vector<T>, Vector<T>];
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    drop(n: number): Vector<T>;
    /**
     * Return a new collection containing the first n
     * elements from this collection
     *
     *     Vector.of(1,2,3,4).take(2)
     *     => Vector.of(1,2)
     */
    take(n: number): Vector<T>;
    /**
     * Prepend an element at the beginning of the collection.
     */
    prepend(elt: T): Vector<T>;
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    prependAll(elts: Iterable<T>): Vector<T>;
    /**
     * Removes the first element matching the predicate
     * (use [[Seq.filter]] to remove all elements matching a predicate)
     */
    removeFirst(predicate: (v: T) => boolean): Vector<T>;
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    dropRight(n: number): Vector<T>;
    /**
     * Returns a new collection, discarding the last elements
     * until one element fails the predicate. All elements
     * before that point are retained.
     */
    dropRightWhile(predicate: (x: T) => boolean): Vector<T>;
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    tail(): Option<Vector<T>>;
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    reduce(combine: (v1: T, v2: T) => T): Option<T>;
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.minOn]]
     */
    minBy(compare: (v1: T, v2: T) => Ordering): Option<T>;
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     *     Vector.of({name:"Joe", age:12}, {name:"Paula", age:6}).minOn(x=>x.age)
     *     => Option.of({name:"Paula", age:6})
     *
     * also see [[Vector.minBy]]
     */
    minOn(getOrderable: ToOrderable<T>): Option<T>;
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.maxOn]]
     */
    maxBy(compare: (v1: T, v2: T) => Ordering): Option<T>;
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     *     Vector.of({name:"Joe", age:12}, {name:"Paula", age:6}).maxOn(x=>x.age)
     *     => Option.of({name:"Joe", age:12})
     *
     * also see [[Vector.maxBy]]
     */
    maxOn(getOrderable: ToOrderable<T>): Option<T>;
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     *
     *     Vector.of(1,2,3).sumOn(x=>x)
     *     => 6
     */
    sumOn(getNumber: (v: T) => number): number;
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     Vector.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(Vector.of(1,2,3), Vector.of(4,5,6), Vector.of(7,8))
     */
    sliding(count: number): Stream<Vector<T>>;
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The last element of the result is the final cumulative result.
     *
     *     Vector.of(1,2,3).scanLeft(0, (soFar,cur)=>soFar+cur)
     *     => Vector.of(0,1,3,6)
     */
    scanLeft<U>(init: U, fn: (soFar: U, cur: T) => U): Vector<U>;
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The first element of the result is the final cumulative result.
     *
     *     Vector.of(1,2,3).scanRight(0, (cur,soFar)=>soFar+cur)
     *     => Vector.of(6,5,3,0)
     */
    scanRight<U>(init: U, fn: (cur: T, soFar: U) => U): Vector<U>;
}
