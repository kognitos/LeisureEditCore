export * from "./index";
declare module "./index" {
    interface List<A> {
        empty(): List<any>;
        of<B>(b: B): List<B>;
        append(value: A): List<A>;
        nth(index: number): A | undefined;
        prepend(value: A): List<A>;
        append(value: A): List<A>;
        intersperse(separator: A): List<A>;
        first(): A | undefined;
        head(): A | undefined;
        last(): A | undefined;
        map<B>(f: (a: A) => B): List<B>;
        pluck<K extends keyof A>(key: K): List<A[K]>;
        foldl<B>(f: (acc: B, value: A) => B, initial: B): B;
        reduce<B>(f: (acc: B, value: A) => B, initial: B): B;
        scan<B>(f: (acc: B, value: A) => B, initial: B): List<B>;
        foldr<B>(f: (value: A, acc: B) => B, initial: B): B;
        reduceRight<B>(f: (value: A, acc: B) => B, initial: B): B;
        foldlWhile<B>(predicate: (acc: B, value: A) => boolean, f: (value: A, acc: B) => B, initial: B): B;
        reduceWhile<B>(predicate: (acc: B, value: A) => boolean, f: (value: A, acc: B) => B, initial: B): B;
        traverse<A, B>(of: Of, f: (a: A) => Applicative<B>): any;
        sequence<A, B>(this: List<Applicative<A>>, of: Of): any;
        forEach(callback: (a: A) => void): void;
        filter(predicate: (a: A) => boolean): List<A>;
        filter<B extends A>(predicate: (a: A) => a is B): List<B>;
        reject(predicate: (a: A) => boolean): List<A>;
        partition(predicate: (a: A) => boolean): [List<A>, List<A>];
        join(separator: string): string;
        ap<B>(listF: List<(a: A) => B>): List<B>;
        flatten(this: List<List<A>>): List<A>;
        flatMap<B>(f: (a: A) => List<B>): List<B>;
        chain<B>(f: (a: A) => List<B>): List<B>;
        every(predicate: (a: A) => boolean): boolean;
        some(predicate: (a: A) => boolean): boolean;
        none(predicate: (a: A) => boolean): boolean;
        indexOf(element: A): number;
        lastIndexOf(element: A): number;
        find(predicate: (a: A) => boolean): A | undefined;
        findLast(predicate: (a: A) => boolean): A | undefined;
        findIndex(predicate: (a: A) => boolean): number;
        includes(element: A): boolean;
        equals(secondList: List<any>): boolean;
        equalsWith(f: (a: A, b: A) => boolean, secondList: List<any>): boolean;
        concat(right: List<A>): List<A>;
        update(index: number, a: A): List<A>;
        adjust(index: number, f: (a: A) => A): List<A>;
        slice(from: number, to: number): List<A>;
        take(n: number): List<A>;
        takeWhile(predicate: (a: A) => boolean): List<A>;
        takeLastWhile(predicate: (a: A) => boolean): List<A>;
        takeLast(n: number): List<A>;
        splitAt(index: number): [List<A>, List<A>];
        splitWhen(predicate: (a: A) => boolean): [List<A>, List<A>];
        splitEvery(size: number): List<List<A>>;
        remove(from: number, amount: number): List<A>;
        drop(n: number): List<A>;
        dropWhile(predicate: (a: A) => boolean): List<A>;
        dropRepeats(): List<A>;
        dropRepeatsWith(predicate: (a: A, b: A) => boolean): List<A>;
        dropLast(n: number): List<A>;
        pop(): List<A>;
        tail(): List<A>;
        toArray(): A[];
        insert(index: number, element: A): List<A>;
        insertAll(index: number, elements: List<A>): List<A>;
        reverse(): List<A>;
        backwards(): Iterable<A>;
        zipWith<B, C>(f: (a: A, b: B) => C, bs: List<B>): List<C>;
        zip<B>(bs: List<B>): List<[A, B]>;
        sort<A extends Comparable>(this: List<A>, l: List<A>): List<A>;
        sortBy<B extends Comparable>(f: (a: A) => B): List<A>;
        sortWith(comparator: (a: A, b: A) => Ordering): List<A>;
        group(): List<List<A>>;
        groupWith<A>(f: (a: A, b: A) => boolean): List<List<A>>;
        isEmpty(): boolean;
    }
}