/**
 * prelude-ts v1.0.2
 * https://github.com/emmanueltouzery/prelude-ts
 * (c) 2017-2020 Emmanuel Touzery
 * prelude-ts may be freely distributed under the ISC license.
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.prelude_ts = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Option_1 = require("./Option");
/**
 * Type guard for HasEquals: find out for a type with
 * semantic equality, whether you should call .equals
 * or ===
 */
function hasEquals(v) {
    // there is a reason why we check only for equals, not for hashCode.
    // we want to decide which codepath to take: === or equals/hashcode.
    // if there is a equals function then we don't want ===, regardless of
    // whether there is a hashCode method or not. If there is a equals
    // and not hashCode, we want to go on the equals/hashCode codepath,
    // which will blow a little later at runtime if the hashCode is missing.
    return (v.equals !== undefined);
}
exports.hasEquals = hasEquals;
/**
 * Helper function for your objects so you can compute
 * a hashcode. You can pass to this function all the fields
 * of your object that should be taken into account for the
 * hash, and the function will return a reasonable hash code.
 *
 * @param fields the fields of your object to take
 *        into account for the hashcode
 */
function fieldsHashCode() {
    var fields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fields[_i] = arguments[_i];
    }
    // https://stackoverflow.com/a/113600/516188
    // https://stackoverflow.com/a/18066516/516188
    var result = 1;
    for (var _a = 0, fields_1 = fields; _a < fields_1.length; _a++) {
        var value = fields_1[_a];
        result = 37 * result + getHashCode(value);
    }
    return result;
}
exports.fieldsHashCode = fieldsHashCode;
/**
 * Helper function to compute a reasonable hashcode for strings.
 */
function stringHashCode(str) {
    // https://stackoverflow.com/a/7616484/516188
    var hash = 0, i, chr;
    if (str.length === 0)
        return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
exports.stringHashCode = stringHashCode;
/**
 * Equality function which tries semantic equality (using .equals())
 * if possible, degrades to === if not available, and is also null-safe.
 */
function areEqual(obj, obj2) {
    if (obj === null != obj2 === null) {
        return false;
    }
    if (obj === null || obj2 === null) {
        return true;
    }
    if (hasEquals(obj)) {
        return obj.equals(obj2);
    }
    return obj === obj2;
}
exports.areEqual = areEqual;
/**
 * Hashing function which tries to call hashCode()
 * and uses the object itself for numbers, then degrades
 * for stringHashCode of the string representation if
 * not available.
 */
function getHashCode(obj) {
    if (!obj) {
        return 0;
    }
    if (hasEquals(obj)) {
        return obj.hashCode();
    }
    if (typeof obj === 'number') {
        // this is the hashcode implementation for numbers from immutablejs
        if (obj !== obj || obj === Infinity) {
            return 0;
        }
        var h = obj | 0;
        if (h !== obj) {
            h ^= obj * 0xffffffff;
        }
        while (obj > 0xffffffff) {
            obj /= 0xffffffff;
            h ^= obj;
        }
        return smi(h);
    }
    var val = obj + "";
    return val.length > STRING_HASH_CACHE_MIN_STRLEN ?
        cachedHashString(val) :
        stringHashCode(val);
}
exports.getHashCode = getHashCode;
function cachedHashString(string) {
    var hashed = stringHashCache[string];
    if (hashed === undefined) {
        hashed = stringHashCode(string);
        if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
            STRING_HASH_CACHE_SIZE = 0;
            stringHashCache = {};
        }
        STRING_HASH_CACHE_SIZE++;
        stringHashCache[string] = hashed;
    }
    return hashed;
}
// v8 has an optimization for storing 31-bit signed numbers.
// Values which have either 00 or 11 as the high order bits qualify.
// This function drops the highest order bit in a signed number, maintaining
// the sign bit. (taken from immutablejs)
function smi(i32) {
    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xbfffffff);
}
var STRING_HASH_CACHE_MIN_STRLEN = 16;
var STRING_HASH_CACHE_MAX_SIZE = 255;
var STRING_HASH_CACHE_SIZE = 0;
var stringHashCache = {};
/**
 * @hidden
 */
function hasTrueEquality(val) {
    if (!val) {
        return Option_1.Option.none();
    }
    if (val.equals) {
        return Option_1.Option.of(true);
    }
    switch (val.constructor) {
        case String:
        case Number:
        case Boolean:
            return Option_1.Option.of(true);
    }
    return Option_1.Option.of(false);
}
exports.hasTrueEquality = hasTrueEquality;
;
/**
 * Typescript doesn't infer typeguards for lambdas; it only sees
 * predicates. This type allows you to cast a predicate to a type
 * guard in a handy manner.
 *
 * It comes in handy for discriminated unions with a 'kind' discriminator,
 * for instance:
 *
 * `.filter(typeGuard(p => p.kind === "in_board", {} as InBoard))`
 *
 * Normally you'd have to give both type parameters, but you can use
 * the type witness parameter as shown in that example to skip
 * the first type parameter.
 *
 * Also see [[typeGuard]], [[instanceOf]] and [[typeOf]].
 */
function typeGuard(predicate, typeWitness) {
    return predicate;
}
exports.typeGuard = typeGuard;
/**
 * Curried function returning a type guard telling us if a value
 * is of a specific instance.
 * Can be used when filtering to filter for the type and at the
 * same time change the type of the generics on the container.
 *
 *     Vector.of<any>("bad", new Date('04 Dec 1995 00:12:00 GMT')).filter(instanceOf(Date))
 *     => Vector.of<Date>(new Date('04 Dec 1995 00:12:00 GMT'))
 *
 *     Option.of<any>("test").filter(instanceOf(Date))
 *     => Option.none<Date>()
 *
 *     Option.of<any>(new Date('04 Dec 1995 00:12:00 GMT')).filter(instanceOf(Date))
 *     => Option.of<Date>(new Date('04 Dec 1995 00:12:00 GMT'))
 *
 * Also see [[typeGuard]] and [[typeOf]].
 */
function instanceOf(ctor) {
    // https://github.com/Microsoft/TypeScript/issues/5101#issuecomment-145693151
    return (function (x) { return x instanceof ctor; });
}
exports.instanceOf = instanceOf;
function typeOf(typ) {
    return (function (x) { return typeof x === typ; });
}
exports.typeOf = typeOf;

},{"./Option":11}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var preludeTsContractViolationCb = function (msg) { throw msg; };
/**
 * Some programmatic errors are only detectable at runtime
 * (for instance trying to setup a <code>HashSet</code> of <code>Option&lt;number[]&gt;</code>: you
 * can't reliably compare a <code>number[]</code> therefore you can't compare
 * an <code>Option&lt;number[]&gt;</code>.. but we can't detect this error at compile-time
 * in typescript). So when we detect them at runtime, prelude-ts throws
 * an exception by default.
 * This function allows you to change that default action
 * (for instance, you could display an error message in the console,
 * or log the error)
 *
 * You can reproduce the issue easily by running for instance:
 *
 *  HashSet.of(Option.of([1]))
 *  => throws
 */
function setContractViolationAction(action) {
    preludeTsContractViolationCb = action;
}
exports.setContractViolationAction = setContractViolationAction;
/**
 * @hidden
 */
function reportContractViolation(msg) {
    preludeTsContractViolationCb(msg);
}
exports.reportContractViolation = reportContractViolation;
/**
 * @hidden
 */
function contractTrueEquality(context) {
    var vals = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        vals[_i - 1] = arguments[_i];
    }
    for (var _a = 0, vals_1 = vals; _a < vals_1.length; _a++) {
        var val = vals_1[_a];
        if (val) {
            if (val.hasTrueEquality && (!val.hasTrueEquality())) {
                reportContractViolation(context + ": element doesn't support true equality: " + SeqHelpers_1.toStringHelper(val));
            }
            if (!Comparison_1.hasTrueEquality(val).getOrThrow()) {
                reportContractViolation(context + ": element doesn't support equality: " + SeqHelpers_1.toStringHelper(val));
            }
            // the first element i find is looking good, aborting
            return;
        }
    }
}
exports.contractTrueEquality = contractTrueEquality;

},{"./Comparison":1,"./SeqHelpers":13}],3:[function(require,module,exports){
"use strict";
/**
 * The [[Either]] type represents an alternative between two value types.
 * A "left" value which is also conceptually tied to a failure,
 * or a "right" value which is conceptually tied to success.
 *
 * The code is organized through the class [[Left]], the class [[Right]],
 * and the type alias [[Either]] (Left or Right).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[EitherStatic]] and are accessed through the global constant Either.
 *
 * Examples:
 *
 *     Either.right<number,number>(5);
 *     Either.left<number,number>(2);
 *     Either.right<number,number>(5).map(x => x*2);
 *
 * Left has the extra [[Left.getLeft]] method that [[Right]] doesn't have.
 * Right has the extra [[Right.get]] method that [[Left]] doesn't have.
 */
exports.__esModule = true;
var Value_1 = require("./Value");
var Option_1 = require("./Option");
var LinkedList_1 = require("./LinkedList");
var Vector_1 = require("./Vector");
var Comparison_1 = require("./Comparison");
var Contract_1 = require("./Contract");
/**
 * Holds the "static methods" for [[Either]]
 */
var EitherStatic = /** @class */ (function () {
    function EitherStatic() {
    }
    /**
     * Constructs an Either containing a left value which you give.
     */
    EitherStatic.prototype.left = function (val) {
        return new Left(val);
    };
    /**
     * Constructs an Either containing a right value which you give.
     */
    EitherStatic.prototype.right = function (val) {
        return new Right(val);
    };
    /**
     * Curried type guard for Either
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(Either.right<number,number>(2), Either.left<number,number>(1))
     *         .filter(Either.isLeft)
     *         .map(o => o.getLeft())
     *     => Vector.of(1)
     */
    EitherStatic.prototype.isLeft = function (e) {
        return e.isLeft();
    };
    /**
     * Curried type guard for Either
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(Either.right<number,number>(2), Either.left<number,number>(1))
     *         .filter(Either.isRight)
     *         .map(o => o.get())
     *     => Vector.of(2)
     */
    EitherStatic.prototype.isRight = function (e) {
        return e.isRight();
    };
    /**
     * Turns a list of eithers in an either containing a list of items.
     * Useful in many contexts.
     *
     *     Either.sequence(Vector.of(
     *         Either.right<number,number>(1),
     *         Either.right<number,number>(2)));
     *     => Either.right(Vector.of(1,2))
     *
     * But if a single element is Left, everything is discarded:
     *
     *     Either.sequence(Vector.of(
     *           Either.right<number,number>(1),
     *           Either.left<number,number>(2),
     *           Either.left<number,number>(3)));
     *     => Either.left(2)
     *
     * Also see [[EitherStatic.traverse]]
     */
    EitherStatic.prototype.sequence = function (elts) {
        return exports.Either.traverse(elts, function (x) { return x; });
    };
    /**
     * Takes a list, a function that can transform list elements
     * to eithers, then return an either containing a list of
     * the transformed elements.
     *
     *     const getUserById: (x:number)=>Either<string,string> = x => x > 0 ?
     *         Either.right("user" + x.toString()) : Either.left("invalid id!");
     *     Either.traverse([4, 3, 2], getUserById);
     *     => Either.right(Vector.of("user4", "user3", "user2"))
     *
     * But if a single element results in Left, everything is discarded:
     *
     *     const getUserById: (x:number)=>Either<string,string> = x => x > 0 ?
     *         Either.right("user" + x.toString()) : Either.left("invalid id!");
     *     Either.traverse([4, -3, 2], getUserById);
     *     => Either.left("invalid id!")
     *
     * Also see [[EitherStatic.sequence]]
     */
    EitherStatic.prototype.traverse = function (elts, fn) {
        var r = Vector_1.Vector.empty();
        var iterator = elts[Symbol.iterator]();
        var curItem = iterator.next();
        while (!curItem.done) {
            var v = fn(curItem.value);
            if (v.isLeft()) {
                return v;
            }
            r = r.append(v.get());
            curItem = iterator.next();
        }
        return exports.Either.right(r);
    };
    /**
     * Turns a list of eithers in an either containing a list of items.
     * Compared to [[EitherStatic.sequence]], sequenceAcc 'accumulates'
     * the errors, instead of short-circuiting on the first error.
     *
     *     Either.sequenceAcc(Vector.of(
     *         Either.right<number,number>(1),
     *         Either.right<number,number>(2)));
     *     => Either.right(Vector.of(1,2))
     *
     * But if a single element is Left, you get all the lefts:
     *
     *     Either.sequenceAcc(Vector.of(
     *           Either.right<number,number>(1),
     *           Either.left<number,number>(2),
     *           Either.left<number,number>(3)));
     *     => Either.left(Vector.of(2,3))
     */
    EitherStatic.prototype.sequenceAcc = function (elts) {
        var _a = Vector_1.Vector.ofIterable(elts).partition(exports.Either.isLeft), lefts = _a[0], rights = _a[1];
        if (lefts.isEmpty()) {
            return exports.Either.right(rights.map(function (r) { return r.getOrThrow(); }));
        }
        return exports.Either.left(lefts.map(function (l) { return l.getLeft(); }));
    };
    /**
     * Applicative lifting for Either.
     * Takes a function which operates on basic values, and turns it
     * in a function that operates on eithers of these values ('lifts'
     * the function). The 2 is because it works on functions taking two
     * parameters.
     *
     *     const lifted = Either.liftA2(
     *         (x:number,y:number) => x+y, {} as string);
     *     lifted(
     *         Either.right<string,number>(5),
     *         Either.right<string,number>(6));
     *     => Either.right(11)
     *
     *     const lifted = Either.liftA2(
     *         (x:number,y:number) => x+y, {} as string);
     *     lifted(
     *         Either.right<string,number>(5),
     *         Either.left<string,number>("bad"));
     *     => Either.left("bad")
     *
     * @param R1 the first right type
     * @param R2 the second right type
     * @param L the left type
     * @param V the new right type as returned by the combining function.
     */
    EitherStatic.prototype.liftA2 = function (fn, leftWitness) {
        return function (p1, p2) { return p1.flatMap(function (a1) { return p2.map(function (a2) { return fn(a1, a2); }); }); };
    };
    /**
     * Applicative lifting for Either. 'p' stands for 'properties'.
     *
     * Takes a function which operates on a simple JS object, and turns it
     * in a function that operates on the same JS object type except which each field
     * wrapped in an Either ('lifts' the function).
     * It's an alternative to [[EitherStatic.liftA2]] when the number of parameters
     * is not two.
     *
     *     const fn = (x:{a:number,b:number,c:number}) => x.a+x.b+x.c;
     *     const lifted = Either.liftAp(fn, {} as number);
     *     lifted({
     *         a: Either.right<number,number>(5),
     *         b: Either.right<number,number>(6),
     *         c: Either.right<number,number>(3)});
     *     => Either.right(14)
     *
     *     const lifted = Either.liftAp<number,{a:number,b:number},number>(
     *         x => x.a+x.b);
     *     lifted({
     *         a: Either.right<number,number>(5),
     *         b: Either.left<number,number>(2)});
     *     => Either.left(2)
     *
     * @param L the left type
     * @param A the object property type specifying the parameters for your function
     * @param B the type returned by your function, returned wrapped in an either by liftAp.
     */
    EitherStatic.prototype.liftAp = function (fn, leftWitness) {
        return function (x) {
            var copy = {};
            for (var p in x) {
                if (x[p].isLeft()) {
                    return x[p];
                }
                copy[p] = x[p].getOrThrow();
            }
            return exports.Either.right(fn(copy));
        };
    };
    /**
     * Applicative lifting for Either. 'p' stands for 'properties'.
     * Compared to [[EitherStatic.liftAp]], liftApAcc 'accumulates'
     * the errors, instead of short-circuiting on the first error.
     *
     * Takes a function which operates on a simple JS object, and turns it
     * in a function that operates on the same JS object type except which each field
     * wrapped in an Either ('lifts' the function).
     * It's an alternative to [[EitherStatic.liftA2]] when the number of parameters
     * is not two.
     *
     *     const fn = (x:{a:number,b:number,c:number}) => x.a+x.b+x.c;
     *     const lifted = Either.liftApAcc(fn, {} as number);
     *     lifted({
     *         a: Either.right<number,number>(5),
     *         b: Either.right<number,number>(6),
     *         c:Either.right<number,number>(3)});
     *     => Either.right(14)
     *
     *     const fn = (x:{a:number,b:number,c:number}) => x.a+x.b+x.c;
     *     const lifted = Either.liftApAcc(fn, {} as number);
     *     lifted({
     *         a: Either.right<number,number>(5),
     *         b: Either.left<number,number>(2),
     *         c: Either.left<number,number>(6)});
     *     => Either.left(Vector.of(2, 6))
     *
     * @param L the left type
     * @param A the object property type specifying the parameters for your function
     * @param B the type returned by your function, returned wrapped in an either by liftAp.
     */
    EitherStatic.prototype.liftApAcc = function (fn, leftWitness) {
        var leftErrs = [];
        return function (x) {
            var copy = {};
            for (var p in x) {
                var field = x[p];
                if (field.isLeft()) {
                    leftErrs.push(field.getLeft());
                }
                else {
                    copy[p] = x[p].getOrThrow();
                }
            }
            if (leftErrs.length === 0) {
                return exports.Either.right(fn(copy));
            }
            else {
                return exports.Either.left(Vector_1.Vector.ofIterable(leftErrs));
            }
        };
    };
    /**
     * Take a partial function (may return undefined or throw),
     * and lift it to return an [[Either]] instead.
     *
     * Note that unlike the [[OptionStatic.lift]] version, if
     * the function returns undefined, the Either.lift version will throw
     * (the Option.lift version returns None()): if you want to do
     * pure side-effects which may throw, you're better off just using
     * javascript try blocks.
     *
     * When using typescript, to help the compiler infer the left type,
     * you can either pass a second parameter like `{} as <type>`, or
     * call with `lift<L,R>(...)`.
     *
     *     const add = Either.lift((x:number,y:number) => x+y, {} as string);
     *     add(1,2);
     *     => Either.right(3)
     *
     *     const undef = Either.lift((x:number,y:number,z:number) => undefined);
     *     undef(1,2,3);
     *     => throws
     *
     *     const throws = Either.lift(() => {throw "x"});
     *     throws();
     *     => Either.left("x")
     */
    EitherStatic.prototype.lift = function (fn, witness) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                var r = fn.apply(void 0, args);
                if (r !== undefined) {
                    return exports.Either.right(r);
                }
            }
            catch (err) {
                return exports.Either.left(err);
            }
            throw new Error("liftEither got undefined!");
        };
    };
    /**
     * Take a no-parameter partial function (may return undefined or throw),
     * call it, and return an [[Either]] instead.
     *
     * Note that unlike the [[OptionStatic.try_]] version, if
     * the function returns undefined, this function will throw
     * (the Option.try_ version returns None()): if you want to do
     * pure side-effects which may throw, you're better off just using
     * javascript try blocks.
     *
     * When using typescript, to help the compiler infer the left type,
     * you can either pass a second parameter like `{} as <type>`, or
     * call with `try_<L,R>(...)`.
     *
     *     Either.try_(Math.random, {} as string);
     *     => Either.right(0.49884723907769635)
     *
     *     Either.try_(() => undefined);
     *     => throws
     *
     *     Either.try_(() => {throw "x"});
     *     => Either.left("x")
     *
     * Also see [[EitherStatic.lift]], [[OptionStatic.try_]],
     * [[OptionStatic.tryNullable]]
     */
    EitherStatic.prototype.try_ = function (fn, witness) {
        return exports.Either.lift(fn)();
    };
    return EitherStatic;
}());
exports.EitherStatic = EitherStatic;
/**
 * The Either constant allows to call the either "static" methods
 */
exports.Either = new EitherStatic();
/**
 * Represents an [[Either]] containing a left value,
 * conceptually tied to a failure.
 * "static methods" available through [[EitherStatic]]
 * @param L the "left" item type 'failure'
 * @param R the "right" item type 'success'
 */
var Left = /** @class */ (function () {
    function Left(value) {
        this.value = value;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns true since this is a Left
     */
    Left.prototype.isLeft = function () {
        return true;
    };
    /**
     * Returns false since this is a Left
     */
    Left.prototype.isRight = function () {
        return false;
    };
    /**
     * Returns true if this is either is a right and contains the value you give.
     */
    Left.prototype.contains = function (val) {
        return false;
    };
    /**
     * If this either is a right, applies the function you give
     * to its contents and build a new right either, otherwise return this.
     */
    Left.prototype.map = function (fn) {
        return this;
    };
    /**
     * If this either is a right, call the function you give with
     * the contents, and return what the function returns, else
     * returns this.
     * This is the monadic bind.
     */
    Left.prototype.flatMap = function (fn) {
        return this;
    };
    /**
     * If this either is a left, call the function you give with
     * the left value and return a new either left with the result
     * of the function, else return this.
     */
    Left.prototype.mapLeft = function (fn) {
        return new Left(fn(this.value));
    };
    /**
     * Map the either: you give a function to apply to the value,
     * a function in case it's a left, a function in case it's a right.
     */
    Left.prototype.bimap = function (fnL, fnR) {
        return new Left(fnL(this.value));
    };
    /**
     * "filter" the either. If it was a Left, it stays a Left.
     * If it was a Right and the predicate you pass returns
     * true for its value, return the either unchanged.
     * But if it was a left and the predicate returns false,
     * return a Left with the value returned by the function
     * passed as second parameter.
     *
     *     Either.right<string,number>(-3)
     *         .filter(x => x >= 0, v => "got negative value: " + v);
     *     => Either.left<string,number>("got negative value: -3")
     */
    Left.prototype.filter = function (p, filterVal) {
        return this;
    };
    /**
     * Combines two eithers. If this either is a right, returns it.
     * If it's a left, returns the other one.
     */
    Left.prototype.orElse = function (other) {
        return other;
    };
    /**
     * Has no effect if this Either is a right. If it's a left however,
     * the function you give will be called, receiving as parameter
     * the left contents, and an Either equivalent to the one your
     * function returns will be returned.
     */
    Left.prototype.recoverWith = function (recoveryFn) {
        return recoveryFn(this.value);
    };
    /**
     * Execute a side-effecting function if the either
     * is a right; returns the either.
     */
    Left.prototype.ifRight = function (fn) {
        return this;
    };
    /**
     * Execute a side-effecting function if the either
     * is a left; returns the either.
     */
    Left.prototype.ifLeft = function (fn) {
        fn(this.value);
        return this;
    };
    /**
     * Handle both branches of the either and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for either.
     *
     *     Either.right<string,number>(5).match({
     *         Left:  x => "left " + x,
     *         Right: x => "right " + x
     *     });
     *     => "right 5"
     */
    Left.prototype.match = function (cases) {
        return cases.Left(this.value);
    };
    /**
     * If this either is a right, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message, or an Error object.
     */
    Left.prototype.getOrThrow = function (errorInfo) {
        if (typeof errorInfo === 'string') {
            throw new Error(errorInfo || "Left.getOrThrow called!");
        }
        throw errorInfo || new Error("Left.getOrThrow called!");
    };
    /**
     * If this either is a right, return its value, else return
     * the value you give.
     */
    Left.prototype.getOrElse = function (other) {
        return other;
    };
    /**
     * Get the value contained in this left.
     * NOTE: we know it's there, since this method
     * belongs to Left, not Either.
     */
    Left.prototype.getLeft = function () {
        return this.value;
    };
    /**
     * If this either is a left, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Left.prototype.getLeftOrThrow = function (message) {
        return this.value;
    };
    /**
     * If this either is a left, return its value, else return
     * the value you give.
     */
    Left.prototype.getLeftOrElse = function (other) {
        return this.value;
    };
    /**
     * Convert this either to an option, conceptually dropping
     * the left (failing) value.
     */
    Left.prototype.toOption = function () {
        return Option_1.Option.none();
    };
    /**
     * Convert to a vector. If it's a left, it's the empty
     * vector, if it's a right, it's a one-element vector with
     * the contents of the either.
     */
    Left.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert to a list. If it's a left, it's the empty
     * list, if it's a right, it's a one-element list with
     * the contents of the either.
     */
    Left.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.empty();
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Left.prototype.transform = function (converter) {
        return converter(this);
    };
    Left.prototype.hasTrueEquality = function () {
        return (this.value && this.value.hasTrueEquality) ?
            this.value.hasTrueEquality() :
            Comparison_1.hasTrueEquality(this.value);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Left.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this.value);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Left.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if ((!other) || (!other.isRight) || other.isRight()) {
            return false;
        }
        var leftOther = other;
        Contract_1.contractTrueEquality("Either.equals", this, leftOther);
        return Comparison_1.areEqual(this.value, leftOther.value);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Left.prototype.toString = function () {
        return "Left(" + this.value + ")";
    };
    /**
     * Used by the node REPL to display values.
     */
    Left.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    return Left;
}());
exports.Left = Left;
/**
 * Represents an [[Either]] containing a success value,
 * conceptually tied to a success.
 * "static methods" available through [[EitherStatic]]
 * @param L the "left" item type 'failure'
 * @param R the "right" item type 'success'
 */
var Right = /** @class */ (function () {
    function Right(value) {
        this.value = value;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns false since this is a Right
     */
    Right.prototype.isLeft = function () {
        return false;
    };
    /**
     * Returns true since this is a Right
     */
    Right.prototype.isRight = function () {
        return true;
    };
    /**
     * Returns true if this is either is a right and contains the value you give.
     */
    Right.prototype.contains = function (val) {
        return Comparison_1.areEqual(this.value, val);
    };
    /**
     * If this either is a right, applies the function you give
     * to its contents and build a new right either, otherwise return this.
     */
    Right.prototype.map = function (fn) {
        return new Right(fn(this.value));
    };
    /**
     * If this either is a right, call the function you give with
     * the contents, and return what the function returns, else
     * returns this.
     * This is the monadic bind.
     */
    Right.prototype.flatMap = function (fn) {
        return fn(this.value);
    };
    /**
     * If this either is a left, call the function you give with
     * the left value and return a new either left with the result
     * of the function, else return this.
     */
    Right.prototype.mapLeft = function (fn) {
        return this;
    };
    /**
     * Map the either: you give a function to apply to the value,
     * a function in case it's a left, a function in case it's a right.
     */
    Right.prototype.bimap = function (fnL, fnR) {
        return new Right(fnR(this.value));
    };
    /**
     * "filter" the either. If it was a Left, it stays a Left.
     * If it was a Right and the predicate you pass returns
     * true for its value, return the either unchanged.
     * But if it was a left and the predicate returns false,
     * return a Left with the value returned by the function
     * passed as second parameter.
     *
     *     Either.right<string,number>(-3)
     *         .filter(x => x >= 0, v => "got negative value: " + v);
     *     => Either.left<string,number>("got negative value: -3")
     */
    Right.prototype.filter = function (p, filterVal) {
        if (p(this.value)) {
            return this;
        }
        return new Left(filterVal(this.value));
    };
    /**
     * Combines two eithers. If this either is a right, returns it.
     * If it's a left, returns the other one.
     */
    Right.prototype.orElse = function (other) {
        return this;
    };
    /**
     * Has no effect if this Either is a right. If it's a left however,
     * the function you give will be called, receiving as parameter
     * the left contents, and an Either equivalent to the one your
     * function returns will be returned.
     */
    Right.prototype.recoverWith = function (recoveryFn) {
        return this;
    };
    /**
     * Execute a side-effecting function if the either
     * is a right; returns the either.
     */
    Right.prototype.ifRight = function (fn) {
        fn(this.value);
        return this;
    };
    /**
     * Execute a side-effecting function if the either
     * is a left; returns the either.
     */
    Right.prototype.ifLeft = function (fn) {
        return this;
    };
    /**
     * Handle both branches of the either and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for either.
     *
     *     Either.right<string,number>(5).match({
     *         Left:  x => "left " + x,
     *         Right: x => "right " + x
     *     });
     *     => "right 5"
     */
    Right.prototype.match = function (cases) {
        return cases.Right(this.value);
    };
    /**
     * Get the value contained in this right.
     * NOTE: we know it's there, since this method
     * belongs to Right, not Either.
     */
    Right.prototype.get = function () {
        return this.value;
    };
    /**
     * If this either is a right, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message, or an Error object.
     */
    Right.prototype.getOrThrow = function (errorInfo) {
        return this.value;
    };
    /**
     * If this either is a right, return its value, else return
     * the value you give.
     */
    Right.prototype.getOrElse = function (other) {
        return this.value;
    };
    /**
     * If this either is a left, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Right.prototype.getLeftOrThrow = function (message) {
        throw message || "Left.getOrThrow called!";
    };
    /**
     * If this either is a left, return its value, else return
     * the value you give.
     */
    Right.prototype.getLeftOrElse = function (other) {
        return other;
    };
    /**
     * Convert this either to an option, conceptually dropping
     * the left (failing) value.
     */
    Right.prototype.toOption = function () {
        return Option_1.Option.of(this.value);
    };
    /**
     * Convert to a vector. If it's a left, it's the empty
     * vector, if it's a right, it's a one-element vector with
     * the contents of the either.
     */
    Right.prototype.toVector = function () {
        return Vector_1.Vector.of(this.value);
    };
    /**
     * Convert to a list. If it's a left, it's the empty
     * list, if it's a right, it's a one-element list with
     * the contents of the either.
     */
    Right.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.of(this.value);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Right.prototype.transform = function (converter) {
        return converter(this);
    };
    Right.prototype.hasTrueEquality = function () {
        return (this.value && this.value.hasTrueEquality) ?
            this.value.hasTrueEquality() :
            Comparison_1.hasTrueEquality(this.value);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Right.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this.value);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Right.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if ((!other) || (!other.isRight) || (!other.isRight())) {
            return false;
        }
        var rightOther = other;
        Contract_1.contractTrueEquality("Either.equals", this, rightOther);
        return Comparison_1.areEqual(this.value, rightOther.value);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Right.prototype.toString = function () {
        return "Right(" + this.value + ")";
    };
    /**
     * Used by the node REPL to display values.
     */
    Right.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    return Right;
}());
exports.Right = Right;

},{"./Comparison":1,"./Contract":2,"./LinkedList":10,"./Option":11,"./Value":16,"./Vector":17}],4:[function(require,module,exports){
"use strict";
/**
 * Rich functions with helpers such as [[Function1.andThen]],
 * [[Function2.apply1]] and so on.
 *
 * We support functions of arities up to 5. For each arity, we have
 * the interface ([[Function1]], [[Function2]], ...), builders are on functions
 * on [[Function1Static]], [[Function2Static]]... accessible on constants
 * named Function1, Function2,...
 *
 * Examples:
 *
 *     const combined = Function1.of((x:number)=>x+2).andThen(x=>x*3);
 *     combined(6);
 *     => 24
 *
 *     const plus5 = Function2.of((x:number,y:number)=>x+y).apply1(5);
 *     plus5(1);
 *     => 6
 */
exports.__esModule = true;
/**
 * This is the type of the Function0 constant, which
 * offers some helper functions to deal
 * with [[Function0]] including
 * the ability to build [[Function0]]
 * from functions using [[Function0Static.of]].
 * It also offers some builtin functions like [[Function0Static.constant]].
 */
var Function0Static = /** @class */ (function () {
    function Function0Static() {
    }
    /**
     * The constant function of one parameter:
     * will always return the value you give, no
     * matter the parameter it's given.
     */
    Function0Static.prototype.constant = function (val) {
        return exports.Function0.of(function () { return val; });
    };
    /**
     * Take a one-parameter function and lift it to become a [[Function1Static]],
     * enabling you to call [[Function1.andThen]] and other such methods on it.
     */
    Function0Static.prototype.of = function (fn) {
        var r = (function () { return fn(); });
        r.andThen = function (fn2) { return exports.Function0.of(function () { return fn2(r()); }); };
        return r;
    };
    return Function0Static;
}());
exports.Function0Static = Function0Static;
/**
 * The Function1 constant allows to call the [[Function0]] "static" methods.
 */
exports.Function0 = new Function0Static();
/**
 * This is the type of the Function1 constant, which
 * offers some helper functions to deal
 * with [[Function1]] including
 * the ability to build [[Function1]]
 * from functions using [[Function1Static.of]].
 * It also offers some builtin functions like [[Function1Static.constant]].
 */
var Function1Static = /** @class */ (function () {
    function Function1Static() {
    }
    /**
     * The identity function.
     */
    Function1Static.prototype.id = function () {
        return exports.Function1.of(function (x) { return x; });
    };
    /**
     * The constant function of one parameter:
     * will always return the value you give, no
     * matter the parameter it's given.
     */
    Function1Static.prototype.constant = function (val) {
        return exports.Function1.of(function (x) { return val; });
    };
    /**
     * Take a one-parameter function and lift it to become a [[Function1Static]],
     * enabling you to call [[Function1.andThen]] and other such methods on it.
     */
    Function1Static.prototype.of = function (fn) {
        var r = (function (x) { return fn(x); });
        r.andThen = function (fn2) { return exports.Function1.of(function (x) { return fn2(r(x)); }); };
        r.compose = function (fn2) { return exports.Function1.of(function (x) { return r(fn2(x)); }); };
        return r;
    };
    return Function1Static;
}());
exports.Function1Static = Function1Static;
/**
 * The Function1 constant allows to call the [[Function1]] "static" methods.
 */
exports.Function1 = new Function1Static();
/**
 * This is the type of the Function2 constant, which
 * offers some helper functions to deal
 * with [[Function2]] including
 * the ability to build [[Function2]]
 * from functions using [[Function2Static.of]].
 * It also offers some builtin functions like [[Function2Static.constant]].
 */
var Function2Static = /** @class */ (function () {
    function Function2Static() {
    }
    /**
     * The constant function of two parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function2Static.prototype.constant = function (val) {
        return exports.Function2.of(function (x, y) { return val; });
    };
    /**
     * Take a two-parameter function and lift it to become a [[Function2]],
     * enabling you to call [[Function2.andThen]] and other such methods on it.
     */
    Function2Static.prototype.of = function (fn) {
        var r = (function (x, y) { return fn(x, y); });
        r.andThen = function (fn2) { return exports.Function2.of(function (x, y) { return fn2(r(x, y)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return r(x, y); }); }); };
        r.tupled = function () { return exports.Function1.of(function (pair) { return r(pair[0], pair[1]); }); };
        r.flipped = function () { return exports.Function2.of(function (x, y) { return r(y, x); }); };
        r.apply1 = function (x) { return exports.Function1.of(function (y) { return r(x, y); }); };
        return r;
    };
    return Function2Static;
}());
exports.Function2Static = Function2Static;
/**
 * The Function2 constant allows to call the [[Function2]] "static" methods.
 */
exports.Function2 = new Function2Static();
/**
 * This is the type of the Function3 constant, which
 * offers some helper functions to deal
 * with [[Function3]] including
 * the ability to build [[Function3]]
 * from functions using [[Function3Static.of]].
 * It also offers some builtin functions like [[Function3Static.constant]].
 */
var Function3Static = /** @class */ (function () {
    function Function3Static() {
    }
    /**
     * The constant function of three parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function3Static.prototype.constant = function (val) {
        return exports.Function3.of(function (x, y, z) { return val; });
    };
    /**
     * Take a three-parameter function and lift it to become a [[Function3]],
     * enabling you to call [[Function3.andThen]] and other such methods on it.
     */
    Function3Static.prototype.of = function (fn) {
        var r = (function (x, y, z) { return fn(x, y, z); });
        r.andThen = function (fn2) { return exports.Function3.of(function (x, y, z) { return fn2(r(x, y, z)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return exports.Function1.of(function (z) { return r(x, y, z); }); }); }); };
        r.tupled = function () { return exports.Function1.of(function (tuple) { return r(tuple[0], tuple[1], tuple[2]); }); };
        r.flipped = function () { return exports.Function3.of(function (x, y, z) { return r(z, y, x); }); };
        r.apply1 = function (x) { return exports.Function2.of(function (y, z) { return r(x, y, z); }); };
        r.apply2 = function (x, y) { return exports.Function1.of(function (z) { return r(x, y, z); }); };
        return r;
    };
    return Function3Static;
}());
exports.Function3Static = Function3Static;
/**
 * The Function3 constant allows to call the [[Function3]] "static" methods.
 */
exports.Function3 = new Function3Static();
/**
 * This is the type of the Function4 constant, which
 * offers some helper functions to deal
 * with [[Function4]] including
 * the ability to build [[Function4]]
 * from functions using [[Function4Static.of]].
 * It also offers some builtin functions like [[Function4Static.constant]].
 */
var Function4Static = /** @class */ (function () {
    function Function4Static() {
    }
    /**
     * The constant function of four parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function4Static.prototype.constant = function (val) {
        return exports.Function4.of(function (x, y, z, a) { return val; });
    };
    /**
     * Take a four-parameter function and lift it to become a [[Function4]],
     * enabling you to call [[Function4.andThen]] and other such methods on it.
     */
    Function4Static.prototype.of = function (fn) {
        var r = (function (x, y, z, a) { return fn(x, y, z, a); });
        r.andThen = function (fn2) { return exports.Function4.of(function (x, y, z, a) { return fn2(r(x, y, z, a)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return exports.Function1.of(function (z) { return exports.Function1.of(function (a) { return r(x, y, z, a); }); }); }); }); };
        r.tupled = function () { return exports.Function1.of(function (tuple) { return r(tuple[0], tuple[1], tuple[2], tuple[3]); }); };
        r.flipped = function () { return exports.Function4.of(function (x, y, z, a) { return r(a, z, y, x); }); };
        r.apply1 = function (x) { return exports.Function3.of(function (y, z, a) { return r(x, y, z, a); }); };
        r.apply2 = function (x, y) { return exports.Function2.of(function (z, a) { return r(x, y, z, a); }); };
        r.apply3 = function (x, y, z) { return exports.Function1.of(function (a) { return r(x, y, z, a); }); };
        return r;
    };
    return Function4Static;
}());
exports.Function4Static = Function4Static;
;
/**
 * The Function4 constant allows to call the [[Function4]] "static" methods.
 */
exports.Function4 = new Function4Static();
/**
 * This is the type of the Function5 constant, which
 * offers some helper functions to deal
 * with [[Function5]] including
 * the ability to build [[Function5]]
 * from functions using [[Function5Static.of]].
 * It also offers some builtin functions like [[Function5Static.constant]].
 */
var Function5Static = /** @class */ (function () {
    function Function5Static() {
    }
    /**
     * The constant function of five parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function5Static.prototype.constant = function (val) {
        return exports.Function5.of(function (x, y, z, a, b) { return val; });
    };
    /**
     * Take a five-parameter function and lift it to become a [[Function5]],
     * enabling you to call [[Function5.andThen]] and other such methods on it.
     */
    Function5Static.prototype.of = function (fn) {
        var r = (function (x, y, z, a, b) { return fn(x, y, z, a, b); });
        r.andThen = function (fn2) { return exports.Function5.of(function (x, y, z, a, b) { return fn2(r(x, y, z, a, b)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return exports.Function1.of(function (z) { return exports.Function1.of(function (a) { return exports.Function1.of(function (b) { return r(x, y, z, a, b); }); }); }); }); }); };
        r.tupled = function () { return exports.Function1.of(function (tuple) { return r(tuple[0], tuple[1], tuple[2], tuple[3], tuple[4]); }); };
        r.flipped = function () { return exports.Function5.of(function (x, y, z, a, b) { return r(b, a, z, y, x); }); };
        r.apply1 = function (x) { return exports.Function4.of(function (y, z, a, b) { return r(x, y, z, a, b); }); };
        r.apply2 = function (x, y) { return exports.Function3.of(function (z, a, b) { return r(x, y, z, a, b); }); };
        r.apply3 = function (x, y, z) { return exports.Function2.of(function (a, b) { return r(x, y, z, a, b); }); };
        r.apply4 = function (x, y, z, a) { return exports.Function1.of(function (b) { return r(x, y, z, a, b); }); };
        return r;
    };
    return Function5Static;
}());
exports.Function5Static = Function5Static;
/**
 * The Function5 constant allows to call the [[Function5]] "static" methods.
 */
exports.Function5 = new Function5Static();

},{}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Vector_1 = require("./Vector");
var Option_1 = require("./Option");
var Either_1 = require("./Either");
var HashMap_1 = require("./HashMap");
/**
 * A Future is the equivalent, and ultimately wraps, a javascript Promise.
 * While Futures support the [[Future.then]] call (so that among others
 * you can use `await` on them), you should call [[Future.map]] and
 * [[Future.flatMap]].
 *
 * Futures represent an asynchronous computation. A Future will only ever
 * be computed once at most. Once it's computed, calling [[Future.map]] or
 * `await` will return instantly.
 */
var Future = /** @class */ (function () {
    // careful cause i can't have my type be F<F<T>>
    // while the code does F<T> as JS's then does!!!
    // for that reason I wrap the value in an array
    // to make sure JS will never turn a Promise<Promise<T>>
    // in a Promise<T>
    function Future(promise) {
        this.promise = promise;
    }
    /**
     * Build a Future in the same way as the 'new Promise'
     * constructor.
     * You get one callback to signal success (resolve),
     * failure (reject), or you can throw to signal failure.
     *
     *     Future.ofPromiseCtor<string>((resolve,reject) => setTimeout(resolve, 10, "hello!"))
     */
    Future.ofPromiseCtor = function (executor) {
        return new Future(new Promise(executor).then(function (v) { return [v]; }));
    };
    /**
     * Build a Future from an existing javascript Promise.
     */
    Future.of = function (promise) {
        return new Future(promise.then(function (x) { return [x]; }));
    };
    /**
     * Build a Future from a node-style callback API, for instance:
     *
     *     Future.ofCallback<string>(cb => fs.readFile('/etc/passwd', 'utf-8', cb))
     */
    Future.ofCallback = function (fn) {
        return Future.ofPromiseCtor(function (resolve, reject) { return fn(function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        }); });
    };
    /**
     * Build a successful Future with the value you provide.
     */
    Future.ok = function (val) {
        return new Future(Promise.resolve([val]));
    };
    /**
     * Build a failed Future with the error data you provide.
     */
    Future.failed = function (reason) {
        return new Future(Promise.reject(reason));
    };
    /**
     * Creates a Future from a function returning a Promise,
     * which can be inline in the call, for instance:
     *
     *     const f1 = Future.ok(1);
     *     const f2 = Future.ok(2);
     *     return Future.do(async () => {
     *         const v1 = await f1;
     *         const v2 = await f2;
     *         return v1 + v2;
     *     });
     */
    Future["do"] = function (fn) {
        return Future.of(fn());
    };
    /**
     * The `then` call is not meant to be a part of the `Future` API,
     * we need then so that `await` works directly.
     *
     * Please rather use [[Future.map]] or [[Future.flatMap]].
     */
    Future.prototype.then = function (onfulfilled, onrejected) {
        return this.promise.then(function (_a) {
            var x = _a[0];
            return onfulfilled(x);
        }, function (rejected) { return onrejected ? onrejected(rejected) : Promise.reject(rejected); });
    };
    /**
     * Get a `Promise` from this `Future`.
     */
    Future.prototype.toPromise = function () {
        return this.promise.then(function (_a) {
            var x = _a[0];
            return x;
        });
    };
    /**
     * Returns a `Future` that'll complete when the first `Future` of
     * the iterable you give will complete, with the value of that first
     * future. Be careful, completing doesn't necessarily mean completing
     * successfully!
     *
     * Also see [[Future.firstSuccessfulOf]]
     */
    Future.firstCompletedOf = function (elts) {
        return Future.of(Promise.race(Vector_1.Vector.ofIterable(elts).map(function (f) { return f.toPromise(); })));
    };
    /**
     * Returns a `Future` that'll complete when the first `Future` of
     * the iterable you give will complete successfully, with the value of that first
     * future.
     *
     * Also see [[Future.firstCompletedOf]]
     */
    Future.firstSuccessfulOf = function (elts) {
        // https://stackoverflow.com/a/37235274/516188
        return Future.of(Promise.all(Vector_1.Vector.ofIterable(elts).map(function (p) {
            // If a request fails, count that as a resolution so it will keep
            // waiting for other possible successes. If a request succeeds,
            // treat it as a rejection so Promise.all immediately bails out.
            return p.then(function (val) { return Promise.reject(val); }, function (err) { return Promise.resolve(err); });
        })).then(
        // If '.all' resolved, we've just got an array of errors.
        function (errors) { return Promise.reject(errors); }, 
        // If '.all' rejected, we've got the result we wanted.
        function (val) { return Promise.resolve(val); }));
    };
    /**
     * Turns a list of futures in a future containing a list of items.
     * Useful in many contexts.
     *
     * But if a single future is failed, you get back a failed Future.
     *
     * Also see [[Future.traverse]]
     */
    Future.sequence = function (elts) {
        return Future.traverse(elts, function (x) { return x; });
    };
    /**
     * Takes a list, a function that can transform list elements
     * to futures, then return a Future containing a list of
     * the transformed elements.
     *
     * But if a single element results in failure, the result also
     * resolves to a failure.
     *
     * There is an optional third parameter to specify options.
     * You can specify `{maxConcurrent: number}` to request that
     * the futures are not all triggered at the same time, but
     * rather only 'number' at a time.
     *
     * Also see [[Future.sequence]]
     */
    Future.traverse = function (elts, fn, opts) {
        if (!opts) {
            return Future.of(Promise.all(Vector_1.Vector.ofIterable(elts).map(function (x) { return fn(x).toPromise(); }))
                .then(Vector_1.Vector.ofIterable));
        }
        // maxConcurrent algorithm inspired by https://stackoverflow.com/a/38778887/516188
        var index = 0;
        var active = [];
        var results = {};
        var it = elts[Symbol.iterator]();
        var failed;
        var addAsNeeded = function (_) {
            if (failed) {
                return failed;
            }
            var cur;
            var _loop_1 = function () {
                var p = fn(cur.value);
                active.push(p);
                var curIdx = index++;
                p.onComplete(function (eitherRes) {
                    active.splice(active.indexOf(p), 1);
                    if (eitherRes.isLeft()) {
                        failed = p;
                    }
                    else {
                        results[curIdx] = eitherRes.get();
                    }
                });
            };
            while (active.length < opts.maxConcurrent &&
                !(cur = it.next()).done) {
                _loop_1();
            }
            if (!failed && active.length === 0 && cur && cur.done) {
                return Future.ok(HashMap_1.HashMap.ofObjectDictionary(results)
                    .toVector()
                    .sortOn(function (kv) { return parseInt(kv[0]); })
                    .map(function (kv) { return kv[1]; }));
            }
            return Future.firstCompletedOf(active).flatMap(addAsNeeded);
        };
        return addAsNeeded();
    };
    /**
     * From the list of Futures you give, will attempt to find a successful
     * Future which value matches the predicate you give.
     * We return a Future of an [[Option]], which will [[None]] in case
     * no matching Future is found.
     */
    Future.find = function (elts, p) {
        var origElts = Vector_1.Vector.ofIterable(elts);
        if (origElts.isEmpty()) {
            return Future.ok(Option_1.Option.none());
        }
        // map the failures to successes with option.none
        // backup the original future object matching the new future
        var velts = origElts
            .map(function (f) { return f
            .map(function (item) { return [f, Option_1.Option.of(item)]; })
            .recoverWith(function (_) { return Future.ok([f, Option_1.Option.none()]); }); });
        // go for the first completed of the iterable
        // remember after our map they're all successful now
        var success = Future.firstCompletedOf(velts);
        return success
            .flatMap(function (_a) {
            var originalFuture = _a[0], option = _a[1];
            if (option.isSome() && p(option.get())) {
                // this successful future matches our predicate, that's it.
                return success.map(function (x) { return x[1]; });
            }
            else {
                // this future failed or doesn't match our predicate.
                // remove the future from the input list (we can do that
                // because we "backed up" the original future in the future
                // result), and try again only with the remaining candidates
                return Future.find(origElts.removeFirst(function (future) { return future === originalFuture; }), p);
            }
        });
    };
    /**
     * Applicative lifting for Future. 'p' stands for 'properties'.
     *
     * Takes a function which operates on a simple JS object, and turns it
     * in a function that operates on the same JS object type except which each field
     * wrapped in a Future ('lifts' the function).
     * It's an alternative to [[Future.liftA2]] when the number of parameters
     * is not two.
     *
     * @param A the object property type specifying the parameters for your function
     * @param B the type returned by your function, returned wrapped in a future by liftAp.
     */
    Future.liftAp = function (fn) {
        return function (x) {
            var fieldNames = Object.keys(x);
            var promisesAr = fieldNames.map(function (n) { return x[n]; });
            var i = 0;
            return Future.of(Promise.all(promisesAr)
                .then(function (resultAr) { return resultAr.reduce(function (sofar, cur) {
                sofar[fieldNames[i++]] = cur;
                return sofar;
            }, {}); })).map(fn);
        };
    };
    /**
     * Applicative lifting for Future.
     * Takes a function which operates on basic values, and turns it
     * in a function that operates on futures of these values ('lifts'
     * the function). The 2 is because it works on functions taking two
     * parameters.
     *
     * @param R1 the first future type
     * @param R2 the second future type
     * @param V the new future type as returned by the combining function.
     */
    Future.liftA2 = function (fn) {
        return function (p1, p2) { return p1.flatMap(function (a1) { return p2.map(function (a2) { return fn(a1, a2); }); }); };
    };
    /**
     * Take a function returning a Promise
     * and lift it to return a [[Future]] instead.
     */
    Future.lift = function (fn) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return Future.of(fn.apply(void 0, args));
        };
    };
    /**
     * Transform the value contained in a successful Future. Has no effect
     * if the Future was failed. Will turn a successful Future in a failed
     * one if you throw an exception in the map callback (but please don't
     * do it.. Rather use [[Future.filter]] or another mechanism).
     */
    Future.prototype.map = function (fn) {
        return new Future(this.promise.then(function (_a) {
            var x = _a[0];
            return [fn(x)];
        }));
    };
    /**
     * Transform the value contained in a successful Future. You return a
     * Future, but it is then "flattened" so we still return a Future<T>
     * (and not a Future<Future<T>>).
     * Has no effect if the Future was failed. Will turn a successful Future in a failed
     * one if you throw an exception in the map callback (but please don't
     * do it.. Rather use [[Future.filter]] or another mechanism).
     * This is the monadic bind.
     */
    Future.prototype.flatMap = function (fn) {
        return new Future(this.promise.then(function (_a) {
            var x = _a[0];
            return fn(x).promise;
        }));
    };
    /**
     * Transform the value contained in a failed Future. Has no effect
     * if the Future was successful.
     */
    Future.prototype.mapFailure = function (fn) {
        return new Future(this.promise["catch"](function (x) { throw fn(x); }));
    };
    /**
     * Execute the side-effecting function you give if the Future is a failure.
     *
     * The Future is unchanged by this call.
     */
    Future.prototype.onFailure = function (fn) {
        this.promise["catch"](function (x) { return fn(x); });
        return this;
    };
    /**
     * Execute the side-effecting function you give if the Future is a success.
     *
     * The Future is unchanged by this call.
     */
    Future.prototype.onSuccess = function (fn) {
        // we create a new promise here, need to catch errors on it,
        // to avoid node UnhandledPromiseRejectionWarning warnings
        this.promise.then(function (x) { fn(x[0]); return x; })["catch"](function (_) { });
        return this;
    };
    /**
     * Execute the side-effecting function you give when the Future is
     * completed. You get an [[Either]], a `Right` if the Future is a
     * success, a `Left` if it's a failure.
     *
     * The Future is unchanged by this call.
     */
    Future.prototype.onComplete = function (fn) {
        this.promise.then(function (x) { fn(Either_1.Either.right(x[0])); return x; }, function (x) { return fn(Either_1.Either.left(x)); });
        return this;
    };
    /**
     * Has no effect on a failed Future. If the Future was successful,
     * will check whether its value matches the predicate you give as
     * first parameter. If the value matches the predicate, an equivalent
     * Future to the input one is returned.
     *
     * If the value doesn't match predicate however, the second parameter
     * function is used to compute the contents of a failed Future that'll
     * be returned.
     */
    Future.prototype.filter = function (p, ifFail) {
        return this.flatMap(function (x) { return p(x) ? Future.ok(x) : Future.failed(ifFail(x)); });
    };
    /**
     * Has no effect if this Future is successful. If it's failed however,
     * the function you give will be called, receiving as parameter
     * the error contents, and a Future equivalent to the one your
     * function returns will be returned.
     */
    Future.prototype.recoverWith = function (f) {
        return new Future(this.promise["catch"](function (err) { return f(err).promise; }));
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Future.prototype.transform = function (fn) {
        return fn(this);
    };
    return Future;
}());
exports.Future = Future;

},{"./Either":3,"./HashMap":6,"./Option":11,"./Vector":17}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var Contract_1 = require("./Contract");
var Option_1 = require("./Option");
var HashSet_1 = require("./HashSet");
var Vector_1 = require("./Vector");
var LinkedList_1 = require("./LinkedList");
var SeqHelpers = require("./SeqHelpers");
var Value_1 = require("./Value");
var hamt = require("hamt_plus");
// HashMap could extend Collection, conceptually. But I'm
// not super happy of having the callbacks get a pair, for instance
// 'HashMap.filter' takes two parameters in the current HashMap;
// if HashMap did implement Collection, it would have to take a k,v
// pair. There's also another trick with 'contains'. The Collection signature
// says T&WithEquality, but here we get [K&WithEquality,V&WithEquality],
// but arrays don't have equality so that doesn't type-check :-(
/**
 * A dictionary, mapping keys to values.
 * @param K the key type
 * @param V the value type
 */
var HashMap = /** @class */ (function () {
    /**
     * @hidden
     */
    function HashMap(hamt) {
        this.hamt = hamt;
    }
    /**
     * The empty map.
     * @param K the key type
     * @param V the value type
     */
    HashMap.empty = function () {
        return emptyHashMap;
    };
    /**
     * Build a HashMap from key-value pairs.
     *
     *     HashMap.of([1,"a"],[2,"b"])
     *
     */
    HashMap.of = function () {
        var entries = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            entries[_i] = arguments[_i];
        }
        return HashMap.ofIterable(entries);
    };
    /**
     * Build a HashMap from an iterable containing key-value pairs.
     *
     *    HashMap.ofIterable(Vector.of<[number,string]>([1,"a"],[2,"b"]));
     */
    HashMap.ofIterable = function (entries) {
        // remember we must set up the hamt with the custom equality
        var iterator = entries[Symbol.iterator]();
        var curItem = iterator.next();
        if (curItem.done) {
            return new EmptyHashMap();
        }
        // emptyhashmap.put sets up the custom equality+hashcode
        var startH = (new EmptyHashMap()).put(curItem.value[0], curItem.value[1]).hamt;
        curItem = iterator.next();
        return new HashMap(startH.mutate(function (h) {
            while (!curItem.done) {
                h.set(curItem.value[0], curItem.value[1]);
                curItem = iterator.next();
            }
        }));
    };
    /**
     * Build a HashMap from a javascript object literal representing
     * a dictionary. Note that the key type must always be string,
     * as that's the way it works in javascript.
     * Also note that entries with undefined values will be stripped
     * from the map.
     *
     *     HashMap.ofObjectDictionary<number>({a:1,b:2})
     *     => HashMap.of(["a",1],["b",2])
     */
    HashMap.ofObjectDictionary = function (object) {
        // no need to bother with the proper equals & hashcode
        // as I know the key type supports ===
        var h = hamt.make().beginMutation();
        for (var property in object) {
            // the reason we strip entries with undefined values on
            // import from object dictionaries are: sanity, and also
            // partial object definitions like {[TKey in MyEnum]?:number}
            // where typescript sees the value type as 'number|undefined'
            // (there is a test covering that)
            if (object.hasOwnProperty(property) &&
                (typeof object[property] !== "undefined")) {
                h.set(property, object[property]);
            }
        }
        return new HashMap(h.endMutation());
    };
    /**
     * Curried predicate to find out whether the HashMap is empty.
     *
     *     Vector.of(HashMap.of([1,2]), HashMap.empty<number,number>())
     *         .filter(HashMap.isEmpty)
     *     => Vector.of(HashMap.empty<number,number>())
     */
    HashMap.isEmpty = function (v) {
        return v.isEmpty();
    };
    /**
     * Curried predicate to find out whether the HashMap is empty.
     *
     *     Vector.of(HashMap.of([1,2]), HashMap.empty<number,number>())
     *         .filter(HashMap.isNotEmpty)
     *     => Vector.of(HashMap.of([1,2]))
     */
    HashMap.isNotEmpty = function (v) {
        return !v.isEmpty();
    };
    /**
     * Get the value for the key you give, if the key is present.
     */
    HashMap.prototype.get = function (k) {
        return Option_1.Option.of(this.hamt.get(k));
    };
    /**
     * Implementation of the Iterator interface.
     */
    HashMap.prototype[Symbol.iterator] = function () {
        return this.hamt.entries();
    };
    /**
     * @hidden
     */
    HashMap.prototype.hasTrueEquality = function () {
        // for true equality, need both key & value to have true
        // equality. but i can't check when they're in an array,
        // as array doesn't have true equality => extract them
        // and check them separately.
        return Option_1.Option.of(this.hamt.entries().next().value)
            .map(function (x) { return x[0]; }).hasTrueEquality() &&
            Option_1.Option.of(this.hamt.entries().next().value)
                .map(function (x) { return x[1]; }).hasTrueEquality();
    };
    /**
     * Add a new entry in the map. If there was entry with the same
     * key, it will be overwritten.
     * @param k the key
     * @param v the value
     */
    HashMap.prototype.put = function (k, v) {
        return new HashMap(this.hamt.set(k, v));
    };
    /**
     * Return a new map with the key you give removed.
     */
    HashMap.prototype.remove = function (k) {
        return new HashMap(this.hamt.remove(k));
    };
    /**
     * Add a new entry in the map; in case there was already an
     * entry with the same key, the merge function will be invoked
     * with the old and the new value to produce the value to take
     * into account.
     *
     * It is guaranteed that the merge function first parameter
     * will be the entry from this map, and the second parameter
     * from the map you give.
     * @param k the key
     * @param v the value
     * @param merge a function to merge old and new values in case of conflict.
     */
    HashMap.prototype.putWithMerge = function (k, v, merge) {
        return new HashMap(this.hamt.modify(k, function (curV) {
            if (curV === undefined) {
                return v;
            }
            return merge(curV, v);
        }));
    };
    /**
     * number of items in the map
     */
    HashMap.prototype.length = function () {
        return this.hamt.size;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    HashMap.prototype.single = function () {
        return this.hamt.size === 1
            ? Option_1.Option.of(this.hamt.entries().next().value)
            : Option_1.Option.none();
    };
    /**
     * true if the map is empty, false otherwise.
     */
    HashMap.prototype.isEmpty = function () {
        return this.hamt.size === 0;
    };
    /**
     * Get a Set containing all the keys in the map
     */
    HashMap.prototype.keySet = function () {
        return HashSet_1.HashSet.ofIterable(this.hamt.keys());
    };
    /**
     * Get an iterable containing all the values in the map
     * (can't return a set as we don't constrain map values
     * to have equality in the generics type)
     */
    HashMap.prototype.valueIterable = function () {
        var _a;
        var hamt = this.hamt;
        return _a = {},
            _a[Symbol.iterator] = function () { return hamt.values(); },
            _a;
    };
    /**
     * Create a new map combining the entries of this map, and
     * the other map you give. In case an entry from this map
     * and the other map have the same key, the merge function
     * will be invoked to get a combined value.
     *
     * It is guaranteed that the merge function first parameter
     * will be the entry from this map, and the second parameter
     * from the map you give.
     * @param other another map to merge with this one
     * @param merge a merge function to combine two values
     *        in case two entries share the same key.
     */
    HashMap.prototype.mergeWith = function (elts, merge) {
        var iterator = elts[Symbol.iterator]();
        var map = this;
        var curItem = iterator.next();
        while (!curItem.done) {
            map = map.putWithMerge(curItem.value[0], curItem.value[1], merge);
            curItem = iterator.next();
        }
        return map;
    };
    /**
     * Return a new map where each entry was transformed
     * by the mapper function you give. You return key,value
     * as pairs.
     */
    HashMap.prototype.map = function (fn) {
        return this.hamt.fold(function (acc, value, key) {
            var _a = fn(key, value), newk = _a[0], newv = _a[1];
            return acc.put(newk, newv);
        }, HashMap.empty());
    };
    /**
     * Return a new map where keys are the same as in this one,
     * but values are transformed
     * by the mapper function you give. You return key,value
     * as pairs.
     */
    HashMap.prototype.mapValues = function (fn) {
        return this.hamt.fold(function (acc, value, key) {
            return acc.put(key, fn(value));
        }, HashMap.empty());
    };
    /**
     * Call a function for element in the collection.
     */
    HashMap.prototype.forEach = function (fun) {
        var iterator = this.hamt.entries();
        var curItem = iterator.next();
        while (!curItem.done) {
            fun(curItem.value);
            curItem = iterator.next();
        }
        return this;
    };
    /**
     * Calls the function you give for each item in the map,
     * your function returns a map, all the maps are
     * merged.
     */
    HashMap.prototype.flatMap = function (fn) {
        return this.foldLeft(HashMap.empty(), function (soFar, cur) { return soFar.mergeWith(fn(cur[0], cur[1]), function (a, b) { return b; }); });
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    HashMap.prototype.allMatch = function (predicate) {
        var iterator = this.hamt.entries();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (!predicate(curItem.value[0], curItem.value[1])) {
                return false;
            }
            curItem = iterator.next();
        }
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    HashMap.prototype.anyMatch = function (predicate) {
        var iterator = this.hamt.entries();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value[0], curItem.value[1])) {
                return true;
            }
            curItem = iterator.next();
        }
        return false;
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    HashMap.prototype.contains = function (val) {
        return Comparison_1.areEqual(this.hamt.get(val[0]), val[1]);
    };
    /**
     * Returns true if there is item with that key in the collection,
     * false otherwise.
     *
     *     HashMap.of<number,string>([1,"a"],[2,"b"]).containsKey(1);
     *     => true
     *
     *     HashMap.of<number,string>([1,"a"],[2,"b"]).containsKey(3);
     *     => false
     */
    HashMap.prototype.containsKey = function (key) {
        return this.hamt.has(key);
    };
    /**
     * Call a predicate for each element in the collection,
     * build a new collection holding only the elements
     * for which the predicate returned true.
     */
    HashMap.prototype.filter = function (predicate) {
        var _this = this;
        return new HashMap(hamt.make({ hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq }).mutate(function (h) {
            var iterator = _this.hamt.entries();
            var curItem = iterator.next();
            while (!curItem.done) {
                if (predicate(curItem.value[0], curItem.value[1])) {
                    h.set(curItem.value[0], curItem.value[1]);
                }
                curItem = iterator.next();
            }
        }));
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     * We name the method findAny instead of find to emphasize
     * that there is not ordering in a hashset.
     *
     *     HashMap.of<number,string>([1,'a'],[2,'b'],[3,'c'])
     *         .findAny((k,v) => k>=2 && v === "c")
     *     => Option.of([3,'c'])
     *
     *     HashMap.of<number,string>([1,'a'],[2,'b'],[3,'c'])
     *         .findAny((k,v) => k>=3 && v === "b")
     *     => Option.none<[number,string]>()
     */
    HashMap.prototype.findAny = function (predicate) {
        var iterator = this.hamt.entries();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value[0], curItem.value[1])) {
                return Option_1.Option.of(curItem.value);
            }
            curItem = iterator.next();
        }
        return Option_1.Option.none();
    };
    HashMap.prototype.filterKeys = function (predicate) {
        return this.filter(function (k, v) { return predicate(k); });
    };
    HashMap.prototype.filterValues = function (predicate) {
        return this.filter(function (k, v) { return predicate(v); });
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     HashMap.of<number,string>([1,"a"],[2,"b"],[3,"c"])
     *      .fold([0,""], ([a,b],[c,d])=>[a+c, b>d?b:d])
     *     => [6,"c"]
     */
    HashMap.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashMap.of([1,"a"], [2,"bb"], [3,"ccc"])
     *     .foldLeft(0, (soFar,[item,val])=>soFar+val.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    HashMap.prototype.foldLeft = function (zero, fn) {
        return this.hamt.fold(function (acc, v, k) {
            return fn(acc, [k, v]);
        }, zero);
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashMap.of([1,"a"], [2,"bb"], [3,"ccc"])
     *     .foldRight(0, ([item,value],soFar)=>soFar+value.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    HashMap.prototype.foldRight = function (zero, fn) {
        return this.foldLeft(zero, function (cur, soFar) { return fn(soFar, cur); });
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    HashMap.prototype.reduce = function (combine) {
        // not really glorious with any...
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Convert to array.
     */
    HashMap.prototype.toArray = function () {
        return this.hamt.fold(function (acc, value, key) { acc.push([key, value]); return acc; }, []);
    };
    /**
     * Convert this map to a vector of key,value pairs.
     * Note that Map is already an iterable of key,value pairs!
     */
    HashMap.prototype.toVector = function () {
        return this.hamt.fold(function (acc, value, key) {
            return acc.append([key, value]);
        }, Vector_1.Vector.empty());
    };
    /**
     * Convert this map to a list of key,value pairs.
     * Note that Map is already an iterable of key,value pairs!
     */
    HashMap.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this);
    };
    /**
     * Convert to a javascript object dictionary
     * You must provide a function to convert the
     * key to a string.
     *
     *     HashMap.of<string,number>(["a",1],["b",2])
     *         .toObjectDictionary(x=>x);
     *     => {a:1,b:2}
     */
    HashMap.prototype.toObjectDictionary = function (keyConvert) {
        return this.foldLeft({}, function (soFar, cur) {
            soFar[keyConvert(cur[0])] = cur[1];
            return soFar;
        });
    };
    HashMap.prototype.toJsMap = function (keyConvert) {
        return this.foldLeft(new Map(), function (soFar, cur) { return soFar.set(keyConvert(cur[0]), cur[1]); });
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    HashMap.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    HashMap.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other.valueIterable) {
            return false;
        }
        Contract_1.contractTrueEquality("HashMap.equals", this, other);
        var sz = this.hamt.size;
        if (other.length() === 0 && sz === 0) {
            // we could get that i'm not the empty map
            // but my size is zero, after some filtering and such.
            return true;
        }
        if (sz !== other.length()) {
            return false;
        }
        var keys = Array.from(this.hamt.keys());
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var k = keys_1[_i];
            var myVal = this.hamt.get(k);
            var hisVal = other.get(k).getOrUndefined();
            if (myVal === undefined || hisVal === undefined) {
                return false;
            }
            if (!Comparison_1.areEqual(myVal, hisVal)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    HashMap.prototype.hashCode = function () {
        return this.hamt.fold(function (acc, value, key) {
            return acc + Comparison_1.fieldsHashCode(key, value);
        }, 0);
    };
    /*
     * Get a human-friendly string representation of that value.
     */
    HashMap.prototype.toString = function () {
        return "HashMap(" +
            this.hamt.fold(function (acc, value, key) {
                acc.push(SeqHelpers_1.toStringHelper(key, { quoteStrings: false }) +
                    ": " + SeqHelpers_1.toStringHelper(value));
                return acc;
            }, [])
                .join(", ") + ")";
    };
    HashMap.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    return HashMap;
}());
exports.HashMap = HashMap;
// we need to override the empty hashmap
// because i don't know how to get the hash & keyset
// functions for the keys without a key value to get
// the functions from
var EmptyHashMap = /** @class */ (function (_super) {
    __extends(EmptyHashMap, _super);
    function EmptyHashMap() {
        return _super.call(this, {}) || this;
    }
    EmptyHashMap.prototype.get = function (k) {
        return Option_1.none;
    };
    EmptyHashMap.prototype[Symbol.iterator] = function () {
        return { next: function () { return ({ done: true, value: undefined }); } };
    };
    EmptyHashMap.prototype.put = function (k, v) {
        Contract_1.contractTrueEquality("Error building a HashMap", k);
        if (Comparison_1.hasEquals(k)) {
            return new HashMap(hamt.make({
                hash: function (v) { return v.hashCode(); },
                keyEq: function (a, b) { return a.equals(b); }
            }).set(k, v));
        }
        return new HashMap(hamt.make().set(k, v));
    };
    EmptyHashMap.prototype.remove = function (k) {
        return this;
    };
    EmptyHashMap.prototype.hasTrueEquality = function () {
        return true;
    };
    EmptyHashMap.prototype.putWithMerge = function (k, v, merge) {
        return this.put(k, v);
    };
    EmptyHashMap.prototype.length = function () {
        return 0;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    EmptyHashMap.prototype.single = function () {
        return Option_1.Option.none();
    };
    EmptyHashMap.prototype.isEmpty = function () {
        return true;
    };
    EmptyHashMap.prototype.keySet = function () {
        return HashSet_1.HashSet.empty();
    };
    EmptyHashMap.prototype.valueIterable = function () {
        var _a;
        return _a = {},
            _a[Symbol.iterator] = function () {
                return {
                    next: function () {
                        return {
                            done: true,
                            value: undefined
                        };
                    }
                };
            },
            _a;
    };
    EmptyHashMap.prototype.mergeWith = function (other, merge) {
        return HashMap.ofIterable(other);
    };
    EmptyHashMap.prototype.map = function (fn) {
        return HashMap.empty();
    };
    EmptyHashMap.prototype.mapValues = function (fn) {
        return HashMap.empty();
    };
    EmptyHashMap.prototype.forEach = function (fun) {
        return this;
    };
    EmptyHashMap.prototype.allMatch = function (predicate) {
        return true;
    };
    EmptyHashMap.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyHashMap.prototype.contains = function (val) {
        return false;
    };
    EmptyHashMap.prototype.containsKey = function (key) {
        return false;
    };
    EmptyHashMap.prototype.filter = function (predicate) {
        return this;
    };
    EmptyHashMap.prototype.findAny = function (predicate) {
        return Option_1.Option.none();
    };
    EmptyHashMap.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
    EmptyHashMap.prototype.toArray = function () {
        return [];
    };
    EmptyHashMap.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    EmptyHashMap.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.empty();
    };
    EmptyHashMap.prototype.equals = function (other) {
        if (!other || !other.valueIterable) {
            return false;
        }
        return other === emptyHashMap || other.length() === 0;
    };
    EmptyHashMap.prototype.hashCode = function () {
        return 0;
    };
    EmptyHashMap.prototype.toString = function () {
        return "HashMap()";
    };
    return EmptyHashMap;
}(HashMap));
var emptyHashMap = new EmptyHashMap();

},{"./Comparison":1,"./Contract":2,"./HashSet":7,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Value":16,"./Vector":17,"hamt_plus":19}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var ISet_1 = require("./ISet");
var Vector_1 = require("./Vector");
var HashMap_1 = require("./HashMap");
var LinkedList_1 = require("./LinkedList");
var Option_1 = require("./Option");
var Comparison_1 = require("./Comparison");
var SeqHelpers = require("./SeqHelpers");
var Contract_1 = require("./Contract");
var Value_1 = require("./Value");
var hamt = require("hamt_plus");
/**
 * An unordered collection of values, where no two values
 * may be equal. A value can only be present once.
 * @param T the item type
 */
var HashSet = /** @class */ (function () {
    /**
     * @hidden
     */
    function HashSet(hamt) {
        this.hamt = hamt;
    }
    /**
     * The empty hashset.
     * @param T the item type
     */
    HashSet.empty = function () {
        return emptyHashSet;
    };
    /**
     * Build a hashset from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    HashSet.ofIterable = function (elts) {
        return new EmptyHashSet().addAll(elts);
    };
    /**
     * Build a hashset from a series of items (any number, as parameters)
     * @param T the item type
     */
    HashSet.of = function () {
        var arr = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arr[_i] = arguments[_i];
        }
        return HashSet.ofIterable(arr);
    };
    /**
     * Curried predicate to find out whether the HashSet is empty.
     *
     *     Vector.of(HashSet.of(1), HashSet.empty<number>())
     *         .filter(HashSet.isEmpty)
     *     => Vector.of(HashSet.empty<number>())
     */
    HashSet.isEmpty = function (v) {
        return v.isEmpty();
    };
    /**
     * Curried predicate to find out whether the HashSet is empty.
     *
     *     Vector.of(HashSet.of(1), HashSet.empty<number>())
     *         .filter(HashSet.isNotEmpty)
     *     => Vector.of(HashSet.of(1))
     */
    HashSet.isNotEmpty = function (v) {
        return !v.isEmpty();
    };
    /**
     * Implementation of the Iterator interface.
     */
    HashSet.prototype[Symbol.iterator] = function () {
        return this.hamt.keys();
    };
    /**
     * Add an element to this set.
     */
    HashSet.prototype.add = function (elt) {
        return new HashSet(this.hamt.set(elt, elt));
    };
    HashSet.prototype.addAllArray = function (elts) {
        return new HashSet(this.hamt.mutate(function (h) {
            if (elts.length > 0) {
                Contract_1.contractTrueEquality("Error building a HashSet", elts[0]);
            }
            for (var _i = 0, elts_1 = elts; _i < elts_1.length; _i++) {
                var val = elts_1[_i];
                h.set(val, val);
            }
        }));
    };
    /**
     * Add multiple elements to this set.
     */
    HashSet.prototype.addAll = function (elts) {
        if (Array.isArray(elts)) {
            return this.addAllArray(elts);
        }
        return new HashSet(this.hamt.mutate(function (h) {
            var checkedEq = false;
            var iterator = elts[Symbol.iterator]();
            var curItem = iterator.next();
            if (!curItem.done && curItem.value && !checkedEq) {
                Contract_1.contractTrueEquality("Error building a HashSet", curItem.value);
                checkedEq = true;
            }
            while (!curItem.done) {
                h.set(curItem.value, curItem.value);
                curItem = iterator.next();
            }
        }));
    };
    /**
     * Returns true if the element you give is present in
     * the set, false otherwise.
     */
    HashSet.prototype.contains = function (elt) {
        return this.hamt.has(elt);
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     * The resulting set may be smaller than the source.
     */
    HashSet.prototype.map = function (mapper) {
        return this.hamt.fold(function (acc, value, key) {
            return acc.add(mapper(value));
        }, HashSet.empty());
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     *
     *     HashSet.of(1,2,6).mapOption(x => x%2===0 ?
     *         Option.of(x+1) : Option.none<number>())
     *     => HashSet.of(3, 7)
     */
    HashSet.prototype.mapOption = function (mapper) {
        return this.hamt.fold(function (acc, value, key) {
            var val = mapper(value);
            return val.isSome() ? acc.add(val.get()) : acc;
        }, HashSet.empty());
    };
    /**
     * Call a function for element in the collection.
     */
    HashSet.prototype.forEach = function (fun) {
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            fun(curItem.value);
            curItem = iterator.next();
        }
        return this;
    };
    /**
     * Calls the function you give for each item in the set,
     * your function returns a set, all the sets are
     * merged.
     */
    HashSet.prototype.flatMap = function (mapper) {
        return this.foldLeft(HashSet.empty(), function (soFar, cur) { return soFar.addAll(mapper(cur)); });
    };
    HashSet.prototype.filter = function (predicate) {
        var _this = this;
        return new HashSet(hamt.make({ hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq }).mutate(function (h) {
            var iterator = _this.hamt.values();
            var curItem = iterator.next();
            while (!curItem.done) {
                if (predicate(curItem.value)) {
                    h.set(curItem.value, curItem.value);
                }
                curItem = iterator.next();
            }
        }));
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     * We name the method findAny instead of find to emphasize
     * that there is not ordering in a hashset.
     *
     *     HashSet.of(1,2,3).findAny(x => x>=3)
     *     => Option.of(3)
     *
     *     HashSet.of(1,2,3).findAny(x => x>=4)
     *     => Option.none<number>()
     */
    HashSet.prototype.findAny = function (predicate) {
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value)) {
                return Option_1.Option.of(curItem.value);
            }
            curItem = iterator.next();
        }
        return Option_1.Option.none();
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     HashSet.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    HashSet.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashSet.of("a", "bb", "ccc").foldLeft(0, (soFar,item) => soFar+item.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    HashSet.prototype.foldLeft = function (zero, fn) {
        return this.hamt.fold(function (acc, v, k) {
            return fn(acc, v);
        }, zero);
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashSet.of("a", "bb", "ccc").foldRight(0, (item,soFar) => soFar+item.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    HashSet.prototype.foldRight = function (zero, fn) {
        return this.foldLeft(zero, function (cur, soFar) { return fn(soFar, cur); });
    };
    /**
     * Converts this set to an array. Since a Set is not ordered
     * and since this method returns a JS array, it can be awkward
     * to get an array sorted in the way you'd like. So you can pass
     * an optional sorting function too.
     *
     *     HashSet.of(1,2,3).toArray().sort()
     *     => [1,2,3]
     *
     *     HashSet.of(1,2,3).toArray({sortOn:x=>x})
     *     => [1,2,3]
     *
     *     HashSet.of(1,2,3).toArray({sortBy:(x,y)=>x-y})
     *     => [1,2,3]
     *
     * You can also pass an array in sortOn, listing lambdas to
     * several fields to sort by those fields, and also {desc:lambda}
     * to sort by some fields descending.
     */
    HashSet.prototype.toArray = function (sort) {
        var _a;
        if (!sort) {
            return Array.from(this.hamt.keys());
        }
        if (ISet_1.isSortOnSpec(sort)) {
            var sortOn = sort.sortOn instanceof Array ? sort.sortOn : [sort.sortOn];
            return (_a = Vector_1.Vector.ofIterable(this.hamt.keys())).sortOn.apply(_a, sortOn).toArray();
        }
        return Array.from(this.hamt.keys()).sort(sort.sortBy);
    };
    /**
     * Converts this set to an vector
     */
    HashSet.prototype.toVector = function () {
        return Vector_1.Vector.ofIterable(this.hamt.keys());
    };
    /**
     * Converts this set to an list
     */
    HashSet.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this.hamt.keys());
    };
    /**
     * Returns the number of elements in the set.
     */
    HashSet.prototype.length = function () {
        return this.hamt.size;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    HashSet.prototype.single = function () {
        return this.hamt.size === 1
            ? Option_1.Option.of(this.hamt.keys().next().value)
            : Option_1.Option.none();
    };
    /**
     * true if the set is empty, false otherwise.
     */
    HashSet.prototype.isEmpty = function () {
        return this.hamt.size === 0;
    };
    /**
     * Returns a new Set containing the difference
     * between this set and the other Set passed as parameter.
     * also see [[HashSet.intersect]]
     */
    HashSet.prototype.diff = function (elts) {
        return new HashSet(this.hamt.fold(function (acc, v, k) {
            return elts.contains(k) ? acc : acc.set(k, k);
        }, hamt.empty));
    };
    /**
     * Returns a new Set containing the intersection
     * of this set and the other Set passed as parameter
     * (the elements which are common to both sets)
     * also see [[HashSet.diff]]
     */
    HashSet.prototype.intersect = function (other) {
        return new HashSet(this.hamt.fold(function (acc, v, k) {
            return other.contains(k) ? acc.set(k, k) : acc;
        }, hamt.empty));
    };
    HashSet.prototype.isSubsetOf = function (other) {
        return this.allMatch(function (x) { return other.contains(x); });
    };
    /**
     * Returns a new set with the element you give removed
     * if it was present in the set.
     */
    HashSet.prototype.remove = function (elt) {
        return new HashSet(this.hamt.remove(elt));
    };
    /**
     * Returns a new set with all the elements of the current
     * Set, minus the elements of the iterable you give as a parameter.
     * If you call this function with a HashSet as parameter,
     * rather call 'diff', as it'll be faster.
     */
    HashSet.prototype.removeAll = function (elts) {
        return this.diff(HashSet.ofIterable(elts));
    };
    HashSet.prototype.allMatch = function (predicate) {
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (!predicate(curItem.value)) {
                return false;
            }
            curItem = iterator.next();
        }
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    HashSet.prototype.anyMatch = function (predicate) {
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value)) {
                return true;
            }
            curItem = iterator.next();
        }
        return false;
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[HashSet.arrangeBy]]
     */
    HashSet.prototype.groupBy = function (classifier) {
        var _this = this;
        // make a singleton set with the same equality as this
        var singletonHamtSet = function (v) { return hamt.make({
            hash: _this.hamt._config.hash, keyEq: _this.hamt._config.keyEq
        }).set(v, v); };
        // merge two mutable hamt sets, but I know the second has only 1 elt
        var mergeSets = function (v1, v2) {
            var k = v2.keys().next().value;
            v1.set(k, k);
            return v1;
        };
        return this.hamt.fold(
        // fold operation: combine a new value from the set with the accumulator
        function (acc, v, k) {
            return acc.putWithMerge(classifier(v), singletonHamtSet(v).beginMutation(), mergeSets);
        }, 
        // fold accumulator: the empty hashmap
        HashMap_1.HashMap.empty())
            .mapValues(function (h) { return new HashSet(h.endMutation()); });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[HashSet.groupBy]]
     */
    HashSet.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    HashSet.prototype.partition = function (predicate) {
        var r1 = hamt.make({
            hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq
        }).beginMutation();
        var r2 = hamt.make({
            hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq
        }).beginMutation();
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value)) {
                r1.set(curItem.value, curItem.value);
            }
            else {
                r2.set(curItem.value, curItem.value);
            }
            curItem = iterator.next();
        }
        return [new HashSet(r1), new HashSet(r2)];
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    HashSet.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.minOn]]
     */
    HashSet.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.minBy]]
     */
    HashSet.prototype.minOn = function (getOrderable) {
        return SeqHelpers.minOn(this, getOrderable);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.maxOn]]
     */
    HashSet.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.maxBy]]
     */
    HashSet.prototype.maxOn = function (getOrderable) {
        return SeqHelpers.maxOn(this, getOrderable);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     *
     *     HashSet.of(1,2,3).sumOn(x=>x)
     *     => 6
     */
    HashSet.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    HashSet.prototype.transform = function (converter) {
        return converter(this);
    };
    HashSet.prototype.toJsSet = function (keyConvert) {
        return this.foldLeft(new Set(), function (sofar, cur) { return sofar.add(keyConvert(cur)); });
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    HashSet.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        var sz = this.hamt.size;
        if (other === emptyHashSet && sz === 0) {
            // we could get that i'm not the empty map
            // but my size is zero, after some filtering and such.
            return true;
        }
        if (!other || !other.hamt) {
            return false;
        }
        if (sz !== other.hamt.size) {
            return false;
        }
        Contract_1.contractTrueEquality("HashSet.equals", this, other);
        var keys = Array.from(this.hamt.keys());
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var k = keys_1[_i];
            var hisVal = other.hamt.get(k);
            if (hisVal === undefined) {
                return false;
            }
            if (!Comparison_1.areEqual(k, hisVal)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    HashSet.prototype.hashCode = function () {
        return this.hamt.fold(function (acc, value, key) {
            return acc + Comparison_1.getHashCode(key);
        }, 0);
    };
    /**
     * Get a human-friendly string representation of that value.
     *
     * Also see [[HashSet.mkString]]
     */
    HashSet.prototype.toString = function () {
        return "HashSet(" +
            this.hamt.fold(function (acc, value, key) { acc.push(SeqHelpers.toStringHelper(key)); return acc; }, []).join(", ")
            + ")";
    };
    HashSet.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     HashSet.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     *
     * (of course, order is not guaranteed)
     */
    HashSet.prototype.mkString = function (separator) {
        return this.hamt.fold(function (acc, value, key) { acc.push(SeqHelpers.toStringHelper(key, { quoteStrings: false })); return acc; }, []).join(separator);
    };
    return HashSet;
}());
exports.HashSet = HashSet;
// we need to override the empty hashmap
// because i don't know how to get the hash & keyset
// functions for the keys without a key value to get
// the functions from
var EmptyHashSet = /** @class */ (function (_super) {
    __extends(EmptyHashSet, _super);
    function EmptyHashSet() {
        return _super.call(this, {}) || this;
    }
    EmptyHashSet.prototype.add = function (elt) {
        Contract_1.contractTrueEquality("Error building a HashSet", elt);
        if (!elt) {
            // special case if we get null for the first element...
            // less optimized variant because we don't know
            // if we should use '===' or 'equals'
            return new HashSet(hamt.make({
                hash: function (v) { return Comparison_1.getHashCode(v); },
                keyEq: function (a, b) { return Comparison_1.areEqual(a, b); }
            }).set(elt, elt));
        }
        // if the element is not null, save a if later by finding
        // out right now whether we should call equals or ===
        if (Comparison_1.hasEquals(elt)) {
            return new HashSet(hamt.make({
                hash: function (v) { return v.hashCode(); },
                keyEq: function (a, b) { return a.equals(b); }
            }).set(elt, elt));
        }
        return new HashSet(hamt.make().set(elt, elt));
    };
    EmptyHashSet.prototype.addAll = function (elts) {
        var _a;
        var it = elts[Symbol.iterator]();
        var curItem = it.next();
        if (curItem.done) {
            return emptyHashSet;
        }
        return this.add(curItem.value).addAll((_a = {}, _a[Symbol.iterator] = function () { return it; }, _a));
    };
    EmptyHashSet.prototype.contains = function (elt) {
        return false;
    };
    EmptyHashSet.prototype.map = function (mapper) {
        return emptyHashSet;
    };
    EmptyHashSet.prototype.mapOption = function (mapper) {
        return emptyHashSet;
    };
    EmptyHashSet.prototype.forEach = function (fun) {
        return this;
    };
    EmptyHashSet.prototype.filter = function (predicate) {
        return this;
    };
    EmptyHashSet.prototype.findAny = function (predicate) {
        return Option_1.Option.none();
    };
    EmptyHashSet.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
    EmptyHashSet.prototype.toArray = function (sort) {
        return [];
    };
    EmptyHashSet.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    EmptyHashSet.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.empty();
    };
    EmptyHashSet.prototype[Symbol.iterator] = function () {
        return { next: function () { return ({ done: true, value: undefined }); } };
    };
    EmptyHashSet.prototype.length = function () {
        return 0;
    };
    EmptyHashSet.prototype.isEmpty = function () {
        return true;
    };
    EmptyHashSet.prototype.diff = function (elts) {
        return this;
    };
    EmptyHashSet.prototype.intersect = function (other) {
        return this;
    };
    EmptyHashSet.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyHashSet.prototype.groupBy = function (classifier) {
        return HashMap_1.HashMap.empty();
    };
    EmptyHashSet.prototype.allMatch = function (predicate) {
        return true;
    };
    EmptyHashSet.prototype.partition = function (predicate) {
        return [this, this];
    };
    EmptyHashSet.prototype.remove = function (elt) {
        return this;
    };
    EmptyHashSet.prototype.equals = function (other) {
        if (!other || !other.length) {
            return false;
        }
        return other === emptyHashSet || other.length() === 0;
    };
    EmptyHashSet.prototype.hashCode = function () {
        return 0;
    };
    EmptyHashSet.prototype.toString = function () {
        return "HashSet()";
    };
    EmptyHashSet.prototype.mkString = function (separator) {
        return "";
    };
    return EmptyHashSet;
}(HashSet));
var emptyHashSet = new EmptyHashSet();

},{"./Comparison":1,"./Contract":2,"./HashMap":6,"./ISet":8,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Value":16,"./Vector":17,"hamt_plus":19}],8:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * @hidden
 */
function isSortOnSpec(sortSpec) {
    return sortSpec.sortOn !== undefined;
}
exports.isSortOnSpec = isSortOnSpec;

},{}],9:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Value_1 = require("./Value");
var SeqHelpers_1 = require("./SeqHelpers");
/**
 * Represent a lazily evaluated value. You give a function which
 * will return a value; that function is only called when the value
 * is requested from Lazy, but it will be computed at most once.
 * If the value is requested again, the previously computed result
 * will be returned: Lazy is memoizing.
 */
var Lazy = /** @class */ (function () {
    function Lazy(thunk) {
        this.thunk = thunk;
    }
    /**
     * Build a Lazy from a computation returning a value.
     * The computation will be called at most once.
     */
    Lazy.of = function (thunk) {
        return new Lazy(thunk);
    };
    /**
     * Evaluate the value, cache its value, and return it, or return the
     * previously computed value.
     */
    Lazy.prototype.get = function () {
        if (this.thunk) {
            this.value = this.thunk();
            this.thunk = undefined;
        }
        return this.value;
    };
    /**
     * Returns true if the computation underlying this Lazy was already
     * performed, false otherwise.
     */
    Lazy.prototype.isEvaluated = function () {
        return this.thunk === undefined;
    };
    /**
     * Return a new lazy where the element was transformed
     * by the mapper function you give.
     */
    Lazy.prototype.map = function (mapper) {
        var _this = this;
        return new Lazy(function () { return mapper(_this.get()); });
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Lazy.prototype.toString = function () {
        return this.isEvaluated() ?
            "Lazy(" + SeqHelpers_1.toStringHelper(this.get()) + ")" :
            "Lazy(?)";
    };
    /**
     * Used by the node REPL to display values.
     * Most of the time should be the same as toString()
     */
    Lazy.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    return Lazy;
}());
exports.Lazy = Lazy;

},{"./SeqHelpers":13,"./Value":16}],10:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * A sequence of values, organized in-memory as a strict linked list.
 * Each element has an head (value) and a tail (the rest of the list).
 *
 * The code is organized through the class [[EmptyLinkedList]] (empty list
 * or tail), the class [[ConsLinkedList]] (list value and pointer to next),
 * and the type alias [[LinkedList]] (empty or cons).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[LinkedListStatic]] and are accessed through the global constant LinkedList.
 *
 * Random access is expensive, appending is expensive, prepend or getting
 * the tail of the list is very cheap.
 * If you often need random access you should rather use [[Vector]].
 * Avoid appending at the end of the list in a loop, prefer prepending and
 * then reversing the list.
 *
 * Examples:
 *
 *     LinkedList.of(1,2,3);
 *     LinkedList.of(1,2,3).map(x => x*2).last();
 */
var Option_1 = require("./Option");
var Vector_1 = require("./Vector");
var Comparison_1 = require("./Comparison");
var Contract_1 = require("./Contract");
var Value_1 = require("./Value");
var HashMap_1 = require("./HashMap");
var HashSet_1 = require("./HashSet");
var SeqHelpers = require("./SeqHelpers");
/**
 * Holds the "static methods" for [[LinkedList]]
 */
var LinkedListStatic = /** @class */ (function () {
    function LinkedListStatic() {
    }
    /**
     * The empty stream
     */
    LinkedListStatic.prototype.empty = function () {
        return emptyLinkedList;
    };
    LinkedListStatic.prototype.of = function () {
        var elts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elts[_i] = arguments[_i];
        }
        return exports.LinkedList.ofIterable(elts);
    };
    /**
     * Build a stream from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    LinkedListStatic.prototype.ofIterable = function (elts) {
        var iterator = elts[Symbol.iterator]();
        var curItem = iterator.next();
        var result = emptyLinkedList;
        while (!curItem.done) {
            result = new ConsLinkedList(curItem.value, result);
            curItem = iterator.next();
        }
        return result.reverse();
    };
    /**
     * Curried type guard for LinkedList.
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(LinkedList.of(1), LinkedList.empty<number>())
     *         .filter(LinkedList.isEmpty)
     *     => Vector.of(LinkedList.empty<number>())
     */
    LinkedListStatic.prototype.isEmpty = function (l) {
        return l.isEmpty();
    };
    /**
     * Curried type guard for LinkedList.
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(Stream.of(1), Stream.empty<number>())
     *         .filter(Stream.isNotEmpty)
     *         .map(s => s.head().get()+1)
     *     => Vector.of(2)
     */
    LinkedListStatic.prototype.isNotEmpty = function (l) {
        return !l.isEmpty();
    };
    /**
     * Dual to the foldRight function. Build a collection from a seed.
     * Takes a starting element and a function.
     * It applies the function on the starting element; if the
     * function returns None, it stops building the list, if it
     * returns Some of a pair, it adds the first element to the result
     * and takes the second element as a seed to keep going.
     *
     *     LinkedList.unfoldRight(
     *          10, x=>Option.of(x)
     *              .filter(x => x!==0)
     *              .map<[number,number]>(x => [x,x-1]))
     *     => LinkedList.of(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
     */
    LinkedListStatic.prototype.unfoldRight = function (seed, fn) {
        var nextVal = fn(seed);
        var result = emptyLinkedList;
        while (!nextVal.isNone()) {
            result = new ConsLinkedList(nextVal.get()[0], result);
            nextVal = fn(nextVal.get()[1]);
        }
        return result.reverse();
    };
    /**
     * Combine any number of iterables you give in as
     * parameters to produce a new collection which combines all,
     * in tuples. For instance:
     *
     *     LinkedList.zip(LinkedList.of(1,2,3), ["a","b","c"], Vector.of(8,9,10))
     *     => LinkedList.of([1,"a",8], [2,"b",9], [3,"c",10])
     *
     * The result collection will have the length of the shorter
     * of the input iterables. Extra elements will be discarded.
     *
     * Also see the non-static version [[ConsLinkedList.zip]], which only combines two
     * collections.
     * @param A A is the type of the tuple that'll be generated
     *          (`[number,string,number]` for the code sample)
     */
    LinkedListStatic.prototype.zip = function () {
        var iterables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            iterables[_i] = arguments[_i];
        }
        var r = exports.LinkedList.empty();
        var iterators = iterables.map(function (i) { return i[Symbol.iterator](); });
        var items = iterators.map(function (i) { return i.next(); });
        while (!items.some(function (item) { return item.done; })) {
            r = r.prepend(items.map(function (item) { return item.value; }));
            items = iterators.map(function (i) { return i.next(); });
        }
        return r.reverse();
    };
    return LinkedListStatic;
}());
exports.LinkedListStatic = LinkedListStatic;
/**
 * The LinkedList constant allows to call the LinkedList "static" methods
 */
exports.LinkedList = new LinkedListStatic();
/**
 * EmptyLinkedList is the empty linked list; every non-empty
 * linked list also has a pointer to an empty linked list
 * after its last element.
 * "static methods" available through [[LinkedListStatic]]
 * @param T the item type
 */
var EmptyLinkedList = /** @class */ (function () {
    function EmptyLinkedList() {
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * @hidden
     */
    EmptyLinkedList.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * Implementation of the Iterator interface.
     */
    EmptyLinkedList.prototype[Symbol.iterator] = function () {
        return {
            next: function () {
                return {
                    done: true,
                    value: undefined
                };
            }
        };
    };
    /**
     * View this Some a as LinkedList. Useful to help typescript type
     * inference sometimes.
     */
    EmptyLinkedList.prototype.asLinkedList = function () {
        return this;
    };
    /**
     * Get the length of the collection.
     */
    EmptyLinkedList.prototype.length = function () {
        return 0;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    EmptyLinkedList.prototype.single = function () {
        return Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    EmptyLinkedList.prototype.isEmpty = function () {
        return true;
    };
    /**
     * Get the first value of the collection, if any.
     * In this case the list is empty, so returns Option.none
     */
    EmptyLinkedList.prototype.head = function () {
        return Option_1.Option.none();
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    EmptyLinkedList.prototype.tail = function () {
        return Option_1.Option.none();
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    EmptyLinkedList.prototype.last = function () {
        return Option_1.Option.none();
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on LinkedList, which is not a good data structure
     * for random access!
     */
    EmptyLinkedList.prototype.get = function (idx) {
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    EmptyLinkedList.prototype.find = function (predicate) {
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    EmptyLinkedList.prototype.contains = function (v) {
        return false;
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    EmptyLinkedList.prototype.take = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    EmptyLinkedList.prototype.takeWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate,
     * but starting from the end of the collection.
     *
     *     LinkedList.of(1,2,3,4).takeRightWhile(x => x > 2)
     *     => LinkedList.of(3,4)
     */
    EmptyLinkedList.prototype.takeRightWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyLinkedList.prototype.drop = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    EmptyLinkedList.prototype.dropWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyLinkedList.prototype.dropRight = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the last elements
     * until one element fails the predicate. All elements
     * before that point are retained.
     */
    EmptyLinkedList.prototype.dropRightWhile = function (predicate) {
        return this;
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     LinkedList.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    EmptyLinkedList.prototype.fold = function (zero, fn) {
        return zero;
    };
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
    EmptyLinkedList.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
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
    EmptyLinkedList.prototype.foldRight = function (zero, fn) {
        return zero;
    };
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
     * Also see [[LinkedListStatic.zip]] (static version which can more than two
     * iterables)
     */
    EmptyLinkedList.prototype.zip = function (other) {
        return emptyLinkedList;
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     LinkedList.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => LinkedList.of("a0", "b1")
     */
    EmptyLinkedList.prototype.zipWithIndex = function () {
        return this;
    };
    /**
     * Reverse the collection. For instance:
     *
     *     LinkedList.of(1,2,3).reverse();
     *     => LinkedList.of(3,2,1)
     */
    EmptyLinkedList.prototype.reverse = function () {
        return this;
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    LinkedList.of(1,2,3,4,5,6).span(x => x <3)
     *    => [LinkedList.of(1,2), LinkedList.of(3,4,5,6)]
     */
    EmptyLinkedList.prototype.span = function (predicate) {
        return [this, this];
    };
    /**
     * Split the collection at a specific index.
     *
     *     LinkedList.of(1,2,3,4,5).splitAt(3)
     *     => [LinkedList.of(1,2,3), LinkedList.of(4,5)]
     */
    EmptyLinkedList.prototype.splitAt = function (index) {
        return [this, this];
    };
    EmptyLinkedList.prototype.partition = function (predicate) {
        return [exports.LinkedList.empty(), exports.LinkedList.empty()];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsLinkedList.arrangeBy]]
     */
    EmptyLinkedList.prototype.groupBy = function (classifier) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsLinkedList.groupBy]]
     */
    EmptyLinkedList.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    EmptyLinkedList.prototype.shuffle = function () {
        return this;
    };
    /**
     * Append an element at the end of this LinkedList.
     * Warning: appending in a loop on a linked list is going
     * to be very slow!
     */
    EmptyLinkedList.prototype.append = function (v) {
        return exports.LinkedList.of(v);
    };
    /*
     * Append multiple elements at the end of this LinkedList.
     */
    EmptyLinkedList.prototype.appendAll = function (elts) {
        return exports.LinkedList.ofIterable(elts);
    };
    /**
     * Remove multiple elements from a LinkedList
     *
     *     LinkedList.of(1,2,3,4,3,2,1).removeAll([2,4])
     *     => LinkedList.of(1,3,3,1)
     */
    EmptyLinkedList.prototype.removeAll = function (elts) {
        return this;
    };
    /**
     * Removes the first element matching the predicate
     * (use [[Seq.filter]] to remove all elements matching a predicate)
     */
    EmptyLinkedList.prototype.removeFirst = function (predicate) {
        return this;
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    EmptyLinkedList.prototype.prepend = function (elt) {
        return new ConsLinkedList(elt, this);
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    EmptyLinkedList.prototype.prependAll = function (elt) {
        return exports.LinkedList.ofIterable(elt);
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    EmptyLinkedList.prototype.map = function (mapper) {
        return emptyLinkedList;
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     *
     *     LinkedList.of(1,2,6).mapOption(x => x%2===0 ?
     *         Option.of(x+1) : Option.none<number>())
     *     => LinkedList.of(3, 7)
     */
    EmptyLinkedList.prototype.mapOption = function (mapper) {
        return emptyLinkedList;
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    EmptyLinkedList.prototype.flatMap = function (mapper) {
        return emptyLinkedList;
    };
    EmptyLinkedList.prototype.allMatch = function (predicate) {
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    EmptyLinkedList.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyLinkedList.prototype.filter = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     *     const activityOrder = ["Writer", "Actor", "Director"];
     *     LinkedList.of({name:"George", activity: "Director"}, {name:"Robert", activity: "Actor"})
     *         .sortBy((p1,p2) => activityOrder.indexOf(p1.activity) - activityOrder.indexOf(p2.activity));
     *     => LinkedList.of({"name":"Robert","activity":"Actor"}, {"name":"George","activity":"Director"})
     *
     * also see [[ConsLinkedList.sortOn]]
     */
    EmptyLinkedList.prototype.sortBy = function (compare) {
        return this;
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     *     LinkedList.of({a:3,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a)
     *     => LinkedList.of({a:1,b:"test"},{a:2,b:"a"},{a:3,b:"b"})
     *
     * You can also sort by multiple criteria, and request 'descending'
     * sorting:
     *
     *     LinkedList.of({a:1,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a,{desc:elt=>elt.b})
     *     => LinkedList.of({a:1,b:"test"},{a:1,b:"b"},{a:2,b:"a"})
     *
     * also see [[ConsLinkedList.sortBy]]
     */
    EmptyLinkedList.prototype.sortOn = function () {
        var getKeys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            getKeys[_i] = arguments[_i];
        }
        return this;
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     LinkedList.of(1,1,2,3,2,3,1).distinctBy(x => x)
     *     => LinkedList.of(1,2,3)
     */
    EmptyLinkedList.prototype.distinctBy = function (keyExtractor) {
        return this;
    };
    /**
     * Call a function for element in the collection.
     */
    EmptyLinkedList.prototype.forEach = function (fn) {
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    EmptyLinkedList.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.minOn]]
     */
    EmptyLinkedList.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     *     LinkedList.of({name:"Joe", age:12}, {name:"Paula", age:6}).minOn(x=>x.age)
     *     => Option.of({name:"Paula", age:6})
     *
     * also see [[ConsLinkedList.minBy]]
     */
    EmptyLinkedList.prototype.minOn = function (getOrderable) {
        return SeqHelpers.minOn(this, getOrderable);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.maxOn]]
     */
    EmptyLinkedList.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     *     LinkedList.of({name:"Joe", age:12}, {name:"Paula", age:6}).maxOn(x=>x.age)
     *     => Option.of({name:"Joe", age:12})
     *
     * also see [[ConsLinkedList.maxBy]]
     */
    EmptyLinkedList.prototype.maxOn = function (getOrderable) {
        return SeqHelpers.maxOn(this, getOrderable);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     *
     *     LinkedList.of(1,2,3).sumOn(x=>x)
     *     => 6
     */
    EmptyLinkedList.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     LinkedList.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(LinkedList.of(1,2,3), LinkedList.of(4,5,6), LinkedList.of(7,8))
     */
    EmptyLinkedList.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The last element of the result is the final cumulative result.
     *
     *     LinkedList.of(1,2,3).scanLeft(0, (soFar,cur)=>soFar+cur)
     *     => LinkedList.of(0,1,3,6)
     */
    EmptyLinkedList.prototype.scanLeft = function (init, fn) {
        return exports.LinkedList.of(init);
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The first element of the result is the final cumulative result.
     *
     *     LinkedList.of(1,2,3).scanRight(0, (cur,soFar)=>soFar+cur)
     *     => LinkedList.of(6,5,3,0)
     */
    EmptyLinkedList.prototype.scanRight = function (init, fn) {
        return exports.LinkedList.of(init);
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     LinkedList.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    EmptyLinkedList.prototype.mkString = function (separator) {
        return "";
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    EmptyLinkedList.prototype.toArray = function () {
        return [];
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    EmptyLinkedList.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     *
     *     LinkedList.of(1,2,3).toMap(x=>[x.toString(), x])
     *     => HashMap.of(["1",1], ["2",2], ["3",3])
     */
    EmptyLinkedList.prototype.toMap = function (converter) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     LinkedList.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    EmptyLinkedList.prototype.toSet = function (converter) {
        return HashSet_1.HashSet.empty();
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    EmptyLinkedList.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    EmptyLinkedList.prototype.equals = function (other) {
        if (!other) {
            return false;
        }
        return other.isEmpty();
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    EmptyLinkedList.prototype.hashCode = function () {
        return 1;
    };
    EmptyLinkedList.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     *
     * Also see [[ConsLinkedList.mkString]]
     */
    EmptyLinkedList.prototype.toString = function () {
        return "LinkedList()";
    };
    return EmptyLinkedList;
}());
exports.EmptyLinkedList = EmptyLinkedList;
/**
 * ConsLinkedList holds a value and a pointer to a next element,
 * which could be [[ConsLinkedList]] or [[EmptyLinkedList]].
 * A ConsLinkedList is basically a non-empty linked list. It will
 * contain at least one element.
 * "static methods" available through [[LinkedListStatic]]
 * @param T the item type
 */
var ConsLinkedList = /** @class */ (function () {
    /**
     * @hidden
     */
    function ConsLinkedList(value, _tail) {
        this.value = value;
        this._tail = _tail;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * @hidden
     */
    ConsLinkedList.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * View this Some a as LinkedList. Useful to help typescript type
     * inference sometimes.
     */
    ConsLinkedList.prototype.asLinkedList = function () {
        return this;
    };
    /**
     * Implementation of the Iterator interface.
     */
    ConsLinkedList.prototype[Symbol.iterator] = function () {
        var item = this;
        return {
            next: function () {
                if (item.isEmpty()) {
                    return { done: true, value: undefined };
                }
                var value = item.head().get();
                item = item.tail().get();
                return { done: false, value: value };
            }
        };
    };
    /**
     * Get the length of the collection.
     */
    ConsLinkedList.prototype.length = function () {
        return this.foldLeft(0, function (n, ignored) { return n + 1; });
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    ConsLinkedList.prototype.single = function () {
        return this._tail.isEmpty() ?
            Option_1.Option.of(this.value) :
            Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    ConsLinkedList.prototype.isEmpty = function () {
        return false;
    };
    /**
     * Get the first value of the collection, if any.
     * In this case the list is not empty, so returns Option.some
     */
    ConsLinkedList.prototype.head = function () {
        return Option_1.Option.some(this.value);
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    ConsLinkedList.prototype.tail = function () {
        return Option_1.Option.some(this._tail);
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    ConsLinkedList.prototype.last = function () {
        var curItem = this;
        while (true) {
            var item = curItem.value;
            curItem = curItem._tail;
            if (curItem.isEmpty()) {
                return Option_1.Option.some(item);
            }
        }
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on LinkedList, which is not a good data structure
     * for random access!
     */
    ConsLinkedList.prototype.get = function (idx) {
        var curItem = this;
        var i = 0;
        while (!curItem.isEmpty()) {
            if (i === idx) {
                var item = curItem.value;
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail;
            ++i;
        }
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    ConsLinkedList.prototype.find = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            var item = curItem.value;
            if (predicate(item)) {
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail;
        }
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    ConsLinkedList.prototype.contains = function (v) {
        return this.find(function (x) { return Comparison_1.areEqual(x, v); }).isSome();
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    ConsLinkedList.prototype.take = function (n) {
        var result = emptyLinkedList;
        var curItem = this;
        var i = 0;
        while (i++ < n && (!curItem.isEmpty())) {
            result = new ConsLinkedList(curItem.value, result);
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    ConsLinkedList.prototype.takeWhile = function (predicate) {
        var result = emptyLinkedList;
        var curItem = this;
        while ((!curItem.isEmpty()) && predicate(curItem.value)) {
            result = new ConsLinkedList(curItem.value, result);
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate,
     * but starting from the end of the collection.
     *
     *     LinkedList.of(1,2,3,4).takeRightWhile(x => x > 2)
     *     => LinkedList.of(3,4)
     */
    ConsLinkedList.prototype.takeRightWhile = function (predicate) {
        return this.reverse().takeWhile(predicate).reverse();
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsLinkedList.prototype.drop = function (n) {
        var i = n;
        var curItem = this;
        while (i-- > 0 && !curItem.isEmpty()) {
            curItem = curItem._tail;
        }
        return curItem;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    ConsLinkedList.prototype.dropWhile = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty() && predicate(curItem.value)) {
            curItem = curItem._tail;
        }
        return curItem;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsLinkedList.prototype.dropRight = function (n) {
        // going twice through the list...
        var length = this.length();
        return this.take(length - n);
    };
    /**
     * Returns a new collection, discarding the last elements
     * until one element fails the predicate. All elements
     * before that point are retained.
     */
    ConsLinkedList.prototype.dropRightWhile = function (predicate) {
        return this.reverse().dropWhile(predicate).reverse();
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     LinkedList.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    ConsLinkedList.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
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
    ConsLinkedList.prototype.foldLeft = function (zero, fn) {
        var r = zero;
        var curItem = this;
        while (!curItem.isEmpty()) {
            r = fn(r, curItem.value);
            curItem = curItem._tail;
        }
        return r;
    };
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
    ConsLinkedList.prototype.foldRight = function (zero, fn) {
        return this.reverse().foldLeft(zero, function (xs, x) { return fn(x, xs); });
    };
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
     * Also see [[LinkedListStatic.zip]] (static version which can more than two
     * iterables)
     */
    ConsLinkedList.prototype.zip = function (other) {
        var otherIterator = other[Symbol.iterator]();
        var otherCurItem = otherIterator.next();
        var curItem = this;
        var result = emptyLinkedList;
        while ((!curItem.isEmpty()) && (!otherCurItem.done)) {
            result = new ConsLinkedList([curItem.value, otherCurItem.value], result);
            curItem = curItem._tail;
            otherCurItem = otherIterator.next();
        }
        return result.reverse();
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     LinkedList.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => LinkedList.of("a0", "b1")
     */
    ConsLinkedList.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Reverse the collection. For instance:
     *
     *     LinkedList.of(1,2,3).reverse();
     *     => LinkedList.of(3,2,1)
     */
    ConsLinkedList.prototype.reverse = function () {
        return this.foldLeft(emptyLinkedList, function (xs, x) { return xs.prepend(x); });
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    LinkedList.of(1,2,3,4,5,6).span(x => x <3)
     *    => [LinkedList.of(1,2), LinkedList.of(3,4,5,6)]
     */
    ConsLinkedList.prototype.span = function (predicate) {
        var first = emptyLinkedList;
        var curItem = this;
        while ((!curItem.isEmpty()) && predicate(curItem.value)) {
            first = new ConsLinkedList(curItem.value, first);
            curItem = curItem._tail;
        }
        return [first.reverse(), curItem];
    };
    /**
     * Split the collection at a specific index.
     *
     *     LinkedList.of(1,2,3,4,5).splitAt(3)
     *     => [LinkedList.of(1,2,3), LinkedList.of(4,5)]
     */
    ConsLinkedList.prototype.splitAt = function (index) {
        var first = emptyLinkedList;
        var curItem = this;
        var i = 0;
        while (i++ < index && (!curItem.isEmpty())) {
            first = new ConsLinkedList(curItem.value, first);
            curItem = curItem._tail;
        }
        return [first.reverse(), curItem];
    };
    ConsLinkedList.prototype.partition = function (predicate) {
        var fst = exports.LinkedList.empty();
        var snd = exports.LinkedList.empty();
        var curItem = this;
        while (!curItem.isEmpty()) {
            if (predicate(curItem.value)) {
                fst = new ConsLinkedList(curItem.value, fst);
            }
            else {
                snd = new ConsLinkedList(curItem.value, snd);
            }
            curItem = curItem._tail;
        }
        return [fst.reverse(), snd.reverse()];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsLinkedList.arrangeBy]]
     */
    ConsLinkedList.prototype.groupBy = function (classifier) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, v) {
            return acc.putWithMerge(classifier(v), exports.LinkedList.of(v), function (v1, v2) {
                return v1.prepend(v2.single().getOrThrow());
            });
        })
            .mapValues(function (l) { return l.reverse(); });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsLinkedList.groupBy]]
     */
    ConsLinkedList.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    ConsLinkedList.prototype.shuffle = function () {
        return exports.LinkedList.ofIterable(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Append an element at the end of this LinkedList.
     * Warning: appending in a loop on a linked list is going
     * to be very slow!
     */
    ConsLinkedList.prototype.append = function (v) {
        return new ConsLinkedList(this.value, this._tail.append(v));
    };
    /*
     * Append multiple elements at the end of this LinkedList.
     */
    ConsLinkedList.prototype.appendAll = function (elts) {
        return exports.LinkedList.ofIterable(elts).prependAll(this);
    };
    /**
     * Remove multiple elements from a LinkedList
     *
     *     LinkedList.of(1,2,3,4,3,2,1).removeAll([2,4])
     *     => LinkedList.of(1,3,3,1)
     */
    ConsLinkedList.prototype.removeAll = function (elts) {
        return SeqHelpers.removeAll(this, elts);
    };
    /**
     * Removes the first element matching the predicate
     * (use [[Seq.filter]] to remove all elements matching a predicate)
     */
    ConsLinkedList.prototype.removeFirst = function (predicate) {
        var curItem = this;
        var result = emptyLinkedList;
        var removed = false;
        while (!curItem.isEmpty()) {
            if (predicate(curItem.value) && !removed) {
                removed = true;
            }
            else {
                result = new ConsLinkedList(curItem.value, result);
            }
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    ConsLinkedList.prototype.prepend = function (elt) {
        return new ConsLinkedList(elt, this);
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    ConsLinkedList.prototype.prependAll = function (elts) {
        var leftToAdd = exports.LinkedList.ofIterable(elts).reverse();
        var result = this;
        while (!leftToAdd.isEmpty()) {
            result = new ConsLinkedList(leftToAdd.value, result);
            leftToAdd = leftToAdd._tail;
        }
        return result;
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    ConsLinkedList.prototype.map = function (mapper) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            result = new ConsLinkedList(mapper(curItem.value), result);
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     *
     *     LinkedList.of(1,2,6).mapOption(x => x%2===0 ?
     *         Option.of(x+1) : Option.none<number>())
     *     => LinkedList.of(3, 7)
     */
    ConsLinkedList.prototype.mapOption = function (mapper) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            var mapped = mapper(curItem.value);
            if (mapped.isSome()) {
                result = new ConsLinkedList(mapped.get(), result);
            }
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    ConsLinkedList.prototype.flatMap = function (mapper) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            result = result.prependAll(mapper(curItem.value).reverse());
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    ConsLinkedList.prototype.allMatch = function (predicate) {
        return this.find(function (x) { return !predicate(x); }).isNone();
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    ConsLinkedList.prototype.anyMatch = function (predicate) {
        return this.find(predicate).isSome();
    };
    ConsLinkedList.prototype.filter = function (predicate) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            if (predicate(curItem.value)) {
                result = new ConsLinkedList(curItem.value, result);
            }
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     *     const activityOrder = ["Writer", "Actor", "Director"];
     *     LinkedList.of({name:"George", activity: "Director"}, {name:"Robert", activity: "Actor"})
     *         .sortBy((p1,p2) => activityOrder.indexOf(p1.activity) - activityOrder.indexOf(p2.activity));
     *     => LinkedList.of({"name":"Robert","activity":"Actor"}, {"name":"George","activity":"Director"})
     *
     * also see [[ConsLinkedList.sortOn]]
     */
    ConsLinkedList.prototype.sortBy = function (compare) {
        return exports.LinkedList.ofIterable(this.toArray().sort(compare));
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     *     LinkedList.of({a:3,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a)
     *     => LinkedList.of({a:1,b:"test"},{a:2,b:"a"},{a:3,b:"b"})
     *
     * You can also sort by multiple criteria, and request 'descending'
     * sorting:
     *
     *     LinkedList.of({a:1,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a,{desc:elt=>elt.b})
     *     => LinkedList.of({a:1,b:"test"},{a:1,b:"b"},{a:2,b:"a"})
     *
     * also see [[ConsLinkedList.sortBy]]
     */
    ConsLinkedList.prototype.sortOn = function () {
        var getKeys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            getKeys[_i] = arguments[_i];
        }
        return SeqHelpers.sortOn(this, getKeys);
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     LinkedList.of(1,1,2,3,2,3,1).distinctBy(x => x)
     *     => LinkedList.of(1,2,3)
     */
    ConsLinkedList.prototype.distinctBy = function (keyExtractor) {
        return SeqHelpers.distinctBy(this, keyExtractor);
    };
    /**
     * Call a function for element in the collection.
     */
    ConsLinkedList.prototype.forEach = function (fn) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            fn(curItem.value);
            curItem = curItem._tail;
        }
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    ConsLinkedList.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.minOn]]
     */
    ConsLinkedList.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     *     LinkedList.of({name:"Joe", age:12}, {name:"Paula", age:6}).minOn(x=>x.age)
     *     => Option.of({name:"Paula", age:6})
     *
     * also see [[ConsLinkedList.minBy]]
     */
    ConsLinkedList.prototype.minOn = function (getOrderable) {
        return SeqHelpers.minOn(this, getOrderable);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     *     LinkedList.of({name:"Joe", age:12}, {name:"Paula", age:6}).maxOn(x=>x.age)
     *     => Option.of({name:"Joe", age:12})
     *
     * also see [[ConsLinkedList.maxOn]]
     */
    ConsLinkedList.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.maxBy]]
     */
    ConsLinkedList.prototype.maxOn = function (getOrderable) {
        return SeqHelpers.maxOn(this, getOrderable);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     *
     *     LinkedList.of(1,2,3).sumOn(x=>x)
     *     => 6
     */
    ConsLinkedList.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     LinkedList.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(LinkedList.of(1,2,3), LinkedList.of(4,5,6), LinkedList.of(7,8))
     */
    ConsLinkedList.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     *
     *     LinkedList.of(1,2,3).scanLeft(0, (soFar,cur)=>soFar+cur)
     *     => LinkedList.of(0,1,3,6)
     */
    ConsLinkedList.prototype.scanLeft = function (init, fn) {
        var result = exports.LinkedList.of(init);
        var curItem = this;
        var soFar = init;
        while (!curItem.isEmpty()) {
            soFar = fn(soFar, curItem.value);
            result = new ConsLinkedList(soFar, result);
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The first element of the result is the final cumulative result.
     *
     *     LinkedList.of(1,2,3).scanRight(0, (cur,soFar)=>soFar+cur)
     *     => LinkedList.of(6,5,3,0)
     */
    ConsLinkedList.prototype.scanRight = function (init, fn) {
        var result = exports.LinkedList.of(init);
        var curItem = this.reverse();
        var soFar = init;
        while (!curItem.isEmpty()) {
            soFar = fn(curItem.value, soFar);
            result = new ConsLinkedList(soFar, result);
            curItem = curItem._tail;
        }
        return result;
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     LinkedList.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    ConsLinkedList.prototype.mkString = function (separator) {
        var r = "";
        var curItem = this;
        var isNotFirst = false;
        while (!curItem.isEmpty()) {
            if (isNotFirst) {
                r += separator;
            }
            r += SeqHelpers.toStringHelper(curItem.value, { quoteStrings: false });
            curItem = curItem._tail;
            isNotFirst = true;
        }
        return r;
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    ConsLinkedList.prototype.toArray = function () {
        var r = [];
        var curItem = this;
        while (!curItem.isEmpty()) {
            r.push(curItem.value);
            curItem = curItem._tail;
        }
        return r;
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    ConsLinkedList.prototype.toVector = function () {
        return Vector_1.Vector.ofIterable(this.toArray());
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     *
     *     LinkedList.of(1,2,3).toMap(x=>[x.toString(), x])
     *     => HashMap.of(["1",1], ["2",2], ["3",3])
     */
    ConsLinkedList.prototype.toMap = function (converter) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, cur) {
            var converted = converter(cur);
            return acc.put(converted[0], converted[1]);
        });
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     LinkedList.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    ConsLinkedList.prototype.toSet = function (converter) {
        return this.foldLeft(HashSet_1.HashSet.empty(), function (acc, cur) {
            return acc.add(converter(cur));
        });
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    ConsLinkedList.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    ConsLinkedList.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other.tail) {
            return false;
        }
        Contract_1.contractTrueEquality("LinkedList.equals", this, other);
        var myVal = this;
        var hisVal = other;
        while (true) {
            if (myVal.isEmpty() !== hisVal.isEmpty()) {
                return false;
            }
            if (myVal.isEmpty()) {
                // they are both empty, end of the stream
                return true;
            }
            var myHead = myVal.value;
            var hisHead = hisVal.value;
            if ((myHead === undefined) !== (hisHead === undefined)) {
                return false;
            }
            if (myHead === undefined || hisHead === undefined) {
                // they are both undefined, the || is for TS's flow analysis
                // so he realizes none of them is undefined after this.
                continue;
            }
            if (!Comparison_1.areEqual(myHead, hisHead)) {
                return false;
            }
            myVal = myVal._tail;
            hisVal = hisVal._tail;
        }
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    ConsLinkedList.prototype.hashCode = function () {
        var hash = 1;
        var curItem = this;
        while (!curItem.isEmpty()) {
            hash = 31 * hash + Comparison_1.getHashCode(curItem.value);
            curItem = curItem._tail;
        }
        return hash;
    };
    ConsLinkedList.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     *
     * Also see [[ConsLinkedList.mkString]]
     */
    ConsLinkedList.prototype.toString = function () {
        var curItem = this;
        var result = "LinkedList(";
        while (!curItem.isEmpty()) {
            result += SeqHelpers.toStringHelper(curItem.value);
            var tail = curItem._tail;
            curItem = tail;
            if (!curItem.isEmpty()) {
                result += ", ";
            }
        }
        return result + ")";
    };
    return ConsLinkedList;
}());
exports.ConsLinkedList = ConsLinkedList;
var emptyLinkedList = new EmptyLinkedList();

},{"./Comparison":1,"./Contract":2,"./HashMap":6,"./HashSet":7,"./Option":11,"./SeqHelpers":13,"./Value":16,"./Vector":17}],11:[function(require,module,exports){
"use strict";
/**
 * The [[Option]] type expresses that a value may be present or not.
 * The code is organized through the class [[None]] (value not
 * present), the class [[Some]] (value present), and the type alias
 * [[Option]] (Some or None).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[OptionStatic]] and are accessed through the global constant Option.
 *
 * Examples:
 *
 *     Option.of(5);
 *     Option.none<number>();
 *     Option.of(5).map(x => x*2);
 *
 * To get the value out of an option, you can use [[Some.getOrThrow]],
 * or [[Some.get]]. The latter is available if you've checked that you
 * indeed have a some, for example:
 *
 *     const opt = Option.of(5);
 *     if (opt.isSome()) {
 *         opt.get();
 *     }
 *
 * You also have other options like [[Some.getOrElse]], [[Some.getOrUndefined]]
 * and so on. [[Some]] and [[None]] have the same methods, except that
 * Some has the extra [[Some.get]] method that [[None]] doesn't have.
 */
exports.__esModule = true;
var Value_1 = require("./Value");
var Vector_1 = require("./Vector");
var Either_1 = require("./Either");
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var Contract_1 = require("./Contract");
/**
 * Holds the "static methods" for [[Option]]
 */
var OptionStatic = /** @class */ (function () {
    function OptionStatic() {
    }
    /**
     * Builds an optional value.
     * * T is wrapped in a [[Some]]
     * * undefined becomes a [[None]]
     * * null becomes a [[Some]].
     *
     *     Option.of(5).isSome()
     *     => true
     *
     *     Option.of(undefined).isSome()
     *     => false
     *
     *     Option.of(null).isSome()
     *     => true
     *
     * Also see [[OptionStatic.some]], [[OptionStatic.ofNullable]]
     */
    OptionStatic.prototype.of = function (v) {
        return (v === undefined) ? exports.none : new Some(v);
    };
    /**
     * Build an optional value from a nullable.
     * * T is wrapped in a [[Some]]
     * * undefined becomes a [[None]]
     * * null becomes a [[None]].
     *
     *     Option.ofNullable(5).isSome()
     *     => true
     *
     *     Option.ofNullable(undefined).isSome()
     *     => false
     *
     *     Option.ofNullable(null).isSome()
     *     => false
     *
     * Also see [[OptionStatic.some]], [[OptionStatic.of]]
     */
    OptionStatic.prototype.ofNullable = function (v) {
        return (v !== undefined && v !== null) ? new Some(v) : exports.none;
    };
    /**
     * Build a [[Some]], unlike [[OptionStatic.of]], which may build a [[Some]]
     * or a [[None]].
     * Will throw if given undefined.
     *
     *     Option.some(5).isSome()
     *     => true
     *
     *     Option.some(undefined).isSome()
     *     => throws
     *
     *     Option.some(null).isSome()
     *     => true
     *
     * Also see [[OptionStatic.of]], [[OptionStatic.ofNullable]]
     */
    OptionStatic.prototype.some = function (v) {
        // the reason I decided to add a some in addition to 'of'
        // instead of making 'of' smarter (which is possible in
        // typescript, see https://github.com/bcherny/tsoption)
        // is that sometimes you really want an Option, not a Some.
        // for instance you can't mix an a Some and an Option in a list
        // if you put the Some first, without calling asOption().
        if (typeof v === "undefined") {
            throw "Option.some got undefined!";
        }
        return new Some(v);
    };
    /**
     * The optional value expressing a missing value.
     */
    OptionStatic.prototype.none = function () {
        return exports.none;
    };
    /**
     * Curried type guard for Option
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(Option.of(2), Option.none<number>())
     *         .filter(Option.isSome)
     *         .map(o => o.get())
     *     => Vector.of(2)
     */
    OptionStatic.prototype.isSome = function (o) {
        return o.isSome();
    };
    /**
     * Curried type guard for Option
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(Option.of(2), Option.none<number>())
     *         .filter(Option.isNone)
     *     => Vector.of(Option.none<number>())
     */
    OptionStatic.prototype.isNone = function (o) {
        return o.isNone();
    };
    /**
     * Turns a list of options in an option containing a list of items.
     * Useful in many contexts.
     *
     *     Option.sequence(Vector.of(Option.of(1),Option.of(2)))
     *     => Option.of(Vector.of(1,2))
     *
     * But if a single element is None, everything is discarded:
     *
     *     Option.sequence(Vector.of(Option.of(1), Option.none()))
     *     => Option.none()
     *
     * Also see [[OptionStatic.traverse]]
     */
    OptionStatic.prototype.sequence = function (elts) {
        return exports.Option.traverse(elts, function (x) { return x; });
    };
    /**
     * Takes a list, a function that can transform list elements
     * to options, then return an option containing a list of
     * the transformed elements.
     *
     *     const getUserById: (x:number)=>Option<string> = x => x > 0 ?
     *         Option.of("user" + x.toString()) : Option.none();
     *     Option.traverse([4, 3, 2], getUserById);
     *     => Option.of(Vector.of("user4", "user3", "user2"))
     *
     * But if a single element results in None, everything is discarded:
     *
     *     const getUserById: (x:number)=>Option<string> = x => x > 0 ?
     *         Option.of("user" + x.toString()) : Option.none();
     *     Option.traverse([4, -3, 2], getUserById);
     *     => Option.none()
     *
     * Also see [[OptionStatic.sequence]]
     */
    OptionStatic.prototype.traverse = function (elts, fn) {
        var r = Vector_1.Vector.empty();
        var iterator = elts[Symbol.iterator]();
        var curItem = iterator.next();
        while (!curItem.done) {
            var v = fn(curItem.value);
            if (v.isNone()) {
                return exports.none;
            }
            r = r.append(v.get());
            curItem = iterator.next();
        }
        return exports.Option.of(r);
    };
    /**
     * Applicative lifting for Option.
     * Takes a function which operates on basic values, and turns it
     * in a function that operates on options of these values ('lifts'
     * the function). The 2 is because it works on functions taking two
     * parameters.
     *
     *     const lifted = Option.liftA2((x:number,y:number) => x+y);
     *     lifted(Option.of(5), Option.of(6));
     *     => Option.of(11)
     *
     *     const lifted2 = Option.liftA2((x:number,y:number) => x+y);
     *     lifted2(Option.of(5), Option.none<number>());
     *     => Option.none()
     *
     * @param T the first option type
     * @param U the second option type
     * @param V the new type as returned by the combining function.
     */
    OptionStatic.prototype.liftA2 = function (fn) {
        return function (p1, p2) { return p1.flatMap(function (a1) { return p2.map(function (a2) { return fn(a1, a2); }); }); };
    };
    /**
     * Applicative lifting for Option. 'p' stands for 'properties'.
     *
     * Takes a function which operates on a simple JS object, and turns it
     * in a function that operates on the same JS object type except which each field
     * wrapped in an Option ('lifts' the function).
     * It's an alternative to [[OptionStatic.liftA2]] when the number of parameters
     * is not two.
     *
     *     const lifted = Option.liftAp((x:{a:number,b:number,c:number}) => x.a+x.b+x.c);
     *     lifted({a:Option.of(5), b:Option.of(6), c:Option.of(3)});
     *     => Option.of(14)
     *
     *     const lifted = Option.liftAp((x:{a:number,b:number}) => x.a+x.b);
     *     lifted({a:Option.of(5), b:Option.none<number>()});
     *     => Option.none()
     *
     * @param A the object property type specifying the parameters for your function
     * @param B the type returned by your function, returned wrapped in an option by liftAp.
     */
    OptionStatic.prototype.liftAp = function (fn) {
        return function (x) {
            var copy = {};
            for (var p in x) {
                if (x[p].isNone()) {
                    return exports.Option.none();
                }
                copy[p] = x[p].getOrThrow();
            }
            return exports.Option.of(fn(copy));
        };
    };
    /**
     * Take a partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     const plus = Option.lift((x:number,y:number)=>x+y);
     *     plus(1,2);
     *     => Option.of(3)
     *
     *     const undef = Option.lift((x:number)=>undefined);
     *     undef(1);
     *     => Option.none()
     *
     *     const nl = Option.lift((x:number,y:number,z:number)=>null);
     *     nl(1,2,3);
     *     => Option.some(null)
     *
     *     const throws = Option.lift((x:number,y:number)=>{throw "x"});
     *     throws(1,2);
     *     => Option.none()
     */
    OptionStatic.prototype.lift = function (fn) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                return exports.Option.of(fn.apply(void 0, args));
            }
            catch (_a) {
                return exports.Option.none();
            }
        };
    };
    /**
     * Take a partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     const plus = Option.liftNullable((x:number,y:number)=>x+y);
     *     plus(1,2);
     *     => Option.of(3)
     *
     *     const undef = Option.liftNullable((x:number,y:number,z:string)=>undefined);
     *     undef(1,2,"");
     *     => Option.none()
     *
     *     const nl = Option.liftNullable((x:number)=>null);
     *     nl(1);
     *     => Option.none()
     *
     *     const throws = Option.liftNullable((x:number,y:number)=>{throw "x"});
     *     throws(1,2);
     *     => Option.none()
     */
    OptionStatic.prototype.liftNullable = function (fn) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                return exports.Option.ofNullable(fn.apply(void 0, args));
            }
            catch (_a) {
                return exports.Option.none();
            }
        };
    };
    /**
     * Take a no-parameter partial function (may return undefined or throw),
     * and call it, return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     Option.try_(Math.random);
     *     => Option.of(0.49884723907769635)
     *
     *     Option.try_(()=>undefined);
     *     => Option.none()
     *
     *     Option.try_(()=>null);
     *     => Option.of(null)
     *
     *     Option.try_(()=>{throw "x"});
     *     => Option.none()
     *
     * Also see [[OptionStatic.tryNullable]], [[OptionStatic.lift]],
     * [[OptionStatic.liftNullable]], [[EitherStatic.try_]].
     */
    OptionStatic.prototype.try_ = function (fn) {
        return exports.Option.lift(fn)();
    };
    /**
     * Take a no-parameter partial function (may return null, undefined or throw),
     * and call it, return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     Option.tryNullable(Math.random);
     *     => Option.of(0.49884723907769635)
     *
     *     Option.tryNullable(()=>undefined);
     *     => Option.none()
     *
     *     Option.tryNullable(()=>null);
     *     => Option.none()
     *
     *     Option.tryNullable(()=>{throw "x"});
     *     => Option.none()
     *
     * Also see [[OptionStatic.try_]], [[OptionStatic.liftNullable]],
     * [[OptionStatic.lift]], [[EitherStatic.try_]].
     */
    OptionStatic.prototype.tryNullable = function (fn) {
        return exports.Option.liftNullable(fn)();
    };
    return OptionStatic;
}());
exports.OptionStatic = OptionStatic;
/**
 * The Option constant allows to call the option "static" methods
 */
exports.Option = new OptionStatic();
function optionHasTrueEquality(opt) {
    return opt.flatMap(function (x) { return (x && x.hasTrueEquality) ?
        exports.Option.of(x.hasTrueEquality()) :
        Comparison_1.hasTrueEquality(x); })
        .getOrElse(true);
}
/**
 * Some represents an [[Option]] with a value.
 * "static methods" available through [[OptionStatic]]
 *
 * [[Some]] and [[None]] have the same methods, except that
 * Some has the extra [[Some.get]] method that [[None]] doesn't have.
 * @param T the item type
 */
var Some = /** @class */ (function () {
    /**
     * @hidden
     */
    function Some(value) {
        this.value = value;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns true since this is a Some (contains a value)
     */
    Some.prototype.isSome = function () {
        return true;
    };
    /**
     * Returns false since this is a Some (contains a value)
     */
    Some.prototype.isNone = function () {
        return false;
    };
    /**
     * View this Some a as Option. Useful to help typescript type
     * inference sometimes.
     */
    Some.prototype.asOption = function () {
        return this;
    };
    /**
     * Get the value contained in this option.
     * NOTE: we know it's there, since this method
     * belongs to Some, not Option.
     */
    Some.prototype.get = function () {
        return this.value;
    };
    /**
     * Combines two options. If this option is a Some, returns it.
     * If it's a None, returns the other one.
     */
    Some.prototype.orElse = function (other) {
        return this;
    };
    /**
     * Get the value from this option if it's a Some, otherwise
     * throw an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Some.prototype.getOrThrow = function (errorInfo) {
        return this.value;
    };
    /**
     * Returns true if the option is a Some and contains the
     * value you give, false otherwise.
     */
    Some.prototype.contains = function (v) {
        return v === this.value;
    };
    /**
     * Get the value contained in the option if it's a Some,
     * return undefined if it's a None.
     *
     *     Option.of(5).getOrUndefined()
     *     => 5
     *
     *     Option.none<number>().getOrUndefined()
     *     => undefined
     */
    Some.prototype.getOrUndefined = function () {
        return this.value;
    };
    /**
     * Get the value contained in the option if it's a Some,
     * return null if it's a None.
     *
     *     Option.of(5).getOrNull()
     *     => 5
     *
     *     Option.none<number>().getOrNull()
     *     => null
     */
    Some.prototype.getOrNull = function () {
        return this.value;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the default value that you give.
     */
    Some.prototype.getOrElse = function (alt) {
        return this.value;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the value returned by the function that you give.
     *
     *     Option.of(5).getOrCall(() => 6)
     *     => 5
     *
     *     Option.none<number>().getOrCall(() => 6)
     *     => 6
     */
    Some.prototype.getOrCall = function (fn) {
        return this.value;
    };
    /**
     * Return a new option where the element (if present) was transformed
     * by the mapper function you give. If the option was None it'll stay None.
     *
     *     Option.of(5).map(x => x*2)
     *     => Option.of(10)
     *
     *     Option.of(5).map(x => null)
     *     => Option.of(null)
     *
     * Also see [[Some.mapNullable]], [[Some.flatMap]]
     */
    Some.prototype.map = function (fn) {
        return exports.Option.of(fn(this.value));
    };
    /**
     * Return a new option where the element (if present) was transformed
     * by the mapper function you give. If the mapped value is `null` or
     * `undefined`, then a Some will turn into a None.
     * If the option was None it'll stay None.
     *
     *     Option.of(5).mapNullable(x => x*2)
     *     => Option.of(10)
     *
     *     Option.of(5).mapNullable(x => null)
     *     => Option.none()
     *
     * Also see [[Some.map]], [[Some.flatMap]]
     */
    Some.prototype.mapNullable = function (fn) {
        return exports.Option.ofNullable(fn(this.value));
    };
    /**
     * If this is a Some, calls the function you give on
     * the item in the option and return its result.
     * If the option is a None, return none.
     * This is the monadic bind.
     */
    Some.prototype.flatMap = function (mapper) {
        return mapper(this.value);
    };
    Some.prototype.filter = function (fn) {
        return fn(this.value) ? this : exports.Option.none();
    };
    /**
     * Execute a side-effecting function if the option
     * is a Some; returns the option.
     */
    Some.prototype.ifSome = function (fn) {
        fn(this.value);
        return this;
    };
    /**
     * Execute a side-effecting function if the option
     * is a None; returns the option.
     */
    Some.prototype.ifNone = function (fn) {
        return this;
    };
    /**
     * Handle both branches of the option and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for option.
     *
     *     Option.of(5).match({
     *         Some: x  => "got " + x,
     *         None: () => "got nothing!"
     *     });
     *     => "got 5"
     */
    Some.prototype.match = function (cases) {
        return cases.Some(this.value);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Some.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Convert to a vector. If it's a None, it's the empty
     * vector, if it's a Some, it's a one-element vector with
     * the contents of the option.
     */
    Some.prototype.toVector = function () {
        return Vector_1.Vector.of(this.value);
    };
    /**
     * Convert to an either. You must provide a left value
     * in case this is a None.
     */
    Some.prototype.toEither = function (left) {
        return Either_1.Either.right(this.value);
    };
    /**
     * If this is a Some, return this object.
     * If this is a None, return the result of the function.
     */
    Some.prototype.orCall = function (_) {
        return this;
    };
    Some.prototype.hasTrueEquality = function () {
        return optionHasTrueEquality(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Some.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        // the .isSome doesn't test if it's a Some, but
        // if the object has a field called isSome.
        if (other === exports.none || !other || !other.isSome) {
            return false;
        }
        var someOther = other;
        Contract_1.contractTrueEquality("Option.equals", this, someOther);
        return Comparison_1.areEqual(this.value, someOther.value);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Some.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this.value);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Some.prototype.toString = function () {
        return "Some(" + SeqHelpers_1.toStringHelper(this.value) + ")";
    };
    /**
     * Used by the node REPL to display values.
     */
    Some.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    return Some;
}());
exports.Some = Some;
/**
 * None represents an [[Option]] without value.
 * "static methods" available through [[OptionStatic]]
 *
 * [[Some]] and [[None]] have the same methods, except that
 * Some has the extra [[Some.get]] method that [[None]] doesn't have.
 * @param T the item type
 */
var None = /** @class */ (function () {
    function None() {
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns false since this is a None (doesn'tcontains a value)
     */
    None.prototype.isSome = function () {
        return false;
    };
    /**
     * Returns true since this is a None (doesn'tcontains a value)
     */
    None.prototype.isNone = function () {
        return true;
    };
    /**
     * View this Some a as Option. Useful to help typescript type
     * inference sometimes.
     */
    None.prototype.asOption = function () {
        return this;
    };
    /**
     * Combines two options. If this option is a Some, returns it.
     * If it's a None, returns the other one.
     */
    None.prototype.orElse = function (other) {
        return other;
    };
    /**
     * Get the value from this option if it's a Some, otherwise
     * throw an exception.
     * You can optionally pass a message that'll be used as the
     * exception message, or an Error object.
     */
    None.prototype.getOrThrow = function (errorInfo) {
        if (typeof errorInfo === 'string') {
            throw new Error(errorInfo || "getOrThrow called on none!");
        }
        throw errorInfo || new Error("getOrThrow called on none!");
    };
    /**
     * Returns true if the option is a Some and contains the
     * value you give, false otherwise.
     */
    None.prototype.contains = function (v) {
        return false;
    };
    /**
     * Get the value contained in the option if it's a Some,
     * return undefined if it's a None.
     *
     *     Option.of(5).getOrUndefined()
     *     => 5
     *
     *     Option.none<number>().getOrUndefined()
     *     => undefined
     */
    None.prototype.getOrUndefined = function () {
        return undefined;
    };
    /**
     * Get the value contained in the option if it's a Some,
     * return null if it's a None.
     *
     *     Option.of(5).getOrNull()
     *     => 5
     *
     *     Option.none<number>().getOrNull()
     *     => null
     */
    None.prototype.getOrNull = function () {
        return null;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the default value that you give.
     */
    None.prototype.getOrElse = function (alt) {
        return alt;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the value returned by the function that you give.
     *
     *     Option.of(5).getOrCall(() => 6)
     *     => 5
     *
     *     Option.none<number>().getOrCall(() => 6)
     *     => 6
     */
    None.prototype.getOrCall = function (fn) {
        return fn();
    };
    /**
     * Return a new option where the element (if present) was transformed
     * by the mapper function you give. If the option was None it'll stay None.
     *
     *     Option.of(5).map(x => x*2)
     *     => Option.of(10)
     *
     *     Option.of(5).map(x => null)
     *     => Option.of(null)
     *
     * Also see [[None.mapNullable]], [[None.flatMap]]
     */
    None.prototype.map = function (fn) {
        return exports.none;
    };
    /**
     * Return a new option where the element (if present) was transformed
     * by the mapper function you give. If the mapped value is `null` or
     * `undefined`, then a Some will turn into a None.
     * If the option was None it'll stay None.
     *
     *     Option.of(5).mapNullable(x => x*2)
     *     => Option.of(10)
     *
     *     Option.of(5).mapNullable(x => null)
     *     => Option.none()
     *
     * Also see [[None.map]], [[None.flatMap]]
     */
    None.prototype.mapNullable = function (fn) {
        return exports.none;
    };
    /**
     * If this is a Some, calls the function you give on
     * the item in the option and return its result.
     * If the option is a None, return none.
     * This is the monadic bind.
     */
    None.prototype.flatMap = function (mapper) {
        return exports.none;
    };
    None.prototype.filter = function (fn) {
        return exports.none;
    };
    /**
     * Execute a side-effecting function if the option
     * is a Some; returns the option.
     */
    None.prototype.ifSome = function (fn) {
        return this;
    };
    /**
     * Execute a side-effecting function if the option
     * is a Some; returns the option.
     */
    None.prototype.ifNone = function (fn) {
        fn();
        return this;
    };
    /**
     * Handle both branches of the option and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for option.
     *
     *     Option.of(5).match({
     *         Some: x  => "got " + x,
     *         None: () => "got nothing!"
     *     });
     *     => "got 5"
     */
    None.prototype.match = function (cases) {
        return cases.None();
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    None.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Convert to a vector. If it's a None, it's the empty
     * vector, if it's a Some, it's a one-element vector with
     * the contents of the option.
     */
    None.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert to an either. You must provide a left value
     * in case this is a None.
     */
    None.prototype.toEither = function (left) {
        return Either_1.Either.left(left);
    };
    /**
     * If this is a Some, return this object.
     * If this is a None, return the result of the function.
     */
    None.prototype.orCall = function (fn) {
        return fn();
    };
    None.prototype.hasTrueEquality = function () {
        return optionHasTrueEquality(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    None.prototype.equals = function (other) {
        return other === exports.none;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    None.prototype.hashCode = function () {
        return 1;
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    None.prototype.toString = function () {
        return "None()";
    };
    /**
     * Used by the node REPL to display values.
     */
    None.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    return None;
}());
exports.None = None;
/**
 * @hidden
 */
exports.none = new None();

},{"./Comparison":1,"./Contract":2,"./Either":3,"./SeqHelpers":13,"./Value":16,"./Vector":17}],12:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * A predicate is a function taking one parameter and returning a boolean.
 * In other words the predicate checks whether some proposition holds for the parameter.
 *
 * The Predicate interface offers normal function-calling, to make sure that the
 * predicate holds (just call predicate(x)), but also some helper methods to
 * deal with logical operations between propositions.
 *
 * You can build predicates using [[PredicateStatic]] through the
 * 'Predicate' global constant.
 *
 * Examples:
 *
 *     const check = Predicate.of((x: number) => x > 10).and(x => x < 20);
 *     check(12); // => true
 *     check(21);
 *     => false
 *
 *     Vector.of(1,2,3,4,5).filter(
 *         Predicate.isIn([2,3]).negate())
 *     => Vector.of(1, 4, 5)
 */
var Comparison_1 = require("./Comparison");
var Vector_1 = require("./Vector");
/**
 * The Predicates class offers some helper functions to deal
 * with [[Predicate]] including the ability to build [[Predicate]]
 * from functions using [[PredicateStatic.of]], some builtin predicates
 * like [[PredicateStatic.isIn]], and the ability to combine to combine
 * Predicates like with [[PredicateStatic.allOf]].
 */
var PredicateStatic = /** @class */ (function () {
    function PredicateStatic() {
    }
    /**
     * Take a predicate function and of it to become a [[Predicate]]
     * (enabling you to call [[Predicate.and]], and other logic operations on it)
     */
    PredicateStatic.prototype.of = function (fn) {
        var r = fn;
        r.and = function (other) { return exports.Predicate.of(function (x) { return r(x) && other(x); }); };
        r.or = function (other) { return exports.Predicate.of(function (x) { return r(x) || other(x); }); };
        r.negate = function () { return exports.Predicate.of(function (x) { return !fn(x); }); };
        return r;
    };
    /**
     * Return a [[Predicate]] checking whether a value is equal to the
     * value you give as parameter.
     */
    PredicateStatic.prototype.equals = function (other) {
        return exports.Predicate.of(function (x) { return Comparison_1.areEqual(other, x); });
    };
    /**
     * Return a [[Predicate]] checking whether a value is contained in the
     * list of values you give as parameter.
     */
    PredicateStatic.prototype.isIn = function (others) {
        return exports.Predicate.of(function (x) { return Vector_1.Vector.ofIterable(others).contains(x); });
    };
    /**
     * Return a [[Predicate]] checking whether all of the predicate functions given hold
     */
    PredicateStatic.prototype.allOf = function () {
        var predicates = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            predicates[_i] = arguments[_i];
        }
        return exports.Predicate.of(function (x) { return Vector_1.Vector.ofIterable(predicates).allMatch(function (p) { return p(x); }); });
    };
    /**
     * Return a [[Predicate]] checking whether any of the predicate functions given hold
     */
    PredicateStatic.prototype.anyOf = function () {
        var predicates = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            predicates[_i] = arguments[_i];
        }
        return exports.Predicate.of(function (x) { return Vector_1.Vector.ofIterable(predicates).anyMatch(function (p) { return p(x); }); });
    };
    /**
     * Return a [[Predicate]] checking whether none of the predicate functions given hold
     */
    PredicateStatic.prototype.noneOf = function () {
        var predicates = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            predicates[_i] = arguments[_i];
        }
        return exports.Predicate.of(function (x) { return !Vector_1.Vector.ofIterable(predicates).anyMatch(function (p) { return p(x); }); });
    };
    return PredicateStatic;
}());
exports.PredicateStatic = PredicateStatic;
/**
 * The Predicate constant allows to call the [[Predicate]] "static" methods.
 */
exports.Predicate = new PredicateStatic();

},{"./Comparison":1,"./Vector":17}],13:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Option_1 = require("./Option");
var Stream_1 = require("./Stream");
var Lazy_1 = require("./Lazy");
var HashSet_1 = require("./HashSet");
/**
 * @hidden
 */
function shuffle(array) {
    // https://stackoverflow.com/a/2450976/516188
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
exports.shuffle = shuffle;
/**
 * @hidden
 */
function arrangeBy(collection, getKey) {
    return Option_1.Option.of(collection.groupBy(getKey).mapValues(function (v) { return v.single(); }))
        .filter(function (map) { return !map.anyMatch(function (k, v) { return v.isNone(); }); })
        .map(function (map) { return map.mapValues(function (v) { return v.getOrThrow(); }); });
}
exports.arrangeBy = arrangeBy;
/**
 * @hidden
 */
function seqHasTrueEquality(seq) {
    return seq.find(function (x) { return x != null; }).hasTrueEquality();
}
exports.seqHasTrueEquality = seqHasTrueEquality;
/**
 * @hidden
 */
function zipWithIndex(seq) {
    return seq.zip(Stream_1.Stream.iterate(0, function (i) { return i + 1; }));
}
exports.zipWithIndex = zipWithIndex;
/**
 * @hidden
 */
function sortOn(seq, getKeys) {
    return seq.sortBy(function (x, y) {
        for (var _i = 0, getKeys_1 = getKeys; _i < getKeys_1.length; _i++) {
            var getKey = getKeys_1[_i];
            if (getKey.desc) {
                var a = getKey.desc(x);
                var b = getKey.desc(y);
                if (a === b) {
                    continue;
                }
                return a < b ? 1 /* GT */ : -1 /* LT */;
            }
            else {
                var a = getKey(x);
                var b = getKey(y);
                if (a === b) {
                    continue;
                }
                return a > b ? 1 /* GT */ : -1 /* LT */;
            }
        }
        return 0 /* EQ */;
    });
}
exports.sortOn = sortOn;
/**
 * @hidden
 */
function distinctBy(seq, keyExtractor) {
    var knownKeys = HashSet_1.HashSet.empty();
    return seq.filter(function (x) {
        var key = keyExtractor(x);
        var r = knownKeys.contains(key);
        if (!r) {
            knownKeys = knownKeys.add(key);
        }
        return !r;
    });
}
exports.distinctBy = distinctBy;
/**
 * Utility function to help converting a value to string
 * util.inspect seems to depend on node.
 * @hidden
 */
function toStringHelper(obj, options) {
    if (options === void 0) { options = { quoteStrings: true }; }
    if (Array.isArray(obj)) {
        return "[" + obj.map(function (o) { return toStringHelper(o, options); }) + "]";
    }
    if (typeof obj === "string") {
        return options.quoteStrings ? "'" + obj + "'" : obj;
    }
    if (obj && (obj.toString !== Object.prototype.toString)) {
        return obj.toString();
    }
    // We used to use JSON.stringify here, but that will
    // throw an exception if there are cycles, which we
    // absolutely don't want!
    // https://stackoverflow.com/a/48254637/516188
    var customStringify = function (v) {
        var cache = new Set();
        return JSON.stringify(v, function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our set
                cache.add(value);
            }
            return value;
        });
    };
    return customStringify(obj);
}
exports.toStringHelper = toStringHelper;
/**
 * @hidden
 */
function minBy(coll, compare) {
    return coll.reduce(function (v1, v2) { return compare(v1, v2) < 0 ? v2 : v1; });
}
exports.minBy = minBy;
/**
 * @hidden
 */
function minOn(coll, getSortable) {
    if (coll.isEmpty()) {
        return Option_1.Option.none();
    }
    var iter = coll[Symbol.iterator]();
    var step = iter.next();
    var val = getSortable(step.value);
    var result = step.value;
    while (!(step = iter.next()).done) {
        var curVal = getSortable(step.value);
        if (curVal < val) {
            val = curVal;
            result = step.value;
        }
    }
    return Option_1.Option.of(result);
}
exports.minOn = minOn;
/**
 * @hidden
 */
function maxBy(coll, compare) {
    return coll.reduce(function (v1, v2) { return compare(v1, v2) > 0 ? v2 : v1; });
}
exports.maxBy = maxBy;
/**
 * @hidden
 */
function maxOn(coll, getSortable) {
    if (coll.isEmpty()) {
        return Option_1.Option.none();
    }
    var iter = coll[Symbol.iterator]();
    var step = iter.next();
    var val = getSortable(step.value);
    var result = step.value;
    while (!(step = iter.next()).done) {
        var curVal = getSortable(step.value);
        if (curVal > val) {
            val = curVal;
            result = step.value;
        }
    }
    return Option_1.Option.of(result);
}
exports.maxOn = maxOn;
/**
 * @hidden
 */
function sumOn(coll, getNumber) {
    return coll.foldLeft(0, function (soFar, cur) { return soFar + getNumber(cur); });
}
exports.sumOn = sumOn;
/**
 * @hidden
 */
function reduce(coll, combine) {
    if (coll.isEmpty()) {
        return Option_1.Option.none();
    }
    var iter = coll[Symbol.iterator]();
    var step = iter.next();
    var result = step.value;
    while (!(step = iter.next()).done) {
        result = combine(result, step.value);
    }
    return Option_1.Option.of(result);
}
exports.reduce = reduce;
/**
 * @hidden
 */
function sliding(seq, count) {
    // in a way should get better performance with Seq.splitAt instead
    // of Seq.take+Seq.drop, but we should be lazy and not hold another
    // version of the sequence in memory (though for linked list it's free,
    // it's not the case for Vector)
    return seq.isEmpty() ?
        Stream_1.Stream.empty() :
        new Stream_1.ConsStream(seq.take(count), Lazy_1.Lazy.of(function () { return sliding(seq.drop(count), count); }));
}
exports.sliding = sliding;
/**
 * @hidden
 */
function removeAll(seq, elts) {
    var toRemove = HashSet_1.HashSet.ofIterable(elts);
    // I know T must have equality since the parameter has it and is the same type.
    return seq.filter(function (x) { return !toRemove.contains(x); });
}
exports.removeAll = removeAll;

},{"./HashSet":7,"./Lazy":9,"./Option":11,"./Stream":14}],14:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * A lazy, potentially infinite, sequence of values.
 *
 * The code is organized through the class [[EmptyStream]] (empty list
 * or tail), the class [[ConsStream]] (list value and lazy pointer to next),
 * and the type alias [[Stream]] (empty or cons).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[StreamStatic]] and are accessed through the global constant Stream.
 *
 * Use take() for instance to reduce an infinite stream to a finite one.
 *
 * Examples:
 *
 *     Stream.iterate(1, x => x*2).take(4);
 *     => Stream.of(1,2,4,8)
 *
 *     Stream.continually(Math.random).take(2);
 *     => Stream.of(0.49884723907769635, 0.3226548779864311)
 */
var Option_1 = require("./Option");
var Vector_1 = require("./Vector");
var Comparison_1 = require("./Comparison");
var Contract_1 = require("./Contract");
var Value_1 = require("./Value");
var HashMap_1 = require("./HashMap");
var HashSet_1 = require("./HashSet");
var Lazy_1 = require("./Lazy");
var LinkedList_1 = require("./LinkedList");
var SeqHelpers = require("./SeqHelpers");
/**
 * Holds the "static methods" for [[Stream]]
 */
var StreamStatic = /** @class */ (function () {
    function StreamStatic() {
    }
    /**
     * The empty stream
     */
    StreamStatic.prototype.empty = function () {
        return emptyStream;
    };
    StreamStatic.prototype.of = function () {
        var elts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elts[_i] = arguments[_i];
        }
        return exports.Stream.ofIterable(elts);
    };
    /**
     * Build a stream from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    StreamStatic.prototype.ofIterable = function (elts) {
        // need to eagerly copy the iterable. the reason
        // is, if we would build the stream based on the iterator
        // in the iterable, Stream.tail() would do it.next().
        // but it.next() modifies the iterator (mutability),
        // and you would end up with getting two different tails
        // for the same stream if you call .tail() twice in a row
        if (Array.isArray(elts)) {
            return exports.Stream.ofArray(elts);
        }
        return exports.Stream.ofArray(Array.from(elts));
    };
    /**
     * Curried type guard for Stream.
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(Stream.of(1), Stream.empty<number>())
     *         .filter(Stream.isEmpty)
     *     => Vector.of(Stream.empty<number>())
     */
    StreamStatic.prototype.isEmpty = function (s) {
        return s.isEmpty();
    };
    /**
     * Curried type guard for Stream.
     * Sometimes needed also due to https://github.com/Microsoft/TypeScript/issues/20218
     *
     *     Vector.of(Stream.of(1), Stream.empty<number>())
     *         .filter(Stream.isNotEmpty)
     *         .map(s => s.head().get()+1)
     *     => Vector.of(2)
     */
    StreamStatic.prototype.isNotEmpty = function (s) {
        return !s.isEmpty();
    };
    /**
     * @hidden
     */
    StreamStatic.prototype.ofArray = function (elts) {
        if (elts.length === 0) {
            return emptyStream;
        }
        var head = elts[0];
        return new ConsStream(head, Lazy_1.Lazy.of(function () { return exports.Stream.ofArray(elts.slice(1)); }));
    };
    /**
     * Build an infinite stream from a seed and a transformation function.
     *
     *     Stream.iterate(1, x => x*2).take(4);
     *     => Stream.of(1,2,4,8)
     */
    StreamStatic.prototype.iterate = function (seed, fn) {
        return new ConsStream(seed, Lazy_1.Lazy.of(function () { return exports.Stream.iterate(fn(seed), fn); }));
    };
    /**
     * Build an infinite stream by calling repeatedly a function.
     *
     *     Stream.continually(() => 1).take(4);
     *     => Stream.of(1,1,1,1)
     *
     *     Stream.continually(Math.random).take(2);
     *     => Stream.of(0.49884723907769635, 0.3226548779864311)
     */
    StreamStatic.prototype.continually = function (fn) {
        return new ConsStream(fn(), Lazy_1.Lazy.of(function () { return exports.Stream.continually(fn); }));
    };
    /**
     * Dual to the foldRight function. Build a collection from a seed.
     * Takes a starting element and a function.
     * It applies the function on the starting element; if the
     * function returns None, it stops building the list, if it
     * returns Some of a pair, it adds the first element to the result
     * and takes the second element as a seed to keep going.
     *
     *     Stream.unfoldRight(
     *          10, x=>Option.of(x)
     *              .filter(x => x!==0)
     *              .map<[number,number]>(x => [x,x-1]));
     *     => Stream.of(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
     */
    StreamStatic.prototype.unfoldRight = function (seed, fn) {
        var nextVal = fn(seed);
        if (nextVal.isNone()) {
            return emptyStream;
        }
        return new ConsStream(nextVal.get()[0], Lazy_1.Lazy.of(function () { return exports.Stream.unfoldRight(nextVal.getOrThrow()[1], fn); }));
    };
    /**
     * Combine any number of iterables you give in as
     * parameters to produce a new collection which combines all,
     * in tuples. For instance:
     *
     *     Stream.zip(Stream.of(1,2,3), ["a","b","c"], LinkedList.of(8,9,10))
     *     => Stream.of([1,"a",8], [2,"b",9], [3,"c",10])
     *
     * The result collection will have the length of the shorter
     * of the input iterables. Extra elements will be discarded.
     *
     * Also see the non-static version [[ConsStream.zip]], which only combines two
     * collections.
     * @param A A is the type of the tuple that'll be generated
     *          (`[number,string,number]` for the code sample)
     */
    StreamStatic.prototype.zip = function () {
        var iterables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            iterables[_i] = arguments[_i];
        }
        var iterators = iterables.map(function (i) { return i[Symbol.iterator](); });
        var items = iterators.map(function (i) { return i.next(); });
        if (items.some(function (item) { return item.done; })) {
            return emptyStream;
        }
        return new ConsStream(items.map(function (item) { return item.value; }), Lazy_1.Lazy.of(function () { return exports.Stream.zip.apply(exports.Stream, iterators.map(function (i) {
            var _a;
            return (_a = {}, _a[Symbol.iterator] = function () { return i; }, _a);
        })); }));
    };
    return StreamStatic;
}());
exports.StreamStatic = StreamStatic;
/**
 * The Stream constant allows to call the Stream "static" methods
 */
exports.Stream = new StreamStatic();
/**
 * EmptyStream is the empty stream; every non-empty
 * stream also has a pointer to an empty stream
 * after its last element.
 * "static methods" available through [[StreamStatic]]
 * @param T the item type
 */
var EmptyStream = /** @class */ (function () {
    function EmptyStream() {
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Implementation of the Iterator interface.
     */
    EmptyStream.prototype[Symbol.iterator] = function () {
        return {
            next: function () {
                return {
                    done: true,
                    value: undefined
                };
            }
        };
    };
    /**
     * View this Some a as Stream. Useful to help typescript type
     * inference sometimes.
     */
    EmptyStream.prototype.asStream = function () {
        return this;
    };
    /**
     * @hidden
     */
    EmptyStream.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * Get the length of the collection.
     */
    EmptyStream.prototype.length = function () {
        return 0;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    EmptyStream.prototype.single = function () {
        return Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    EmptyStream.prototype.isEmpty = function () {
        return true;
    };
    /**
     * Get the first value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    EmptyStream.prototype.head = function () {
        return Option_1.Option.none();
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    EmptyStream.prototype.tail = function () {
        return Option_1.Option.none();
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    EmptyStream.prototype.last = function () {
        return Option_1.Option.none();
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on Stream, which is not a good data structure
     * for random access!
     */
    EmptyStream.prototype.get = function (idx) {
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    EmptyStream.prototype.find = function (predicate) {
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    EmptyStream.prototype.contains = function (v) {
        return false;
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    EmptyStream.prototype.take = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    EmptyStream.prototype.takeWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate,
     * but starting from the end of the collection.
     *
     *     Stream.of(1,2,3,4).takeRightWhile(x => x > 2)
     *     => Stream.of(3,4)
     */
    EmptyStream.prototype.takeRightWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyStream.prototype.drop = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    EmptyStream.prototype.dropWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyStream.prototype.dropRight = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the last elements
     * until one element fails the predicate. All elements
     * before that point are retained.
     */
    EmptyStream.prototype.dropRightWhile = function (predicate) {
        return this;
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     Stream.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    EmptyStream.prototype.fold = function (zero, fn) {
        return zero;
    };
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
    EmptyStream.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
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
    EmptyStream.prototype.foldRight = function (zero, fn) {
        return zero;
    };
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Stream.of(1,2,3).zip(["a","b","c"])
     *     => Stream.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     *
     * Also see [[StreamStatic.zip]] (static version which can more than two
     * iterables)
     */
    EmptyStream.prototype.zip = function (other) {
        return emptyStream;
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     Stream.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => Stream.of("a0", "b1")
     */
    EmptyStream.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Reverse the collection. For instance:
     *
     *     Stream.of(1,2,3).reverse();
     *     => Stream.of(3,2,1)
     */
    EmptyStream.prototype.reverse = function () {
        return this;
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    Stream.of(1,2,3,4,5,6).span(x => x <3)
     *    => [Stream.of(1,2), Stream.of(3,4,5,6)]
     */
    EmptyStream.prototype.span = function (predicate) {
        return [this, this];
    };
    /**
     * Split the collection at a specific index.
     *
     *     Stream.of(1,2,3,4,5).splitAt(3)
     *     => [Stream.of(1,2,3), Stream.of(4,5)]
     */
    EmptyStream.prototype.splitAt = function (index) {
        return [this, this];
    };
    EmptyStream.prototype.partition = function (predicate) {
        return [exports.Stream.empty(), exports.Stream.empty()];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsStream.arrangeBy]]
     */
    EmptyStream.prototype.groupBy = function (classifier) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsStream.groupBy]]
     */
    EmptyStream.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    EmptyStream.prototype.shuffle = function () {
        return exports.Stream.ofIterable(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Append an element at the end of this Stream.
     */
    EmptyStream.prototype.append = function (v) {
        return exports.Stream.of(v);
    };
    /*
     * Append multiple elements at the end of this Stream.
     */
    EmptyStream.prototype.appendAll = function (elts) {
        return exports.Stream.ofIterable(elts);
    };
    /**
     * Remove multiple elements from a stream
     *
     *     Stream.of(1,2,3,4,3,2,1).removeAll([2,4])
     *     => Stream.of(1,3,3,1)
     */
    EmptyStream.prototype.removeAll = function (elts) {
        return this;
    };
    /**
     * Removes the first element matching the predicate
     * (use [[ConsStream.filter]] to remove all elements matching a predicate)
     */
    EmptyStream.prototype.removeFirst = function (predicate) {
        return this;
    };
    /*
     * Append another Stream at the end of this Stream.
     *
     * There is no function taking a javascript iterator,
     * because iterators are stateful and Streams lazy.
     * If we would create two Streams working on the same iterator,
     * the streams would interact with one another.
     * It also breaks the cycle() function.
     */
    EmptyStream.prototype.appendStream = function (elts) {
        return elts;
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    EmptyStream.prototype.prepend = function (elt) {
        return exports.Stream.of(elt);
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    EmptyStream.prototype.prependAll = function (elt) {
        return exports.Stream.ofIterable(elt);
    };
    /**
     * Repeat infinitely this Stream.
     * For instance:
     *
     *     Stream.of(1,2,3).cycle().take(8)
     *     => Stream.of(1,2,3,1,2,3,1,2)
     */
    EmptyStream.prototype.cycle = function () {
        return emptyStream;
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    EmptyStream.prototype.map = function (mapper) {
        return emptyStream;
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     *
     *     Stream.of(1,2,6).mapOption(x => x%2===0 ?
     *         Option.of(x+1) : Option.none<number>())
     *     => Stream.of(3, 7)
     */
    EmptyStream.prototype.mapOption = function (mapper) {
        return emptyStream;
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    EmptyStream.prototype.flatMap = function (mapper) {
        return emptyStream;
    };
    EmptyStream.prototype.allMatch = function (predicate) {
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    EmptyStream.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyStream.prototype.filter = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     *     const activityOrder = ["Writer", "Actor", "Director"];
     *     Stream.of({name:"George", activity: "Director"}, {name:"Robert", activity: "Actor"})
     *         .sortBy((p1,p2) => activityOrder.indexOf(p1.activity) - activityOrder.indexOf(p2.activity));
     *     => Stream.of({"name":"Robert","activity":"Actor"}, {"name":"George","activity":"Director"})
     *
     * also see [[ConsStream.sortOn]]
     */
    EmptyStream.prototype.sortBy = function (compare) {
        return this;
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     *     Stream.of({a:3,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a)
     *     => Stream.of({a:1,b:"test"},{a:2,b:"a"},{a:3,b:"b"})
     *
     * You can also sort by multiple criteria, and request 'descending'
     * sorting:
     *
     *     Stream.of({a:1,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a,{desc:elt=>elt.b})
     *     => Stream.of({a:1,b:"test"},{a:1,b:"b"},{a:2,b:"a"})
     *
     * also see [[ConsStream.sortBy]]
     */
    EmptyStream.prototype.sortOn = function () {
        var getKeys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            getKeys[_i] = arguments[_i];
        }
        return this;
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     Stream.of(1,1,2,3,2,3,1).distinctBy(x => x);
     *     => Stream.of(1,2,3)
     */
    EmptyStream.prototype.distinctBy = function (keyExtractor) {
        return this;
    };
    /**
     * Call a function for element in the collection.
     */
    EmptyStream.prototype.forEach = function (fn) {
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    EmptyStream.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.minOn]]
     */
    EmptyStream.prototype.minBy = function (compare) {
        return Option_1.Option.none();
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     *     Stream.of({name:"Joe", age:12}, {name:"Paula", age:6}).minOn(x=>x.age)
     *     => Option.of({name:"Paula", age:6})
     *
     * also see [[ConsStream.minBy]]
     */
    EmptyStream.prototype.minOn = function (getOrderable) {
        return Option_1.Option.none();
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.maxOn]]
     */
    EmptyStream.prototype.maxBy = function (compare) {
        return Option_1.Option.none();
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     *     Stream.of({name:"Joe", age:12}, {name:"Paula", age:6}).maxOn(x=>x.age)
     *     => Option.of({name:"Joe", age:12})
     *
     * also see [[ConsStream.maxBy]]
     */
    EmptyStream.prototype.maxOn = function (getOrderable) {
        return Option_1.Option.none();
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     *
     *     Stream.of(1,2,3).sumOn(x=>x)
     *     => 6
     */
    EmptyStream.prototype.sumOn = function (getNumber) {
        return 0;
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     Stream.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(Stream.of(1,2,3), Stream.of(4,5,6), Stream.of(7,8))
     */
    EmptyStream.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     *
     *     Stream.of(1,2,3).scanLeft(0, (soFar,cur)=>soFar+cur)
     *     => Stream.of(0,1,3,6)
     */
    EmptyStream.prototype.scanLeft = function (init, fn) {
        return new ConsStream(init, Lazy_1.Lazy.of(function () { return emptyStream; }));
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The first element of the result is the final cumulative result.
     *
     *     Stream.of(1,2,3).scanRight(0, (cur,soFar)=>soFar+cur)
     *     => Stream.of(6,5,3,0)
     */
    EmptyStream.prototype.scanRight = function (init, fn) {
        return new ConsStream(init, Lazy_1.Lazy.of(function () { return emptyStream; }));
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     Vector.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    EmptyStream.prototype.mkString = function (separator) {
        return "";
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    EmptyStream.prototype.toArray = function () {
        return [];
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    EmptyStream.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     *
     *     Stream.of(1,2,3).toMap(x=>[x.toString(), x])
     *     => HashMap.of(["1",1], ["2",2], ["3",3])
     */
    EmptyStream.prototype.toMap = function (converter) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     Stream.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    EmptyStream.prototype.toSet = function (converter) {
        return HashSet_1.HashSet.empty();
    };
    /**
     * Convert this collection to a list.
     */
    EmptyStream.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    EmptyStream.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    EmptyStream.prototype.equals = function (other) {
        if (!other) {
            return false;
        }
        return other.isEmpty();
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    EmptyStream.prototype.hashCode = function () {
        return 1;
    };
    EmptyStream.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     *
     * Also see [[ConsStream.mkString]]
     */
    EmptyStream.prototype.toString = function () {
        return "[]";
    };
    return EmptyStream;
}());
exports.EmptyStream = EmptyStream;
/**
 * ConsStream holds a value and a lazy pointer to a next element,
 * which could be [[ConsStream]] or [[EmptyStream]].
 * A ConsStream is basically a non-empty stream. It will
 * contain at least one element.
 * "static methods" available through [[StreamStatic]]
 * @param T the item type
 */
var ConsStream = /** @class */ (function () {
    /**
     * @hidden
     */
    function ConsStream(value, _tail) {
        this.value = value;
        this._tail = _tail;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Implementation of the Iterator interface.
     */
    ConsStream.prototype[Symbol.iterator] = function () {
        var item = this;
        return {
            next: function () {
                if (item.isEmpty()) {
                    return { done: true, value: undefined };
                }
                var value = item.head().get();
                item = item.tail().get();
                return { done: false, value: value };
            }
        };
    };
    /**
     * View this Some a as Stream. Useful to help typescript type
     * inference sometimes.
     */
    ConsStream.prototype.asStream = function () {
        return this;
    };
    /**
     * @hidden
     */
    ConsStream.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * Get the length of the collection.
     */
    ConsStream.prototype.length = function () {
        return this.foldLeft(0, function (n, ignored) { return n + 1; });
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    ConsStream.prototype.single = function () {
        return this._tail.get().isEmpty() ?
            Option_1.Option.of(this.value) :
            Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    ConsStream.prototype.isEmpty = function () {
        return false;
    };
    /**
     * Get the first value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    ConsStream.prototype.head = function () {
        return Option_1.Option.some(this.value);
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    ConsStream.prototype.tail = function () {
        return Option_1.Option.some(this._tail.get());
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    ConsStream.prototype.last = function () {
        var curItem = this;
        while (true) {
            var item = curItem.value;
            curItem = curItem._tail.get();
            if (curItem.isEmpty()) {
                return Option_1.Option.some(item);
            }
        }
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on Stream, which is not a good data structure
     * for random access!
     */
    ConsStream.prototype.get = function (idx) {
        var curItem = this;
        var i = 0;
        while (!curItem.isEmpty()) {
            if (i === idx) {
                var item = curItem.value;
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail.get();
            ++i;
        }
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    ConsStream.prototype.find = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            var item = curItem.value;
            if (predicate(item)) {
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail.get();
        }
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    ConsStream.prototype.contains = function (v) {
        return this.find(function (x) { return Comparison_1.areEqual(x, v); }).isSome();
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    ConsStream.prototype.take = function (n) {
        var _this = this;
        if (n < 1) {
            return emptyStream;
        }
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return _this._tail.get().take(n - 1); }));
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    ConsStream.prototype.takeWhile = function (predicate) {
        var _this = this;
        if (!predicate(this.value)) {
            return emptyStream;
        }
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return _this._tail.get().takeWhile(predicate); }));
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate,
     * but starting from the end of the collection.
     *
     *     Stream.of(1,2,3,4).takeRightWhile(x => x > 2)
     *     => Stream.of(3,4)
     */
    ConsStream.prototype.takeRightWhile = function (predicate) {
        return this.reverse().takeWhile(predicate).reverse();
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsStream.prototype.drop = function (n) {
        var i = n;
        var curItem = this;
        while (i-- > 0 && !curItem.isEmpty()) {
            curItem = curItem._tail.get();
        }
        return curItem;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    ConsStream.prototype.dropWhile = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty() && predicate(curItem.value)) {
            curItem = curItem._tail.get();
        }
        return curItem;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsStream.prototype.dropRight = function (n) {
        // going twice through the list...
        var length = this.length();
        return this.take(length - n);
    };
    /**
     * Returns a new collection, discarding the last elements
     * until one element fails the predicate. All elements
     * before that point are retained.
     */
    ConsStream.prototype.dropRightWhile = function (predicate) {
        return this.reverse().dropWhile(predicate).reverse();
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     Stream.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    ConsStream.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
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
    ConsStream.prototype.foldLeft = function (zero, fn) {
        var r = zero;
        var curItem = this;
        while (!curItem.isEmpty()) {
            r = fn(r, curItem.value);
            curItem = curItem._tail.get();
        }
        return r;
    };
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
    ConsStream.prototype.foldRight = function (zero, fn) {
        return this.reverse().foldLeft(zero, function (xs, x) { return fn(x, xs); });
    };
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Stream.of(1,2,3).zip(["a","b","c"])
     *     => Stream.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     *
     * Also see [[StreamStatic.zip]] (static version which can more than two
     * iterables)
     */
    ConsStream.prototype.zip = function (other) {
        var _this = this;
        var otherIterator = other[Symbol.iterator]();
        var otherCurItem = otherIterator.next();
        if (this.isEmpty() || otherCurItem.done) {
            return emptyStream;
        }
        return new ConsStream([this.value, otherCurItem.value], Lazy_1.Lazy.of(function () {
            var _a;
            return _this._tail.get().zip((_a = {}, _a[Symbol.iterator] = function () { return otherIterator; }, _a));
        }));
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     Stream.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => Stream.of("a0", "b1")
     */
    ConsStream.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Reverse the collection. For instance:
     *
     *     Stream.of(1,2,3).reverse();
     *     => Stream.of(3,2,1)
     */
    ConsStream.prototype.reverse = function () {
        return this.foldLeft(emptyStream, function (xs, x) { return xs.prepend(x); });
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    Stream.of(1,2,3,4,5,6).span(x => x <3)
     *    => [Stream.of(1,2), Stream.of(3,4,5,6)]
     */
    ConsStream.prototype.span = function (predicate) {
        return [this.takeWhile(predicate), this.dropWhile(predicate)];
    };
    /**
     * Split the collection at a specific index.
     *
     *     Stream.of(1,2,3,4,5).splitAt(3)
     *     => [Stream.of(1,2,3), Stream.of(4,5)]
     */
    ConsStream.prototype.splitAt = function (index) {
        return [this.take(index), this.drop(index)];
    };
    ConsStream.prototype.partition = function (predicate) {
        // goes twice over the list, but since we want a lazy behavior...
        return [this.filter(predicate), this.filter(function (x) { return !predicate(x); })];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsStream.arrangeBy]]
     */
    ConsStream.prototype.groupBy = function (classifier) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, v) {
            return acc.putWithMerge(classifier(v), exports.Stream.of(v), function (v1, v2) { return v1.appendStream(v2); });
        });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsStream.groupBy]]
     */
    ConsStream.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    ConsStream.prototype.shuffle = function () {
        return exports.Stream.ofIterable(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Append an element at the end of this Stream.
     */
    ConsStream.prototype.append = function (v) {
        var tail = this._tail.get();
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.append(v); }));
    };
    /*
     * Append multiple elements at the end of this Stream.
     */
    ConsStream.prototype.appendAll = function (elts) {
        return this.appendStream(exports.Stream.ofIterable(elts));
    };
    /**
     * Remove multiple elements from a stream
     *
     *     Stream.of(1,2,3,4,3,2,1).removeAll([2,4])
     *     => Stream.of(1,3,3,1)
     */
    ConsStream.prototype.removeAll = function (elts) {
        return SeqHelpers.removeAll(this, elts);
    };
    /**
     * Removes the first element matching the predicate
     * (use [[ConsStream.filter]] to remove all elements matching a predicate)
     */
    ConsStream.prototype.removeFirst = function (predicate) {
        var tail = this._tail.get();
        return predicate(this.value) ?
            tail :
            new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.removeFirst(predicate); }));
    };
    /*
     * Append another Stream at the end of this Stream.
     *
     * There is no function taking a javascript iterator,
     * because iterators are stateful and Streams lazy.
     * If we would create two Streams working on the same iterator,
     * the streams would interact with one another.
     * It also breaks the cycle() function.
     */
    ConsStream.prototype.appendStream = function (elts) {
        var tail = this._tail.get();
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.appendStream(elts); }));
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    ConsStream.prototype.prepend = function (elt) {
        var _this = this;
        return new ConsStream(elt, Lazy_1.Lazy.of(function () { return _this; }));
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    ConsStream.prototype.prependAll = function (elts) {
        return exports.Stream.ofIterable(elts).appendAll(this);
    };
    /**
     * Repeat infinitely this Stream.
     * For instance:
     *
     *     Stream.of(1,2,3).cycle().take(8)
     *     => Stream.of(1,2,3,1,2,3,1,2)
     */
    ConsStream.prototype.cycle = function () {
        return this._cycle(this);
    };
    ConsStream.prototype._cycle = function (toRepeat) {
        var tail = this._tail.get();
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.isEmpty() ? toRepeat.cycle() : tail._cycle(toRepeat); }));
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    ConsStream.prototype.map = function (mapper) {
        var _this = this;
        return new ConsStream(mapper(this.value), Lazy_1.Lazy.of(function () { return _this._tail.get().map(mapper); }));
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     *
     *     Stream.of(1,2,6).mapOption(x => x%2===0 ?
     *         Option.of(x+1) : Option.none<number>())
     *     => Stream.of(3, 7)
     */
    ConsStream.prototype.mapOption = function (mapper) {
        var _this = this;
        var mapped = mapper(this.value);
        return mapped.isSome() ?
            new ConsStream(mapped.get(), Lazy_1.Lazy.of(function () { return _this._tail.get().mapOption(mapper); })) :
            this._tail.get().mapOption(mapper);
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    ConsStream.prototype.flatMap = function (mapper) {
        return mapper(this.value).appendStream(this._tail.get().flatMap(mapper));
    };
    ConsStream.prototype.allMatch = function (predicate) {
        return this.find(function (x) { return !predicate(x); }).isNone();
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    ConsStream.prototype.anyMatch = function (predicate) {
        return this.find(predicate).isSome();
    };
    ConsStream.prototype.filter = function (predicate) {
        var _this = this;
        return predicate(this.value) ?
            new ConsStream(this.value, Lazy_1.Lazy.of(function () { return _this._tail.get().filter(predicate); })) :
            this._tail.get().filter(predicate);
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     *     const activityOrder = ["Writer", "Actor", "Director"];
     *     Stream.of({name:"George", activity: "Director"}, {name:"Robert", activity: "Actor"})
     *         .sortBy((p1,p2) => activityOrder.indexOf(p1.activity) - activityOrder.indexOf(p2.activity));
     *     => Stream.of({"name":"Robert","activity":"Actor"}, {"name":"George","activity":"Director"})
     *
     * also see [[ConsStream.sortOn]]
     */
    ConsStream.prototype.sortBy = function (compare) {
        return exports.Stream.ofIterable(this.toArray().sort(compare));
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     *     Stream.of({a:3,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a)
     *     => Stream.of({a:1,b:"test"},{a:2,b:"a"},{a:3,b:"b"})
     *
     * You can also sort by multiple criteria, and request 'descending'
     * sorting:
     *
     *     Stream.of({a:1,b:"b"},{a:1,b:"test"},{a:2,b:"a"}).sortOn(elt=>elt.a,{desc:elt=>elt.b})
     *     => Stream.of({a:1,b:"test"},{a:1,b:"b"},{a:2,b:"a"})
     *
     * also see [[ConsStream.sortBy]]
     */
    ConsStream.prototype.sortOn = function () {
        var getKeys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            getKeys[_i] = arguments[_i];
        }
        return SeqHelpers.sortOn(this, getKeys);
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     Stream.of(1,1,2,3,2,3,1).distinctBy(x => x);
     *     => Stream.of(1,2,3)
     */
    ConsStream.prototype.distinctBy = function (keyExtractor) {
        return SeqHelpers.distinctBy(this, keyExtractor);
    };
    /**
     * Call a function for element in the collection.
     */
    ConsStream.prototype.forEach = function (fn) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            fn(curItem.value);
            curItem = curItem._tail.get();
        }
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    ConsStream.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.minOn]]
     */
    ConsStream.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     *     Stream.of({name:"Joe", age:12}, {name:"Paula", age:6}).minOn(x=>x.age)
     *     => Option.of({name:"Paula", age:6})
     *
     * also see [[ConsStream.minBy]]
     */
    ConsStream.prototype.minOn = function (getOrderable) {
        return SeqHelpers.minOn(this, getOrderable);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.maxOn]]
     */
    ConsStream.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     *     Stream.of({name:"Joe", age:12}, {name:"Paula", age:6}).maxOn(x=>x.age)
     *     => Option.of({name:"Joe", age:12})
     *
     * also see [[ConsStream.maxBy]]
     */
    ConsStream.prototype.maxOn = function (getOrderable) {
        return SeqHelpers.maxOn(this, getOrderable);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     *
     *     Stream.of(1,2,3).sumOn(x=>x)
     *     => 6
     */
    ConsStream.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     Stream.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(Stream.of(1,2,3), Stream.of(4,5,6), Stream.of(7,8))
     */
    ConsStream.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     *
     *     Stream.of(1,2,3).scanLeft(0, (soFar,cur)=>soFar+cur)
     *     => Stream.of(0,1,3,6)
     */
    ConsStream.prototype.scanLeft = function (init, fn) {
        var _this = this;
        return new ConsStream(init, Lazy_1.Lazy.of(function () { return _this._tail.get().scanLeft(fn(init, _this.value), fn); }));
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The first element of the result is the final cumulative result.
     *
     *     Stream.of(1,2,3).scanRight(0, (cur,soFar)=>soFar+cur)
     *     => Stream.of(6,5,3,0)
     */
    ConsStream.prototype.scanRight = function (init, fn) {
        // can't be lazy
        var fn2 = function (x, y) { return fn(y, x); };
        return this.reverse().scanLeft(init, fn2).reverse();
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     Vector.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    ConsStream.prototype.mkString = function (separator) {
        var r = "";
        var curItem = this;
        var isNotFirst = false;
        while (!curItem.isEmpty()) {
            if (isNotFirst) {
                r += separator;
            }
            r += SeqHelpers.toStringHelper(curItem.value, { quoteStrings: false });
            curItem = curItem._tail.get();
            isNotFirst = true;
        }
        return r;
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    ConsStream.prototype.toArray = function () {
        var r = [];
        var curItem = this;
        while (!curItem.isEmpty()) {
            r.push(curItem.value);
            curItem = curItem._tail.get();
        }
        return r;
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    ConsStream.prototype.toVector = function () {
        return Vector_1.Vector.ofIterable(this.toArray());
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     *
     *     Stream.of(1,2,3).toMap(x=>[x.toString(), x])
     *     => HashMap.of(["1",1], ["2",2], ["3",3])
     */
    ConsStream.prototype.toMap = function (converter) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, cur) {
            var converted = converter(cur);
            return acc.put(converted[0], converted[1]);
        });
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     Stream.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    ConsStream.prototype.toSet = function (converter) {
        return this.foldLeft(HashSet_1.HashSet.empty(), function (acc, cur) {
            return acc.add(converter(cur));
        });
    };
    /**
     * Convert this collection to a list.
     */
    ConsStream.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    ConsStream.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    ConsStream.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other.tail) {
            return false;
        }
        Contract_1.contractTrueEquality("Stream.equals", this, other);
        var myVal = this;
        var hisVal = other;
        while (true) {
            if (myVal.isEmpty() !== hisVal.isEmpty()) {
                return false;
            }
            if (myVal.isEmpty()) {
                // they are both empty, end of the stream
                return true;
            }
            var myHead = myVal.value;
            var hisHead = hisVal.value;
            if ((myHead === undefined) !== (hisHead === undefined)) {
                return false;
            }
            if (myHead === undefined || hisHead === undefined) {
                // they are both undefined, the || is for TS's flow analysis
                // so he realizes none of them is undefined after this.
                continue;
            }
            if (!Comparison_1.areEqual(myHead, hisHead)) {
                return false;
            }
            myVal = myVal._tail.get();
            hisVal = hisVal._tail.get();
        }
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    ConsStream.prototype.hashCode = function () {
        var hash = 1;
        var curItem = this;
        while (!curItem.isEmpty()) {
            hash = 31 * hash + Comparison_1.getHashCode(curItem.value);
            curItem = curItem._tail.get();
        }
        return hash;
    };
    ConsStream.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     *
     * Also see [[ConsStream.mkString]]
     */
    ConsStream.prototype.toString = function () {
        var curItem = this;
        var result = "Stream(";
        while (!curItem.isEmpty()) {
            result += SeqHelpers.toStringHelper(curItem.value);
            var tail = curItem._tail;
            if (!tail.isEvaluated()) {
                result += ", ?";
                break;
            }
            curItem = tail.get();
            if (!curItem.isEmpty()) {
                result += ", ";
            }
        }
        return result + ")";
    };
    return ConsStream;
}());
exports.ConsStream = ConsStream;
var emptyStream = new EmptyStream();

},{"./Comparison":1,"./Contract":2,"./HashMap":6,"./HashSet":7,"./Lazy":9,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Value":16,"./Vector":17}],15:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Value_1 = require("./Value");
var Option_1 = require("./Option");
var Vector_1 = require("./Vector");
var LinkedList_1 = require("./LinkedList");
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var Contract_1 = require("./Contract");
/**
 * Contains a pair of two values, which may or may not have the same type.
 * Compared to the builtin typescript [T,U] type, we get equality semantics
 * and helper functions (like mapping and so on).
 * @param T the first item type
 * @param U the second item type
 */
var Tuple2 = /** @class */ (function () {
    function Tuple2(_fst, _snd) {
        this._fst = _fst;
        this._snd = _snd;
    }
    /**
     * Build a pair of value from both values.
     */
    Tuple2.of = function (fst, snd) {
        return new Tuple2(fst, snd);
    };
    /**
     * Build a tuple2 from javascript array. Compared to [[Tuple2.ofPair]],
     * it checks the length of the array and will return [[None]] in case
     * the length isn't two. However the types of the elements aren't checked.
     */
    Tuple2.ofArray = function (pair) {
        if (pair && pair.length === 2) {
            return Option_1.Option.of(new Tuple2(pair[0], pair[1]));
        }
        return Option_1.Option.none();
    };
    /**
     * Build a tuple2 from javascript pair.
     * Also see [[Tuple2.ofArray]]
     */
    Tuple2.ofPair = function (pair) {
        return new Tuple2(pair[0], pair[1]);
    };
    /**
     * @hidden
     */
    Tuple2.prototype.hasTrueEquality = function () {
        return Option_1.Option.of(this.fst()).hasTrueEquality() &&
            Option_1.Option.of(this.snd()).hasTrueEquality();
    };
    /**
     * Extract the first value from the pair
     */
    Tuple2.prototype.fst = function () {
        return this._fst;
    };
    /**
     * Extract the second value from the pair
     */
    Tuple2.prototype.snd = function () {
        return this._snd;
    };
    /**
     * Maps the first component of this tuple to a new value.
     */
    Tuple2.prototype.map1 = function (fn) {
        return new Tuple2(fn(this._fst), this._snd);
    };
    /**
     * Maps the second component of this tuple to a new value.
     */
    Tuple2.prototype.map2 = function (fn) {
        return new Tuple2(this._fst, fn(this._snd));
    };
    /**
     * Make a new tuple by mapping both values inside this one.
     */
    Tuple2.prototype.map = function (fn) {
        return fn(this._fst, this._snd);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Tuple2.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Tuple2.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other._fst) {
            return false;
        }
        Contract_1.contractTrueEquality("Tuple2.equals", this, other);
        return Comparison_1.areEqual(this._fst, other._fst) &&
            Comparison_1.areEqual(this._snd, other._snd);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Tuple2.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this._fst) * 53 + Comparison_1.getHashCode(this._snd);
    };
    /**
     * Convert the tuple to a javascript pair.
     * Compared to [[Tuple2.toArray]], it behaves the
     * same at runtime, the only difference is the
     * typescript type definition.
     */
    Tuple2.prototype.toPair = function () {
        return [this._fst, this._snd];
    };
    /**
     * Convert the tuple to a javascript array.
     * Compared to [[Tuple2.toPair]], it behaves the
     * same at runtime, the only difference is the
     * typescript type definition.
     */
    Tuple2.prototype.toArray = function () {
        return [this._fst, this._snd];
    };
    /**
     * Convert the tuple to a vector.
     */
    Tuple2.prototype.toVector = function () {
        return Vector_1.Vector.of(this._fst, this._snd);
    };
    /**
     * Convert the tuple to a linked list.
     */
    Tuple2.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.of(this._fst, this._snd);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Tuple2.prototype.toString = function () {
        return "Tuple2(" + SeqHelpers_1.toStringHelper(this._fst) + ", " + SeqHelpers_1.toStringHelper(this._snd) + ")";
    };
    /**
     * Used by the node REPL to display values.
     * Most of the time should be the same as toString()
     */
    Tuple2.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    return Tuple2;
}());
exports.Tuple2 = Tuple2;

},{"./Comparison":1,"./Contract":2,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Value":16,"./Vector":17}],16:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var util = require("util");
/**
 * @hidden
 */
// @ts-ignore -- see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30241
exports.inspect = util.inspect.custom;

},{"util":24}],17:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Value_1 = require("./Value");
var Option_1 = require("./Option");
var HashMap_1 = require("./HashMap");
var HashSet_1 = require("./HashSet");
var Comparison_1 = require("./Comparison");
var SeqHelpers = require("./SeqHelpers");
var L = require("list");
/**
 * A general-purpose list class with all-around good performance.
 * quasi-O(1) (actually O(log32(n))) access, append, replace.
 * It's backed by a bit-mapped vector trie.
 * @param T the item type
 */
var Vector = /** @class */ (function () {
    /**
     * @hidden
     */
    // _contents will be undefined only if length===0
    function Vector(_list) {
        this._list = _list;
    }
    /**
     * The empty vector.
     * @param T the item type
     */
    Vector.empty = function () {
        return new Vector(L.empty());
    };
    /**
     * Build a vector from a series of items (any number, as parameters)
     * @param T the item type
     */
    Vector.of = function () {
        var data = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            data[_i] = arguments[_i];
        }
        return Vector.ofIterable(data);
    };
    /**
     * Build a vector from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    Vector.ofIterable = function (elts) {
        return new Vector(L.from(elts));
    };
    /**
     * Curried predicate to find out whether the vector is empty.
     *
     *     LinkedList.of(Vector.of(1), Vector.empty<number>())
     *         .filter(Vector.isEmpty)
     *     => LinkedList.of(Vector.empty<number>())
     */
    Vector.isEmpty = function (v) {
        return v.isEmpty();
    };
    /**
     * Curried predicate to find out whether the vector is empty.
     *
     *     LinkedList.of(Vector.of(1), Vector.empty<number>())
     *         .filter(Vector.isNotEmpty)
     *     => LinkedList.of(Vector.of(1))
     */
    Vector.isNotEmpty = function (v) {
        return !v.isEmpty();
    };
    /**
     * Get the length of the collection.
     */
    Vector.prototype.length = function () {
        return L.length(this._list);
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    Vector.prototype.isEmpty = function () {
        return L.length(this._list) === 0;
    };
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
    Vector.unfoldRight = function (seed, fn) {
        var nextVal = fn(seed);
        var r = L.empty();
        while (nextVal.isSome()) {
            r = L.append(nextVal.get()[0], r);
            nextVal = fn(nextVal.get()[1]);
        }
        return new Vector(r);
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     */
    Vector.prototype.get = function (index) {
        return Option_1.Option.of(L.nth(index, this._list));
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    Vector.prototype.single = function () {
        return L.length(this._list) === 1 ?
            this.head() :
            Option_1.Option.none();
    };
    /**
     * Replace the value of element at the index you give.
     * Will throw if the index is out of bounds!
     */
    Vector.prototype.replace = function (index, val) {
        if (index >= this.length() || index < 0) {
            throw new Error('Vector.replace: index is out of range: ' + index);
        }
        return new Vector(L.update(index, val, this._list));
    };
    /**
     * Replace the first occurence (if any) of the element you give by
     * the new value you give.
     *
     *     Vector.of(1, 2, 3, 4, 2).replaceFirst(2, 5)
     *     => Vector.of(1, 5, 3, 4, 2)
     *
     */
    Vector.prototype.replaceFirst = function (element, newVal) {
        // it's a little annoying that areEqual will check whether the element
        // has an equals function for each element in the list, but then
        // what if the list allows null or undefined and the newVal is null or
        // undefined? With type erasure then I don't know what equality to use
        // on the next elements
        var index = L.findIndex(function (v) { return Comparison_1.areEqual(v, element); }, this._list);
        return (index >= 0)
            ? new Vector(L.update(index, newVal, this._list))
            : this;
    };
    /**
     * Replace all occurences of the element you give by
     * the new value you give.
     *
     *     Vector.of(1, 2, 3, 4, 2).replaceAll(2, 5)
     *     => Vector.of(1, 5, 3, 4, 5)
     *
     */
    Vector.prototype.replaceAll = function (element, newVal) {
        // if we're going to update many elements, then append in a loop
        // would give better perf (not copying multiple times the same slice).
        // if we won't update that many, update in a loop would give better perf...
        // assuming it's the latter case.
        var idx = 0;
        return this.foldLeft(this, function (sofar, cur) {
            var r = Comparison_1.areEqual(cur, element)
                ? new Vector(L.update(idx, newVal, sofar._list))
                : sofar;
            ++idx;
            return r;
        });
    };
    /**
     * Append an element at the end of the collection.
     */
    Vector.prototype.append = function (val) {
        return new Vector(L.append(val, this._list));
    };
    /**
     * Append multiple elements at the end of the collection.
     * Note that arrays are also iterables.
     */
    Vector.prototype.appendAll = function (elts) {
        if (elts._list && elts.replace) {
            // elts is a vector too
            return new Vector(L.concat(this._list, elts._list));
        }
        return new Vector(L.concat(this._list, L.from(elts)));
    };
    /**
     * Remove multiple elements from a vector
     *
     *     Vector.of(1,2,3,4,3,2,1).removeAll([2,4])
     *     => Vector.of(1,3,3,1)
     */
    Vector.prototype.removeAll = function (elts) {
        return SeqHelpers.removeAll(this, elts);
    };
    /**
     * Get the first value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    Vector.prototype.head = function () {
        return this.get(0);
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    Vector.prototype.last = function () {
        return Option_1.Option.of(L.last(this._list));
    };
    /**
     * Return a new vector containing all the elements in this
     * vector except the last one, or the empty vector if this
     * is the empty vector.
     *
     *     Vector.of(1,2,3).init()
     *     => Vector.of(1,2)
     */
    Vector.prototype.init = function () {
        return new Vector(L.pop(this._list));
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    Vector.prototype.dropWhile = function (predicate) {
        return new Vector(L.dropWhile(predicate, this._list));
    };
    /**
     * Search for the first item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    Vector.prototype.find = function (predicate) {
        return Option_1.Option.of(L.find(predicate, this._list));
    };
    /**
     * Search for the last item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    Vector.prototype.findLast = function (predicate) {
        return Option_1.Option.of(L.findLast(predicate, this._list));
    };
    /**
     * Search for the first item matching the predicate you pass,
     * returning its index in the form of Option.Some if found,
     * Option.None otherwise.
     */
    Vector.prototype.findIndex = function (predicate) {
        return Option_1.Option.of(L.findIndex(predicate, this._list)).filter(function (i) { return i != -1; });
    };
    Vector.prototype.allMatch = function (predicate) {
        return L.every(predicate, this._list);
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    Vector.prototype.anyMatch = function (predicate) {
        return L.some(predicate, this._list);
    };
    Vector.prototype.partition = function (predicate) {
        return L.partition(predicate, this._list)
            .map(function (x) { return new Vector(x); });
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    Vector.prototype.contains = function (v) {
        return this.find(function (x) { return Comparison_1.areEqual(x, v); }).isSome();
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[Vector.arrangeBy]]
     */
    Vector.prototype.groupBy = function (classifier) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, v) {
            return acc.putWithMerge(classifier(v), Vector.of(v), // !!! DOUBLE CHECK THIS
            function (v1, v2) { return v1.append(L.nth(0, v2._list)); });
        });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[Vector.groupBy]]
     */
    Vector.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     Vector.of(1,1,2,3,2,3,1).distinctBy(x => x);
     *     => Vector.of(1,2,3)
     */
    Vector.prototype.distinctBy = function (keyExtractor) {
        return SeqHelpers.distinctBy(this, keyExtractor);
    };
    Vector.prototype[Symbol.iterator] = function () {
        return this._list[Symbol.iterator]();
    };
    /**
     * Call a function for element in the collection.
     */
    Vector.prototype.forEach = function (fun) {
        L.forEach(fun, this._list);
        return this;
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    Vector.prototype.map = function (fun) {
        return new Vector(L.map(fun, this._list));
    };
    Vector.prototype.filter = function (fun) {
        return new Vector(L.filter(fun, this._list));
    };
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
    Vector.prototype.mapOption = function (mapper) {
        var vec = L.empty();
        for (var i = 0; i < this.length(); i++) {
            var v = mapper(L.nth(i, this._list));
            if (v.isSome()) {
                vec = L.append(v.get(), vec);
            }
        }
        return new Vector(vec);
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    Vector.prototype.flatMap = function (mapper) {
        return new Vector(L.chain(function (x) { return mapper(x)._list; }, this._list));
    };
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
    Vector.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
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
    Vector.prototype.foldLeft = function (zero, fn) {
        return L.foldl(fn, zero, this._list);
    };
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
    Vector.prototype.foldRight = function (zero, fn) {
        return L.foldr(fn, zero, this._list);
    };
    /**
     * Returns the index of the first occurence of the value you give, if present
     *
     *     Vector.of(1, 2, 3, 4, 3).indexOf(3)
     *     => Option.of(2)
     */
    Vector.prototype.indexOf = function (element) {
        return Option_1.Option.of(L.findIndex(function (v) { return Comparison_1.areEqual(v, element); }, this._list))
            .filter(function (i) { return i >= 0; });
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    Vector.prototype.shuffle = function () {
        return Vector.ofIterable(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Vector.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Vector.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || (!other._list) || (!L.isList(other._list))) {
            return false;
        }
        if (this.length() !== other.length())
            return false;
        for (var i = 0; i < this.length(); i++) {
            var myVal = L.nth(i, this._list);
            var hisVal = L.nth(i, other._list);
            if ((myVal === undefined) !== (hisVal === undefined)) {
                return false;
            }
            if (myVal === undefined || hisVal === undefined) {
                // they are both undefined, the || is for TS's flow analysis
                // so he realizes none of them is undefined after this.
                continue;
            }
            if (!Comparison_1.areEqual(myVal, hisVal)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Vector.prototype.hashCode = function () {
        var hash = 1;
        for (var i = 0; i < this.length(); i++) {
            hash = 31 * hash + Comparison_1.getHashCode(L.nth(i, this._list));
        }
        return hash;
    };
    /**
     * Get a human-friendly string representation of that value.
     *
     * Also see [[Vector.mkString]]
     */
    Vector.prototype.toString = function () {
        var r = "Vector(";
        for (var i = 0; i < this.length(); i++) {
            if (i > 0) {
                r += ", ";
            }
            r += SeqHelpers.toStringHelper(L.nth(i, this._list));
        }
        return r + ")";
    };
    /**
     * Used by the node REPL to display values.
     * Most of the time should be the same as toString()
     */
    Vector.prototype[Value_1.inspect] = function () {
        return this.toString();
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     Vector.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    Vector.prototype.mkString = function (separator) {
        var r = "";
        for (var i = 0; i < this.length(); i++) {
            if (i > 0) {
                r += separator;
            }
            r += SeqHelpers.toStringHelper(L.nth(i, this._list), { quoteStrings: false });
        }
        return r;
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     * also see [[Vector.sortOn]]
     */
    Vector.prototype.sortBy = function (compare) {
        return Vector.ofIterable(this.toArray().sort(compare));
    };
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
    Vector.prototype.sortOn = function () {
        var getKeys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            getKeys[_i] = arguments[_i];
        }
        return SeqHelpers.sortOn(this, getKeys);
    };
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
    Vector.prototype.toMap = function (converter) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, cur) {
            var converted = converter(cur);
            return acc.put(converted[0], converted[1]);
        });
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     Vector.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    Vector.prototype.toSet = function (converter) {
        return this.foldLeft(HashSet_1.HashSet.empty(), function (acc, cur) {
            return acc.add(converter(cur));
        });
    };
    /**
     * Convert to array.
     */
    Vector.prototype.toArray = function () {
        return L.toArray(this._list);
    };
    ;
    /**
     * @hidden
     */
    Vector.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
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
    Vector.zip = function () {
        var iterables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            iterables[_i] = arguments[_i];
        }
        var r = L.empty();
        var iterators = iterables.map(function (i) { return i[Symbol.iterator](); });
        var items = iterators.map(function (i) { return i.next(); });
        while (!items.some(function (item) { return item.done; })) {
            r = L.append(items.map(function (item) { return item.value; }), r);
            items = iterators.map(function (i) { return i.next(); });
        }
        return new Vector(r);
    };
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
    Vector.prototype.zip = function (other) {
        var r = L.empty();
        var thisIterator = this[Symbol.iterator]();
        var otherIterator = other[Symbol.iterator]();
        var thisCurItem = thisIterator.next();
        var otherCurItem = otherIterator.next();
        while (!thisCurItem.done && !otherCurItem.done) {
            r = L.append([thisCurItem.value, otherCurItem.value], r);
            thisCurItem = thisIterator.next();
            otherCurItem = otherIterator.next();
        }
        return new Vector(r);
    };
    /**
     * Reverse the collection. For instance:
     *
     *     Vector.of(1,2,3).reverse();
     *     => Vector.of(3,2,1)
     */
    Vector.prototype.reverse = function () {
        return new Vector(L.reverse(this._list));
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     Vector.of("a","b").zipWithIndex().map(([v,idx]) => v+idx)
     *     => Vector.of("a0", "b1")
     */
    Vector.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    Vector.prototype.takeWhile = function (predicate) {
        return new Vector(L.takeWhile(predicate, this._list));
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate,
     * but starting from the end of the collection.
     *
     *     Vector.of(1,2,3,4).takeRightWhile(x => x > 2)
     *     => Vector.of(3,4)
     */
    Vector.prototype.takeRightWhile = function (predicate) {
        return new Vector(L.takeLastWhile(predicate, this._list));
    };
    /**
     * Split the collection at a specific index.
     *
     *     Vector.of(1,2,3,4,5).splitAt(3)
     *     => [Vector.of(1,2,3), Vector.of(4,5)]
     */
    Vector.prototype.splitAt = function (index) {
        if (index < 0) {
            return [Vector.empty(), this];
        }
        return L.splitAt(index, this._list).map(function (x) { return new Vector(x); });
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    Vector.of(1,2,3,4,5,6).span(x => x <3)
     *    => [Vector.of(1,2), Vector.of(3,4,5,6)]
     */
    Vector.prototype.span = function (predicate) {
        // could be potentially faster using splitAt.
        var first = this.takeWhile(predicate);
        return [first, this.drop(first.length())];
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    Vector.prototype.drop = function (n) {
        return new Vector(L.drop(n, this._list));
    };
    /**
     * Return a new collection containing the first n
     * elements from this collection
     *
     *     Vector.of(1,2,3,4).take(2)
     *     => Vector.of(1,2)
     */
    Vector.prototype.take = function (n) {
        if (n < 0) {
            return Vector.empty();
        }
        return new Vector(L.take(n, this._list));
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    Vector.prototype.prepend = function (elt) {
        return new Vector(L.prepend(elt, this._list));
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    Vector.prototype.prependAll = function (elts) {
        return Vector.ofIterable(elts).appendAll(this);
    };
    /**
     * Removes the first element matching the predicate
     * (use [[Seq.filter]] to remove all elements matching a predicate)
     */
    Vector.prototype.removeFirst = function (predicate) {
        var v1 = this.takeWhile(function (x) { return !predicate(x); });
        return v1.appendAll(this.drop(v1.length() + 1));
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    Vector.prototype.dropRight = function (n) {
        if (n >= this.length()) {
            return Vector.empty();
        }
        return new Vector(L.dropLast(n, this._list));
    };
    /**
     * Returns a new collection, discarding the last elements
     * until one element fails the predicate. All elements
     * before that point are retained.
     */
    Vector.prototype.dropRightWhile = function (predicate) {
        var i = this.length() - 1;
        for (; i >= 0; i--) {
            if (!predicate(L.nth(i, this._list))) {
                return this.take(i + 1);
            }
        }
        return Vector.empty();
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    Vector.prototype.tail = function () {
        if (this.isEmpty()) {
            return Option_1.Option.none();
        }
        return Option_1.Option.of(new Vector(L.tail(this._list)));
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    Vector.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.minOn]]
     */
    Vector.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
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
    Vector.prototype.minOn = function (getOrderable) {
        return SeqHelpers.minOn(this, getOrderable);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.maxOn]]
     */
    Vector.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
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
    Vector.prototype.maxOn = function (getOrderable) {
        return SeqHelpers.maxOn(this, getOrderable);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     *
     *     Vector.of(1,2,3).sumOn(x=>x)
     *     => 6
     */
    Vector.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     Vector.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(Vector.of(1,2,3), Vector.of(4,5,6), Vector.of(7,8))
     */
    Vector.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The last element of the result is the final cumulative result.
     *
     *     Vector.of(1,2,3).scanLeft(0, (soFar,cur)=>soFar+cur)
     *     => Vector.of(0,1,3,6)
     */
    Vector.prototype.scanLeft = function (init, fn) {
        return new Vector(L.scan(fn, init, this._list));
    };
    /**
     * Apply the function you give to all elements of the sequence
     * in turn, keeping the intermediate results and returning them
     * along with the final result in a list.
     * The first element of the result is the final cumulative result.
     *
     *     Vector.of(1,2,3).scanRight(0, (cur,soFar)=>soFar+cur)
     *     => Vector.of(6,5,3,0)
     */
    Vector.prototype.scanRight = function (init, fn) {
        var r = [];
        r.unshift(init);
        var cur = init;
        for (var i = this.length() - 1; i >= 0; i--) {
            cur = fn(L.nth(i, this._list), cur);
            r.unshift(cur);
        }
        return Vector.ofIterable(r);
    };
    return Vector;
}());
exports.Vector = Vector;

},{"./Comparison":1,"./HashMap":6,"./HashSet":7,"./Option":11,"./SeqHelpers":13,"./Value":16,"list":20}],18:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
exports.__esModule = true;
// Not re-exporting the abstract types such as Seq, Collection and so on,
// on purpose. Right now they are more an help to design the library, not meant
// for the user.
// Seq<T>.equals is a lot less type-precise than Vector<T>.equals, so I'd rather
// the users use concrete types.
__export(require("./Option"));
__export(require("./Either"));
__export(require("./Lazy"));
__export(require("./Vector"));
__export(require("./LinkedList"));
__export(require("./HashMap"));
__export(require("./HashSet"));
__export(require("./Tuple2"));
__export(require("./Value"));
__export(require("./Comparison"));
__export(require("./Stream"));
__export(require("./Contract"));
__export(require("./Predicate"));
__export(require("./Function"));
__export(require("./Future"));

},{"./Comparison":1,"./Contract":2,"./Either":3,"./Function":4,"./Future":5,"./HashMap":6,"./HashSet":7,"./Lazy":9,"./LinkedList":10,"./Option":11,"./Predicate":12,"./Stream":14,"./Tuple2":15,"./Value":16,"./Vector":17}],19:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
    @fileOverview Hash Array Mapped Trie.

    Code based on: https://github.com/exclipy/pdata
*/
var hamt = {}; // export

/* Configuration
 ******************************************************************************/
var SIZE = 5;

var BUCKET_SIZE = Math.pow(2, SIZE);

var MASK = BUCKET_SIZE - 1;

var MAX_INDEX_NODE = BUCKET_SIZE / 2;

var MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/*
 ******************************************************************************/
var nothing = {};

var constant = function constant(x) {
    return function () {
        return x;
    };
};

/**
    Get 32 bit hash of string.

    Based on:
    http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
var hash = hamt.hash = function (str) {
    var type = typeof str === 'undefined' ? 'undefined' : _typeof(str);
    if (type === 'number') return str;
    if (type !== 'string') str += '';

    var hash = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
        var c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c | 0;
    }
    return hash;
};

/* Bit Ops
 ******************************************************************************/
/**
    Hamming weight.

    Taken from: http://jsperf.com/hamming-weight
*/
var popcount = function popcount(x) {
    x -= x >> 1 & 0x55555555;
    x = (x & 0x33333333) + (x >> 2 & 0x33333333);
    x = x + (x >> 4) & 0x0f0f0f0f;
    x += x >> 8;
    x += x >> 16;
    return x & 0x7f;
};

var hashFragment = function hashFragment(shift, h) {
    return h >>> shift & MASK;
};

var toBitmap = function toBitmap(x) {
    return 1 << x;
};

var fromBitmap = function fromBitmap(bitmap, bit) {
    return popcount(bitmap & bit - 1);
};

/* Array Ops
 ******************************************************************************/
/**
    Set a value in an array.

    @param mutate Should the input array be mutated?
    @param at Index to change.
    @param v New value
    @param arr Array.
*/
var arrayUpdate = function arrayUpdate(mutate, at, v, arr) {
    var out = arr;
    if (!mutate) {
        var len = arr.length;
        out = new Array(len);
        for (var i = 0; i < len; ++i) {
            out[i] = arr[i];
        }
    }
    out[at] = v;
    return out;
};

/**
    Remove a value from an array.

    @param mutate Should the input array be mutated?
    @param at Index to remove.
    @param arr Array.
*/
var arraySpliceOut = function arraySpliceOut(mutate, at, arr) {
    var newLen = arr.length - 1;
    var i = 0;
    var g = 0;
    var out = arr;
    if (mutate) {
        i = g = at;
    } else {
        out = new Array(newLen);
        while (i < at) {
            out[g++] = arr[i++];
        }
    }
    ++i;
    while (i <= newLen) {
        out[g++] = arr[i++];
    }if (mutate) {
        out.length = newLen;
    }
    return out;
};

/**
    Insert a value into an array.

    @param mutate Should the input array be mutated?
    @param at Index to insert at.
    @param v Value to insert,
    @param arr Array.
*/
var arraySpliceIn = function arraySpliceIn(mutate, at, v, arr) {
    var len = arr.length;
    if (mutate) {
        var _i = len;
        while (_i >= at) {
            arr[_i--] = arr[_i];
        }arr[at] = v;
        return arr;
    }
    var i = 0,
        g = 0;
    var out = new Array(len + 1);
    while (i < at) {
        out[g++] = arr[i++];
    }out[at] = v;
    while (i < len) {
        out[++g] = arr[i++];
    }return out;
};

/* Node Structures
 ******************************************************************************/
var LEAF = 1;
var COLLISION = 2;
var INDEX = 3;
var ARRAY = 4;

/**
    Empty node.
*/
var empty = {
    __hamt_isEmpty: true
};

var isEmptyNode = function isEmptyNode(x) {
    return x === empty || x && x.__hamt_isEmpty;
};

/**
    Leaf holding a value.

    @member edit Edit of the node.
    @member hash Hash of key.
    @member key Key.
    @member value Value stored.
*/
var Leaf = function Leaf(edit, hash, key, value) {
    return {
        type: LEAF,
        edit: edit,
        hash: hash,
        key: key,
        value: value,
        _modify: Leaf__modify
    };
};

/**
    Leaf holding multiple values with the same hash but different keys.

    @member edit Edit of the node.
    @member hash Hash of key.
    @member children Array of collision children node.
*/
var Collision = function Collision(edit, hash, children) {
    return {
        type: COLLISION,
        edit: edit,
        hash: hash,
        children: children,
        _modify: Collision__modify
    };
};

/**
    Internal node with a sparse set of children.

    Uses a bitmap and array to pack children.

  @member edit Edit of the node.
    @member mask Bitmap that encode the positions of children in the array.
    @member children Array of child nodes.
*/
var IndexedNode = function IndexedNode(edit, mask, children) {
    return {
        type: INDEX,
        edit: edit,
        mask: mask,
        children: children,
        _modify: IndexedNode__modify
    };
};

/**
    Internal node with many children.

    @member edit Edit of the node.
    @member size Number of children.
    @member children Array of child nodes.
*/
var ArrayNode = function ArrayNode(edit, size, children) {
    return {
        type: ARRAY,
        edit: edit,
        size: size,
        children: children,
        _modify: ArrayNode__modify
    };
};

/**
    Is `node` a leaf node?
*/
var isLeaf = function isLeaf(node) {
    return node === empty || node.type === LEAF || node.type === COLLISION;
};

/* Internal node operations.
 ******************************************************************************/
/**
    Expand an indexed node into an array node.

  @param edit Current edit.
    @param frag Index of added child.
    @param child Added child.
    @param mask Index node mask before child added.
    @param subNodes Index node children before child added.
*/
var expand = function expand(edit, frag, child, bitmap, subNodes) {
    var arr = [];
    var bit = bitmap;
    var count = 0;
    for (var i = 0; bit; ++i) {
        if (bit & 1) arr[i] = subNodes[count++];
        bit >>>= 1;
    }
    arr[frag] = child;
    return ArrayNode(edit, count + 1, arr);
};

/**
    Collapse an array node into a indexed node.

  @param edit Current edit.
    @param count Number of elements in new array.
    @param removed Index of removed element.
    @param elements Array node children before remove.
*/
var pack = function pack(edit, count, removed, elements) {
    var children = new Array(count - 1);
    var g = 0;
    var bitmap = 0;
    for (var i = 0, len = elements.length; i < len; ++i) {
        if (i !== removed) {
            var elem = elements[i];
            if (elem && !isEmptyNode(elem)) {
                children[g++] = elem;
                bitmap |= 1 << i;
            }
        }
    }
    return IndexedNode(edit, bitmap, children);
};

/**
    Merge two leaf nodes.

    @param shift Current shift.
    @param h1 Node 1 hash.
    @param n1 Node 1.
    @param h2 Node 2 hash.
    @param n2 Node 2.
*/
var mergeLeaves = function mergeLeaves(edit, shift, h1, n1, h2, n2) {
    if (h1 === h2) return Collision(edit, h1, [n2, n1]);

    var subH1 = hashFragment(shift, h1);
    var subH2 = hashFragment(shift, h2);
    return IndexedNode(edit, toBitmap(subH1) | toBitmap(subH2), subH1 === subH2 ? [mergeLeaves(edit, shift + SIZE, h1, n1, h2, n2)] : subH1 < subH2 ? [n1, n2] : [n2, n1]);
};

/**
    Update an entry in a collision list.

    @param mutate Should mutation be used?
    @param edit Current edit.
    @param keyEq Key compare function.
    @param hash Hash of collision.
    @param list Collision list.
    @param f Update function.
    @param k Key to update.
    @param size Size ref.
*/
var updateCollisionList = function updateCollisionList(mutate, edit, keyEq, h, list, f, k, size) {
    var len = list.length;
    for (var i = 0; i < len; ++i) {
        var child = list[i];
        if (keyEq(k, child.key)) {
            var value = child.value;
            var _newValue = f(value);
            if (_newValue === value) return list;

            if (_newValue === nothing) {
                --size.value;
                return arraySpliceOut(mutate, i, list);
            }
            return arrayUpdate(mutate, i, Leaf(edit, h, k, _newValue), list);
        }
    }

    var newValue = f();
    if (newValue === nothing) return list;
    ++size.value;
    return arrayUpdate(mutate, len, Leaf(edit, h, k, newValue), list);
};

var canEditNode = function canEditNode(edit, node) {
    return edit === node.edit;
};

/* Editing
 ******************************************************************************/
var Leaf__modify = function Leaf__modify(edit, keyEq, shift, f, h, k, size) {
    if (keyEq(k, this.key)) {
        var _v = f(this.value);
        if (_v === this.value) return this;else if (_v === nothing) {
            --size.value;
            return empty;
        }
        if (canEditNode(edit, this)) {
            this.value = _v;
            return this;
        }
        return Leaf(edit, h, k, _v);
    }
    var v = f();
    if (v === nothing) return this;
    ++size.value;
    return mergeLeaves(edit, shift, this.hash, this, h, Leaf(edit, h, k, v));
};

var Collision__modify = function Collision__modify(edit, keyEq, shift, f, h, k, size) {
    if (h === this.hash) {
        var canEdit = canEditNode(edit, this);
        var list = updateCollisionList(canEdit, edit, keyEq, this.hash, this.children, f, k, size);
        if (list === this.children) return this;

        return list.length > 1 ? Collision(edit, this.hash, list) : list[0]; // collapse single element collision list
    }
    var v = f();
    if (v === nothing) return this;
    ++size.value;
    return mergeLeaves(edit, shift, this.hash, this, h, Leaf(edit, h, k, v));
};

var IndexedNode__modify = function IndexedNode__modify(edit, keyEq, shift, f, h, k, size) {
    var mask = this.mask;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var bit = toBitmap(frag);
    var indx = fromBitmap(mask, bit);
    var exists = mask & bit;
    var current = exists ? children[indx] : empty;
    var child = current._modify(edit, keyEq, shift + SIZE, f, h, k, size);

    if (current === child) return this;

    var canEdit = canEditNode(edit, this);
    var bitmap = mask;
    var newChildren = void 0;
    if (exists && isEmptyNode(child)) {
        // remove
        bitmap &= ~bit;
        if (!bitmap) return empty;
        if (children.length <= 2 && isLeaf(children[indx ^ 1])) return children[indx ^ 1]; // collapse

        newChildren = arraySpliceOut(canEdit, indx, children);
    } else if (!exists && !isEmptyNode(child)) {
        // add
        if (children.length >= MAX_INDEX_NODE) return expand(edit, frag, child, mask, children);

        bitmap |= bit;
        newChildren = arraySpliceIn(canEdit, indx, child, children);
    } else {
        // modify
        newChildren = arrayUpdate(canEdit, indx, child, children);
    }

    if (canEdit) {
        this.mask = bitmap;
        this.children = newChildren;
        return this;
    }
    return IndexedNode(edit, bitmap, newChildren);
};

var ArrayNode__modify = function ArrayNode__modify(edit, keyEq, shift, f, h, k, size) {
    var count = this.size;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var child = children[frag];
    var newChild = (child || empty)._modify(edit, keyEq, shift + SIZE, f, h, k, size);

    if (child === newChild) return this;

    var canEdit = canEditNode(edit, this);
    var newChildren = void 0;
    if (isEmptyNode(child) && !isEmptyNode(newChild)) {
        // add
        ++count;
        newChildren = arrayUpdate(canEdit, frag, newChild, children);
    } else if (!isEmptyNode(child) && isEmptyNode(newChild)) {
        // remove
        --count;
        if (count <= MIN_ARRAY_NODE) return pack(edit, count, frag, children);
        newChildren = arrayUpdate(canEdit, frag, empty, children);
    } else {
        // modify
        newChildren = arrayUpdate(canEdit, frag, newChild, children);
    }

    if (canEdit) {
        this.size = count;
        this.children = newChildren;
        return this;
    }
    return ArrayNode(edit, count, newChildren);
};

empty._modify = function (edit, keyEq, shift, f, h, k, size) {
    var v = f();
    if (v === nothing) return empty;
    ++size.value;
    return Leaf(edit, h, k, v);
};

/*
 ******************************************************************************/
function Map(editable, edit, config, root, size) {
    this._editable = editable;
    this._edit = edit;
    this._config = config;
    this._root = root;
    this._size = size;
};

Map.prototype.setTree = function (newRoot, newSize) {
    if (this._editable) {
        this._root = newRoot;
        this._size = newSize;
        return this;
    }
    return newRoot === this._root ? this : new Map(this._editable, this._edit, this._config, newRoot, newSize);
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `alt` if none.
*/
var tryGetHash = hamt.tryGetHash = function (alt, hash, key, map) {
    var node = map._root;
    var shift = 0;
    var keyEq = map._config.keyEq;
    while (true) {
        switch (node.type) {
            case LEAF:
                {
                    return keyEq(key, node.key) ? node.value : alt;
                }
            case COLLISION:
                {
                    if (hash === node.hash) {
                        var children = node.children;
                        for (var i = 0, len = children.length; i < len; ++i) {
                            var child = children[i];
                            if (keyEq(key, child.key)) return child.value;
                        }
                    }
                    return alt;
                }
            case INDEX:
                {
                    var frag = hashFragment(shift, hash);
                    var bit = toBitmap(frag);
                    if (node.mask & bit) {
                        node = node.children[fromBitmap(node.mask, bit)];
                        shift += SIZE;
                        break;
                    }
                    return alt;
                }
            case ARRAY:
                {
                    node = node.children[hashFragment(shift, hash)];
                    if (node) {
                        shift += SIZE;
                        break;
                    }
                    return alt;
                }
            default:
                return alt;
        }
    }
};

Map.prototype.tryGetHash = function (alt, hash, key) {
    return tryGetHash(alt, hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `tryGetHash`
*/
var tryGet = hamt.tryGet = function (alt, key, map) {
    return tryGetHash(alt, map._config.hash(key), key, map);
};

Map.prototype.tryGet = function (alt, key) {
    return tryGet(alt, key, this);
};

/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `undefined` if none.
*/
var getHash = hamt.getHash = function (hash, key, map) {
    return tryGetHash(undefined, hash, key, map);
};

Map.prototype.getHash = function (hash, key) {
    return getHash(hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `get`
*/
var get = hamt.get = function (key, map) {
    return tryGetHash(undefined, map._config.hash(key), key, map);
};

Map.prototype.get = function (key, alt) {
    return tryGet(alt, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses custom `hash`.
*/
var hasHash = hamt.has = function (hash, key, map) {
    return tryGetHash(nothing, hash, key, map) !== nothing;
};

Map.prototype.hasHash = function (hash, key) {
    return hasHash(hash, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses internal hash function.
*/
var has = hamt.has = function (key, map) {
    return hasHash(map._config.hash(key), key, map);
};

Map.prototype.has = function (key) {
    return has(key, this);
};

var defKeyCompare = function defKeyCompare(x, y) {
    return x === y;
};

/**
    Create an empty map.

    @param config Configuration.
*/
hamt.make = function (config) {
    return new Map(0, 0, {
        keyEq: config && config.keyEq || defKeyCompare,
        hash: config && config.hash || hash
    }, empty, 0);
};

/**
    Empty map.
*/
hamt.empty = hamt.make();

/**
    Does `map` contain any elements?
*/
var isEmpty = hamt.isEmpty = function (map) {
    return map && !!isEmptyNode(map._root);
};

Map.prototype.isEmpty = function () {
    return isEmpty(this);
};

/* Updates
 ******************************************************************************/
/**
    Alter the value stored for `key` in `map` using function `f` using
    custom hash.

    `f` is invoked with the current value for `k` if it exists,
    or no arguments if no such value exists. `modify` will always either
    update or insert a value into the map.

    Returns a map with the modified value. Does not alter `map`.
*/
var modifyHash = hamt.modifyHash = function (f, hash, key, map) {
    var size = { value: map._size };
    var newRoot = map._root._modify(map._editable ? map._edit : NaN, map._config.keyEq, 0, f, hash, key, size);
    return map.setTree(newRoot, size.value);
};

Map.prototype.modifyHash = function (hash, key, f) {
    return modifyHash(f, hash, key, this);
};

/**
    Alter the value stored for `key` in `map` using function `f` using
    internal hash function.

    @see `modifyHash`
*/
var modify = hamt.modify = function (f, key, map) {
    return modifyHash(f, map._config.hash(key), key, map);
};

Map.prototype.modify = function (key, f) {
    return modify(f, key, this);
};

/**
    Store `value` for `key` in `map` using custom `hash`.

    Returns a map with the modified value. Does not alter `map`.
*/
var setHash = hamt.setHash = function (hash, key, value, map) {
    return modifyHash(constant(value), hash, key, map);
};

Map.prototype.setHash = function (hash, key, value) {
    return setHash(hash, key, value, this);
};

/**
    Store `value` for `key` in `map` using internal hash function.

    @see `setHash`
*/
var set = hamt.set = function (key, value, map) {
    return setHash(map._config.hash(key), key, value, map);
};

Map.prototype.set = function (key, value) {
    return set(key, value, this);
};

/**
    Remove the entry for `key` in `map`.

    Returns a map with the value removed. Does not alter `map`.
*/
var del = constant(nothing);
var removeHash = hamt.removeHash = function (hash, key, map) {
    return modifyHash(del, hash, key, map);
};

Map.prototype.removeHash = Map.prototype.deleteHash = function (hash, key) {
    return removeHash(hash, key, this);
};

/**
    Remove the entry for `key` in `map` using internal hash function.

    @see `removeHash`
*/
var remove = hamt.remove = function (key, map) {
    return removeHash(map._config.hash(key), key, map);
};

Map.prototype.remove = Map.prototype.delete = function (key) {
    return remove(key, this);
};

/* Mutation
 ******************************************************************************/
/**
    Mark `map` as mutable.
 */
var beginMutation = hamt.beginMutation = function (map) {
    return new Map(map._editable + 1, map._edit + 1, map._config, map._root, map._size);
};

Map.prototype.beginMutation = function () {
    return beginMutation(this);
};

/**
    Mark `map` as immutable.
 */
var endMutation = hamt.endMutation = function (map) {
    map._editable = map._editable && map._editable - 1;
    return map;
};

Map.prototype.endMutation = function () {
    return endMutation(this);
};

/**
    Mutate `map` within the context of `f`.
    @param f
    @param map HAMT
*/
var mutate = hamt.mutate = function (f, map) {
    var transient = beginMutation(map);
    f(transient);
    return endMutation(transient);
};

Map.prototype.mutate = function (f) {
    return mutate(f, this);
};

/* Traversal
 ******************************************************************************/
/**
    Apply a continuation.
*/
var appk = function appk(k) {
    return k && lazyVisitChildren(k[0], k[1], k[2], k[3], k[4]);
};

/**
    Recursively visit all values stored in an array of nodes lazily.
*/
var lazyVisitChildren = function lazyVisitChildren(len, children, i, f, k) {
    while (i < len) {
        var child = children[i++];
        if (child && !isEmptyNode(child)) return lazyVisit(child, f, [len, children, i, f, k]);
    }
    return appk(k);
};

/**
    Recursively visit all values stored in `node` lazily.
*/
var lazyVisit = function lazyVisit(node, f, k) {
    switch (node.type) {
        case LEAF:
            return {
                value: f(node),
                rest: k
            };

        case COLLISION:
        case ARRAY:
        case INDEX:
            var children = node.children;
            return lazyVisitChildren(children.length, children, 0, f, k);

        default:
            return appk(k);
    }
};

var DONE = {
    done: true
};

/**
    Javascript iterator over a map.
*/
function MapIterator(v) {
    this.v = v;
};

MapIterator.prototype.next = function () {
    if (!this.v) return DONE;
    var v0 = this.v;
    this.v = appk(v0.rest);
    return v0;
};

MapIterator.prototype[Symbol.iterator] = function () {
    return this;
};

/**
    Lazily visit each value in map with function `f`.
*/
var visit = function visit(map, f) {
    return new MapIterator(lazyVisit(map._root, f));
};

/**
    Get a Javascsript iterator of `map`.

    Iterates over `[key, value]` arrays.
*/
var buildPairs = function buildPairs(x) {
    return [x.key, x.value];
};
var entries = hamt.entries = function (map) {
    return visit(map, buildPairs);
};

Map.prototype.entries = Map.prototype[Symbol.iterator] = function () {
    return entries(this);
};

/**
    Get array of all keys in `map`.

    Order is not guaranteed.
*/
var buildKeys = function buildKeys(x) {
    return x.key;
};
var keys = hamt.keys = function (map) {
    return visit(map, buildKeys);
};

Map.prototype.keys = function () {
    return keys(this);
};

/**
    Get array of all values in `map`.

    Order is not guaranteed, duplicates are preserved.
*/
var buildValues = function buildValues(x) {
    return x.value;
};
var values = hamt.values = Map.prototype.values = function (map) {
    return visit(map, buildValues);
};

Map.prototype.values = function () {
    return values(this);
};

/* Fold
 ******************************************************************************/
/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function mapping accumulated value, value, and key to new value.
    @param z Starting value.
    @param m HAMT
*/
var fold = hamt.fold = function (f, z, m) {
    var root = m._root;
    if (root.type === LEAF) return f(z, root.value, root.key);

    var toVisit = [root.children];
    var children = void 0;
    while (children = toVisit.pop()) {
        for (var i = 0, len = children.length; i < len;) {
            var child = children[i++];
            if (child && child.type) {
                if (child.type === LEAF) z = f(z, child.value, child.key);else toVisit.push(child.children);
            }
        }
    }
    return z;
};

Map.prototype.fold = function (f, z) {
    return fold(f, z, this);
};

/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function invoked with value and key
    @param map HAMT
*/
var forEach = hamt.forEach = function (f, map) {
    return fold(function (_, value, key) {
        return f(value, key, map);
    }, null, map);
};

Map.prototype.forEach = function (f) {
    return forEach(f, this);
};

/* Aggregate
 ******************************************************************************/
/**
    Get the number of entries in `map`.
*/
var count = hamt.count = function (map) {
    return map._size;
};

Map.prototype.count = function () {
    return count(this);
};

Object.defineProperty(Map.prototype, 'size', {
    get: Map.prototype.count
});

/* Export
 ******************************************************************************/
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hamt;
} else if (typeof define === 'function' && define.amd) {
    define('hamt', [], function () {
        return hamt;
    });
} else {
    undefined.hamt = hamt;
}


},{}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var branchingFactor = 32;
var branchBits = 5;
var mask = 31;
function isSetoid(a) {
    return a && typeof a["fantasy-land/equals"] === "function";
}
function elementEquals(a, b) {
    if (a === b) {
        return true;
    }
    else if (isSetoid(a)) {
        return a["fantasy-land/equals"](b);
    }
    else {
        return false;
    }
}
function createPath(depth, value) {
    var current = value;
    for (var i = 0; i < depth; ++i) {
        current = new Node(undefined, [current]);
    }
    return current;
}
function copyArray(source) {
    var array = [];
    for (var i = 0; i < source.length; ++i) {
        array[i] = source[i];
    }
    return array;
}
function pushElements(source, target, offset, amount) {
    for (var i = offset; i < offset + amount; ++i) {
        target.push(source[i]);
    }
}
function copyIndices(source, sourceStart, target, targetStart, length) {
    for (var i = 0; i < length; ++i) {
        target[targetStart + i] = source[sourceStart + i];
    }
}
function arrayPrepend(value, array) {
    var newLength = array.length + 1;
    var result = new Array(newLength);
    result[0] = value;
    for (var i = 1; i < newLength; ++i) {
        result[i] = array[i - 1];
    }
    return result;
}
function reverseArray(array) {
    return array.slice().reverse();
}
function arrayFirst(array) {
    return array[0];
}
function arrayLast(array) {
    return array[array.length - 1];
}
var pathResult = { path: 0, index: 0, updatedOffset: 0 };
function getPath(index, offset, depth, sizes) {
    if (sizes === undefined && offset !== 0) {
        pathResult.updatedOffset = 0;
        index = handleOffset(depth, offset, index);
    }
    var path = (index >> (depth * branchBits)) & mask;
    if (sizes !== undefined) {
        while (sizes[path] <= index) {
            path++;
        }
        var traversed = path === 0 ? 0 : sizes[path - 1];
        index -= traversed;
        pathResult.updatedOffset = offset;
    }
    pathResult.path = path;
    pathResult.index = index;
    return pathResult;
}
function updateNode(node, depth, index, offset, value) {
    var _a = getPath(index, offset, depth, node.sizes), path = _a.path, newIndex = _a.index, updatedOffset = _a.updatedOffset;
    var array = copyArray(node.array);
    array[path] =
        depth > 0
            ? updateNode(array[path], depth - 1, newIndex, updatedOffset, value)
            : value;
    return new Node(node.sizes, array);
}
var Node = (function () {
    function Node(sizes, array) {
        this.sizes = sizes;
        this.array = array;
    }
    return Node;
}());
exports.Node = Node;
function cloneNode(_a) {
    var sizes = _a.sizes, array = _a.array;
    return new Node(sizes === undefined ? undefined : copyArray(sizes), copyArray(array));
}
var emptyAffix = [0];
var affixBits = 6;
var affixMask = 63;
function getSuffixSize(l) {
    return l.bits & affixMask;
}
function getPrefixSize(l) {
    return (l.bits >> affixBits) & affixMask;
}
function getDepth(l) {
    return l.bits >> (affixBits * 2);
}
function setPrefix(size, bits) {
    return (size << affixBits) | (bits & ~(affixMask << affixBits));
}
function setSuffix(size, bits) {
    return size | (bits & ~affixMask);
}
function setDepth(depth, bits) {
    return ((depth << (affixBits * 2)) | (bits & (affixMask | (affixMask << affixBits))));
}
function incrementPrefix(bits) {
    return bits + (1 << affixBits);
}
function incrementSuffix(bits) {
    return bits + 1;
}
function incrementDepth(bits) {
    return bits + (1 << (affixBits * 2));
}
function decrementDepth(bits) {
    return bits - (1 << (affixBits * 2));
}
var List = (function () {
    function List(bits, offset, length, prefix, root, suffix) {
        this.bits = bits;
        this.offset = offset;
        this.length = length;
        this.prefix = prefix;
        this.root = root;
        this.suffix = suffix;
    }
    List.prototype[Symbol.iterator] = function () {
        return new ForwardListIterator(this);
    };
    List.prototype.toJSON = function () {
        return toArray(this);
    };
    return List;
}());
exports.List = List;
function cloneList(l) {
    return new List(l.bits, l.offset, l.length, l.prefix, l.root, l.suffix);
}
var ListIterator = (function () {
    function ListIterator(l, direction) {
        this.l = l;
        this.result = { done: false, value: undefined };
        this.idx = direction === 1 ? -1 : l.length;
        this.prefixSize = getPrefixSize(l);
        this.middleSize = l.length - getSuffixSize(l);
        if (l.root !== undefined) {
            var depth = getDepth(l);
            this.stack = new Array(depth + 1);
            this.indices = new Array(depth + 1);
            var currentNode = l.root.array;
            for (var i = depth; 0 <= i; --i) {
                this.stack[i] = currentNode;
                var idx = direction === 1 ? 0 : currentNode.length - 1;
                this.indices[i] = idx;
                currentNode = currentNode[idx].array;
            }
            this.indices[0] -= direction;
        }
    }
    return ListIterator;
}());
var ForwardListIterator = (function (_super) {
    __extends(ForwardListIterator, _super);
    function ForwardListIterator(l) {
        return _super.call(this, l, 1) || this;
    }
    ForwardListIterator.prototype.nextInTree = function () {
        for (var i = 0; ++this.indices[i] === this.stack[i].length; ++i) {
            this.indices[i] = 0;
        }
        for (; 0 < i; --i) {
            this.stack[i - 1] = this.stack[i][this.indices[i]].array;
        }
    };
    ForwardListIterator.prototype.next = function () {
        var newVal;
        var idx = ++this.idx;
        if (idx < this.prefixSize) {
            newVal = this.l.prefix[this.prefixSize - idx - 1];
        }
        else if (idx < this.middleSize) {
            this.nextInTree();
            newVal = this.stack[0][this.indices[0]];
        }
        else if (idx < this.l.length) {
            newVal = this.l.suffix[idx - this.middleSize];
        }
        else {
            this.result.done = true;
        }
        this.result.value = newVal;
        return this.result;
    };
    return ForwardListIterator;
}(ListIterator));
var BackwardsListIterator = (function (_super) {
    __extends(BackwardsListIterator, _super);
    function BackwardsListIterator(l) {
        return _super.call(this, l, -1) || this;
    }
    BackwardsListIterator.prototype.prevInTree = function () {
        for (var i = 0; this.indices[i] === 0; ++i) { }
        --this.indices[i];
        for (; 0 < i; --i) {
            var n = this.stack[i][this.indices[i]].array;
            this.stack[i - 1] = n;
            this.indices[i - 1] = n.length - 1;
        }
    };
    BackwardsListIterator.prototype.next = function () {
        var newVal;
        var idx = --this.idx;
        if (this.middleSize <= idx) {
            newVal = this.l.suffix[idx - this.middleSize];
        }
        else if (this.prefixSize <= idx) {
            this.prevInTree();
            newVal = this.stack[0][this.indices[0]];
        }
        else if (0 <= idx) {
            newVal = this.l.prefix[this.prefixSize - idx - 1];
        }
        else {
            this.result.done = true;
        }
        this.result.value = newVal;
        return this.result;
    };
    return BackwardsListIterator;
}(ListIterator));
function backwards(l) {
    var _a;
    return _a = {},
        _a[Symbol.iterator] = function () {
            return new BackwardsListIterator(l);
        },
        _a;
}
exports.backwards = backwards;
function emptyPushable() {
    return new List(0, 0, 0, [], undefined, []);
}
function push(value, l) {
    var suffixSize = getSuffixSize(l);
    if (l.length === 0) {
        l.bits = setPrefix(1, l.bits);
        l.prefix = [value];
    }
    else if (suffixSize < 32) {
        l.bits = incrementSuffix(l.bits);
        l.suffix.push(value);
    }
    else if (l.root === undefined) {
        l.root = new Node(undefined, l.suffix);
        l.suffix = [value];
        l.bits = setSuffix(1, l.bits);
    }
    else {
        var newNode = new Node(undefined, l.suffix);
        var index = l.length - 1 - 32 + 1;
        var current = l.root;
        var depth = getDepth(l);
        l.suffix = [value];
        l.bits = setSuffix(1, l.bits);
        if (index - 1 < Math.pow(branchingFactor, (depth + 1))) {
            for (; depth >= 0; --depth) {
                var path = (index >> (depth * branchBits)) & mask;
                if (path < current.array.length) {
                    current = current.array[path];
                }
                else {
                    current.array.push(createPath(depth - 1, newNode));
                    break;
                }
            }
        }
        else {
            l.bits = incrementDepth(l.bits);
            l.root = new Node(undefined, [l.root, createPath(depth, newNode)]);
        }
    }
    l.length++;
    return l;
}
function list() {
    var elements = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        elements[_i] = arguments[_i];
    }
    var l = emptyPushable();
    for (var _a = 0, elements_1 = elements; _a < elements_1.length; _a++) {
        var element = elements_1[_a];
        push(element, l);
    }
    return l;
}
exports.list = list;
function empty() {
    return new List(0, 0, 0, emptyAffix, undefined, emptyAffix);
}
exports.empty = empty;
function of(a) {
    return list(a);
}
exports.of = of;
function pair(first, second) {
    return new List(2, 0, 2, emptyAffix, undefined, [first, second]);
}
exports.pair = pair;
function from(sequence) {
    var l = emptyPushable();
    if (sequence.length > 0 && (sequence[0] !== undefined || 0 in sequence)) {
        for (var i = 0; i < sequence.length; ++i) {
            push(sequence[i], l);
        }
    }
    else if (Symbol.iterator in sequence) {
        var iterator = sequence[Symbol.iterator]();
        var cur = void 0;
        while (!(cur = iterator.next()).done) {
            push(cur.value, l);
        }
    }
    return l;
}
exports.from = from;
function range(start, end) {
    var list = emptyPushable();
    for (var i = start; i < end; ++i) {
        push(i, list);
    }
    return list;
}
exports.range = range;
function repeat(value, times) {
    var l = emptyPushable();
    while (--times >= 0) {
        push(value, l);
    }
    return l;
}
exports.repeat = repeat;
function times(func, times) {
    var l = emptyPushable();
    for (var i = 0; i < times; i++) {
        push(func(i), l);
    }
    return l;
}
exports.times = times;
function nodeNthDense(node, depth, index) {
    var current = node;
    for (; depth >= 0; --depth) {
        current = current.array[(index >> (depth * branchBits)) & mask];
    }
    return current;
}
function handleOffset(depth, offset, index) {
    index += offset;
    for (; depth >= 0; --depth) {
        index = index - (offset & (mask << (depth * branchBits)));
        if (((index >> (depth * branchBits)) & mask) !== 0) {
            break;
        }
    }
    return index;
}
function nodeNth(node, depth, offset, index) {
    var path;
    var current = node;
    while (current.sizes !== undefined) {
        path = (index >> (depth * branchBits)) & mask;
        while (current.sizes[path] <= index) {
            path++;
        }
        if (path !== 0) {
            index -= current.sizes[path - 1];
            offset = 0;
        }
        depth--;
        current = current.array[path];
    }
    return nodeNthDense(current, depth, offset === 0 ? index : handleOffset(depth, offset, index));
}
function nth(index, l) {
    if (index < 0 || l.length <= index) {
        return undefined;
    }
    var prefixSize = getPrefixSize(l);
    var suffixSize = getSuffixSize(l);
    if (index < prefixSize) {
        return l.prefix[prefixSize - index - 1];
    }
    else if (index >= l.length - suffixSize) {
        return l.suffix[index - (l.length - suffixSize)];
    }
    var offset = l.offset;
    var depth = getDepth(l);
    return l.root.sizes === undefined
        ? nodeNthDense(l.root, depth, offset === 0
            ? index - prefixSize
            : handleOffset(depth, offset, index - prefixSize))
        : nodeNth(l.root, depth, offset, index - prefixSize);
}
exports.nth = nth;
function setSizes(node, height) {
    var sum = 0;
    var sizeTable = [];
    for (var i = 0; i < node.array.length; ++i) {
        sum += sizeOfSubtree(node.array[i], height - 1);
        sizeTable[i] = sum;
    }
    node.sizes = sizeTable;
    return node;
}
function sizeOfSubtree(node, height) {
    if (height !== 0) {
        if (node.sizes !== undefined) {
            return arrayLast(node.sizes);
        }
        else {
            var lastSize = sizeOfSubtree(arrayLast(node.array), height - 1);
            return ((node.array.length - 1) << (height * branchBits)) + lastSize;
        }
    }
    else {
        return node.array.length;
    }
}
function affixPush(a, array, length) {
    if (array.length === length) {
        array.push(a);
        return array;
    }
    else {
        var newArray = [];
        copyIndices(array, 0, newArray, 0, length);
        newArray.push(a);
        return newArray;
    }
}
function prepend(value, l) {
    var prefixSize = getPrefixSize(l);
    if (prefixSize < 32) {
        return new List(incrementPrefix(l.bits), l.offset, l.length + 1, affixPush(value, l.prefix, prefixSize), l.root, l.suffix);
    }
    else {
        var newList = cloneList(l);
        prependNodeToTree(newList, reverseArray(l.prefix));
        var newPrefix = [value];
        newList.prefix = newPrefix;
        newList.length++;
        newList.bits = setPrefix(1, newList.bits);
        return newList;
    }
}
exports.prepend = prepend;
function copyLeft(l, k) {
    var currentNode = cloneNode(l.root);
    l.root = currentNode;
    for (var i = 1; i < k; ++i) {
        var index = 0;
        if (currentNode.sizes !== undefined) {
            for (var i_1 = 0; i_1 < currentNode.sizes.length; ++i_1) {
                currentNode.sizes[i_1] += 32;
            }
        }
        var newNode = cloneNode(currentNode.array[index]);
        currentNode.array[index] = newNode;
        currentNode = newNode;
    }
    return currentNode;
}
function nodePrepend(value, size, node) {
    var array = arrayPrepend(value, node.array);
    var sizes = undefined;
    if (node.sizes !== undefined) {
        sizes = new Array(node.sizes.length + 1);
        sizes[0] = size;
        for (var i = 0; i < node.sizes.length; ++i) {
            sizes[i + 1] = node.sizes[i] + size;
        }
    }
    return new Node(sizes, array);
}
function prependTopTree(l, depth, node) {
    var newOffset;
    if (l.root.array.length < branchingFactor) {
        newOffset = Math.pow(32, depth) - 32;
        l.root = new Node(undefined, arrayPrepend(createPath(depth - 1, node), l.root.array));
    }
    else {
        l.bits = incrementDepth(l.bits);
        var sizes = l.root.sizes === undefined
            ? undefined
            : [32, arrayLast(l.root.sizes) + 32];
        newOffset = depth === 0 ? 0 : Math.pow(32, (depth + 1)) - 32;
        l.root = new Node(sizes, [createPath(depth, node), l.root]);
    }
    return newOffset;
}
function prependNodeToTree(l, array) {
    if (l.root === undefined) {
        if (getSuffixSize(l) === 0) {
            l.bits = setSuffix(array.length, l.bits);
            l.suffix = array;
        }
        else {
            l.root = new Node(undefined, array);
        }
        return l;
    }
    else {
        var node = new Node(undefined, array);
        var depth = getDepth(l);
        var newOffset_1 = 0;
        if (l.root.sizes === undefined) {
            if (l.offset !== 0) {
                newOffset_1 = l.offset - branchingFactor;
                l.root = prependDense(l.root, depth, l.offset, node);
            }
            else {
                newOffset_1 = prependTopTree(l, depth, node);
            }
        }
        else {
            var copyableCount = 0;
            var nodesTraversed = 0;
            var currentNode = l.root;
            while (currentNode.sizes !== undefined && nodesTraversed < depth) {
                ++nodesTraversed;
                if (currentNode.array.length < 32) {
                    copyableCount = nodesTraversed;
                }
                currentNode = currentNode.array[0];
            }
            if (l.offset !== 0) {
                var copiedNode = copyLeft(l, nodesTraversed);
                for (var i = 0; i < copiedNode.sizes.length; ++i) {
                    copiedNode.sizes[i] += branchingFactor;
                }
                copiedNode.array[0] = prependDense(copiedNode.array[0], depth - nodesTraversed, l.offset, node);
                l.offset = l.offset - branchingFactor;
                return l;
            }
            else {
                if (copyableCount === 0) {
                    l.offset = prependTopTree(l, depth, node);
                }
                else {
                    var parent_1;
                    var prependableNode = void 0;
                    if (copyableCount > 1) {
                        parent_1 = copyLeft(l, copyableCount - 1);
                        prependableNode = parent_1.array[0];
                    }
                    else {
                        parent_1 = undefined;
                        prependableNode = l.root;
                    }
                    var path = createPath(depth - copyableCount, node);
                    l.offset = Math.pow(32, (depth - copyableCount + 1)) - 32;
                    var prepended = nodePrepend(path, 32, prependableNode);
                    if (parent_1 === undefined) {
                        l.root = prepended;
                    }
                    else {
                        parent_1.array[0] = prepended;
                    }
                }
                return l;
            }
        }
        l.offset = newOffset_1;
        return l;
    }
}
function prependDense(node, depth, offset, value) {
    var curOffset = (offset >> (depth * branchBits)) & mask;
    var path = (((offset - 1) >> (depth * branchBits)) & mask) - curOffset;
    if (path < 0) {
        return new Node(undefined, arrayPrepend(createPath(depth - 1, value), node.array));
    }
    else {
        var array = copyArray(node.array);
        array[0] = prependDense(array[0], depth - 1, offset, value);
        return new Node(undefined, array);
    }
}
function append(value, l) {
    var suffixSize = getSuffixSize(l);
    if (suffixSize < 32) {
        return new List(incrementSuffix(l.bits), l.offset, l.length + 1, l.prefix, l.root, affixPush(value, l.suffix, suffixSize));
    }
    var newSuffix = [value];
    var newList = cloneList(l);
    appendNodeToTree(newList, l.suffix);
    newList.suffix = newSuffix;
    newList.length++;
    newList.bits = setSuffix(1, newList.bits);
    return newList;
}
exports.append = append;
function length(l) {
    return l.length;
}
exports.length = length;
function first(l) {
    var prefixSize = getPrefixSize(l);
    return prefixSize !== 0
        ? l.prefix[prefixSize - 1]
        : l.length !== 0
            ? l.suffix[0]
            : undefined;
}
exports.first = first;
exports.head = first;
function last(l) {
    var suffixSize = getSuffixSize(l);
    return suffixSize !== 0
        ? l.suffix[suffixSize - 1]
        : l.length !== 0
            ? l.prefix[0]
            : undefined;
}
exports.last = last;
function mapArray(f, array) {
    var result = new Array(array.length);
    for (var i = 0; i < array.length; ++i) {
        result[i] = f(array[i]);
    }
    return result;
}
function mapNode(f, node, depth) {
    if (depth !== 0) {
        var array = node.array;
        var result = new Array(array.length);
        for (var i = 0; i < array.length; ++i) {
            result[i] = mapNode(f, array[i], depth - 1);
        }
        return new Node(node.sizes, result);
    }
    else {
        return new Node(undefined, mapArray(f, node.array));
    }
}
function mapPrefix(f, prefix, length) {
    var newPrefix = new Array(length);
    for (var i = length - 1; 0 <= i; --i) {
        newPrefix[i] = f(prefix[i]);
    }
    return newPrefix;
}
function mapAffix(f, suffix, length) {
    var newSuffix = new Array(length);
    for (var i = 0; i < length; ++i) {
        newSuffix[i] = f(suffix[i]);
    }
    return newSuffix;
}
function map(f, l) {
    return new List(l.bits, l.offset, l.length, mapPrefix(f, l.prefix, getPrefixSize(l)), l.root === undefined ? undefined : mapNode(f, l.root, getDepth(l)), mapAffix(f, l.suffix, getSuffixSize(l)));
}
exports.map = map;
function pluck(key, l) {
    return map(function (a) { return a[key]; }, l);
}
exports.pluck = pluck;
function foldlSuffix(f, acc, array, length) {
    for (var i = 0; i < length; ++i) {
        acc = f(acc, array[i]);
    }
    return acc;
}
function foldlPrefix(f, acc, array, length) {
    for (var i = length - 1; 0 <= i; --i) {
        acc = f(acc, array[i]);
    }
    return acc;
}
function foldlNode(f, acc, node, depth) {
    var array = node.array;
    if (depth === 0) {
        return foldlSuffix(f, acc, array, array.length);
    }
    for (var i = 0; i < array.length; ++i) {
        acc = foldlNode(f, acc, array[i], depth - 1);
    }
    return acc;
}
function foldl(f, initial, l) {
    var suffixSize = getSuffixSize(l);
    var prefixSize = getPrefixSize(l);
    initial = foldlPrefix(f, initial, l.prefix, prefixSize);
    if (l.root !== undefined) {
        initial = foldlNode(f, initial, l.root, getDepth(l));
    }
    return foldlSuffix(f, initial, l.suffix, suffixSize);
}
exports.foldl = foldl;
exports.reduce = foldl;
function traverse(of, f, l) {
    return foldr(function (a, fl) {
        return fl["fantasy-land/ap"](f(a)["fantasy-land/map"](function (a) { return function (l) { return prepend(a, l); }; }));
    }, of["fantasy-land/of"](empty()), l);
}
exports.traverse = traverse;
function sequence(ofObj, l) {
    return traverse(ofObj, function (a) { return a; }, l);
}
exports.sequence = sequence;
function scan(f, initial, l) {
    return foldl(function (l2, a) { return push(f(last(l2), a), l2); }, push(initial, emptyPushable()), l);
}
exports.scan = scan;
function forEach(callback, l) {
    foldl(function (_, element) { return callback(element); }, undefined, l);
}
exports.forEach = forEach;
function filter(predicate, l) {
    return foldl(function (acc, a) { return (predicate(a) ? push(a, acc) : acc); }, emptyPushable(), l);
}
exports.filter = filter;
function reject(predicate, l) {
    return foldl(function (acc, a) { return (predicate(a) ? acc : push(a, acc)); }, emptyPushable(), l);
}
exports.reject = reject;
function partition(predicate, l) {
    return foldl(function (arr, a) { return (predicate(a) ? push(a, arr[0]) : push(a, arr[1]), arr); }, [emptyPushable(), emptyPushable()], l);
}
exports.partition = partition;
function join(separator, l) {
    return foldl(function (a, b) { return (a.length === 0 ? b : a + separator + b); }, "", l);
}
exports.join = join;
function foldrSuffix(f, initial, array, length) {
    var acc = initial;
    for (var i = length - 1; 0 <= i; --i) {
        acc = f(array[i], acc);
    }
    return acc;
}
function foldrPrefix(f, initial, array, length) {
    var acc = initial;
    for (var i = 0; i < length; ++i) {
        acc = f(array[i], acc);
    }
    return acc;
}
function foldrNode(f, initial, _a, depth) {
    var array = _a.array;
    if (depth === 0) {
        return foldrSuffix(f, initial, array, array.length);
    }
    var acc = initial;
    for (var i = array.length - 1; 0 <= i; --i) {
        acc = foldrNode(f, acc, array[i], depth - 1);
    }
    return acc;
}
function foldr(f, initial, l) {
    var suffixSize = getSuffixSize(l);
    var prefixSize = getPrefixSize(l);
    var acc = foldrSuffix(f, initial, l.suffix, suffixSize);
    if (l.root !== undefined) {
        acc = foldrNode(f, acc, l.root, getDepth(l));
    }
    return foldrPrefix(f, acc, l.prefix, prefixSize);
}
exports.foldr = foldr;
exports.reduceRight = foldr;
function ap(listF, l) {
    return flatten(map(function (f) { return map(f, l); }, listF));
}
exports.ap = ap;
function flatten(nested) {
    return foldl(concat, empty(), nested);
}
exports.flatten = flatten;
function flatMap(f, l) {
    return flatten(map(f, l));
}
exports.flatMap = flatMap;
exports.chain = flatMap;
function foldlArrayCb(cb, state, array, from, to) {
    for (var i = from; i < to && cb(array[i], state); ++i) { }
    return i === to;
}
function foldrArrayCb(cb, state, array, from, to) {
    for (var i = from - 1; to <= i && cb(array[i], state); --i) { }
    return i === to - 1;
}
function foldlNodeCb(cb, state, node, depth) {
    var array = node.array;
    if (depth === 0) {
        return foldlArrayCb(cb, state, array, 0, array.length);
    }
    var to = array.length;
    for (var i = 0; i < to; ++i) {
        if (!foldlNodeCb(cb, state, array[i], depth - 1)) {
            return false;
        }
    }
    return true;
}
function foldlCb(cb, state, l) {
    var prefixSize = getPrefixSize(l);
    if (!foldrArrayCb(cb, state, l.prefix, prefixSize, 0) ||
        (l.root !== undefined && !foldlNodeCb(cb, state, l.root, getDepth(l)))) {
        return state;
    }
    var suffixSize = getSuffixSize(l);
    foldlArrayCb(cb, state, l.suffix, 0, suffixSize);
    return state;
}
function foldrNodeCb(cb, state, node, depth) {
    var array = node.array;
    if (depth === 0) {
        return foldrArrayCb(cb, state, array, array.length, 0);
    }
    for (var i = array.length - 1; 0 <= i; --i) {
        if (!foldrNodeCb(cb, state, array[i], depth - 1)) {
            return false;
        }
    }
    return true;
}
function foldrCb(cb, state, l) {
    var suffixSize = getSuffixSize(l);
    var prefixSize = getPrefixSize(l);
    if (!foldrArrayCb(cb, state, l.suffix, suffixSize, 0) ||
        (l.root !== undefined && !foldrNodeCb(cb, state, l.root, getDepth(l)))) {
        return state;
    }
    var prefix = l.prefix;
    foldlArrayCb(cb, state, l.prefix, prefix.length - prefixSize, prefix.length);
    return state;
}
function foldlWhileCb(a, state) {
    if (state.predicate(state.result, a) === false) {
        return false;
    }
    state.result = state.f(state.result, a);
    return true;
}
function foldlWhile(predicate, f, initial, l) {
    return foldlCb(foldlWhileCb, { predicate: predicate, f: f, result: initial }, l).result;
}
exports.foldlWhile = foldlWhile;
exports.reduceWhile = foldlWhile;
function everyCb(value, state) {
    return (state.result = state.predicate(value));
}
function every(predicate, l) {
    return foldlCb(everyCb, { predicate: predicate, result: true }, l).result;
}
exports.every = every;
exports.all = every;
function someCb(value, state) {
    return !(state.result = state.predicate(value));
}
function some(predicate, l) {
    return foldlCb(someCb, { predicate: predicate, result: false }, l).result;
}
exports.some = some;
exports.any = some;
function none(predicate, l) {
    return !some(predicate, l);
}
exports.none = none;
function findCb(value, state) {
    if (state.predicate(value)) {
        state.result = value;
        return false;
    }
    else {
        return true;
    }
}
function find(predicate, l) {
    return foldlCb(findCb, { predicate: predicate, result: undefined }, l)
        .result;
}
exports.find = find;
function findLast(predicate, l) {
    return foldrCb(findCb, { predicate: predicate, result: undefined }, l)
        .result;
}
exports.findLast = findLast;
function indexOfCb(value, state) {
    ++state.index;
    return !(state.found = elementEquals(value, state.element));
}
function indexOf(element, l) {
    var state = { element: element, found: false, index: -1 };
    foldlCb(indexOfCb, state, l);
    return state.found ? state.index : -1;
}
exports.indexOf = indexOf;
function lastIndexOf(element, l) {
    var state = { element: element, found: false, index: 0 };
    foldrCb(indexOfCb, state, l);
    return state.found ? l.length - state.index : -1;
}
exports.lastIndexOf = lastIndexOf;
function findIndexCb(value, state) {
    ++state.index;
    return !(state.found = state.predicate(value));
}
function findIndex(predicate, l) {
    var _a = foldlCb(findIndexCb, { predicate: predicate, found: false, index: -1 }, l), found = _a.found, index = _a.index;
    return found ? index : -1;
}
exports.findIndex = findIndex;
var containsState = {
    element: undefined,
    result: false
};
function containsCb(value, state) {
    return !(state.result = value === state.element);
}
function includes(element, l) {
    containsState.element = element;
    containsState.result = false;
    return foldlCb(containsCb, containsState, l).result;
}
exports.includes = includes;
exports.contains = includes;
function equalsCb(value2, state) {
    var value = state.iterator.next().value;
    return (state.equals = state.f(value, value2));
}
function equals(l1, l2) {
    return equalsWith(elementEquals, l1, l2);
}
exports.equals = equals;
function equalsWith(f, l1, l2) {
    if (l1 === l2) {
        return true;
    }
    else if (l1.length !== l2.length) {
        return false;
    }
    else {
        var s = { iterator: l2[Symbol.iterator](), equals: true, f: f };
        return foldlCb(equalsCb, s, l1).equals;
    }
}
exports.equalsWith = equalsWith;
var eMax = 2;
function createConcatPlan(array) {
    var sizes = [];
    var sum = 0;
    for (var i_2 = 0; i_2 < array.length; ++i_2) {
        sum += array[i_2].array.length;
        sizes[i_2] = array[i_2].array.length;
    }
    var optimalLength = Math.ceil(sum / branchingFactor);
    var n = array.length;
    var i = 0;
    if (optimalLength + eMax >= n) {
        return undefined;
    }
    while (optimalLength + eMax < n) {
        while (sizes[i] > branchingFactor - eMax / 2) {
            ++i;
        }
        var remaining = sizes[i];
        do {
            var size = Math.min(remaining + sizes[i + 1], branchingFactor);
            sizes[i] = size;
            remaining = remaining - (size - sizes[i + 1]);
            ++i;
        } while (remaining > 0);
        for (var j = i; j <= n - 1; ++j) {
            sizes[j] = sizes[j + 1];
        }
        --i;
        --n;
    }
    sizes.length = n;
    return sizes;
}
function concatNodeMerge(left, center, right) {
    var array = [];
    if (left !== undefined) {
        for (var i = 0; i < left.array.length - 1; ++i) {
            array.push(left.array[i]);
        }
    }
    for (var i = 0; i < center.array.length; ++i) {
        array.push(center.array[i]);
    }
    if (right !== undefined) {
        for (var i = 1; i < right.array.length; ++i) {
            array.push(right.array[i]);
        }
    }
    return array;
}
function executeConcatPlan(merged, plan, height) {
    var result = [];
    var sourceIdx = 0;
    var offset = 0;
    for (var _i = 0, plan_1 = plan; _i < plan_1.length; _i++) {
        var toMove = plan_1[_i];
        var source = merged[sourceIdx].array;
        if (toMove === source.length && offset === 0) {
            result.push(merged[sourceIdx]);
            ++sourceIdx;
        }
        else {
            var node = new Node(undefined, []);
            while (toMove > 0) {
                var available = source.length - offset;
                var itemsToCopy = Math.min(toMove, available);
                pushElements(source, node.array, offset, itemsToCopy);
                if (toMove >= available) {
                    ++sourceIdx;
                    source = merged[sourceIdx].array;
                    offset = 0;
                }
                else {
                    offset += itemsToCopy;
                }
                toMove -= itemsToCopy;
            }
            if (height > 1) {
                setSizes(node, height - 1);
            }
            result.push(node);
        }
    }
    return result;
}
function rebalance(left, center, right, height, top) {
    var merged = concatNodeMerge(left, center, right);
    var plan = createConcatPlan(merged);
    var balanced = plan !== undefined ? executeConcatPlan(merged, plan, height) : merged;
    if (balanced.length <= branchingFactor) {
        if (top === true) {
            return new Node(undefined, balanced);
        }
        else {
            return new Node(undefined, [
                setSizes(new Node(undefined, balanced), height)
            ]);
        }
    }
    else {
        return new Node(undefined, [
            setSizes(new Node(undefined, balanced.slice(0, branchingFactor)), height),
            setSizes(new Node(undefined, balanced.slice(branchingFactor)), height)
        ]);
    }
}
function concatSubTree(left, lDepth, right, rDepth, isTop) {
    if (lDepth > rDepth) {
        var c = concatSubTree(arrayLast(left.array), lDepth - 1, right, rDepth, false);
        return rebalance(left, c, undefined, lDepth, isTop);
    }
    else if (lDepth < rDepth) {
        var c = concatSubTree(left, lDepth, arrayFirst(right.array), rDepth - 1, false);
        return rebalance(undefined, c, right, rDepth, isTop);
    }
    else if (lDepth === 0) {
        return new Node(undefined, [left, right]);
    }
    else {
        var c = concatSubTree(arrayLast(left.array), lDepth - 1, arrayFirst(right.array), rDepth - 1, false);
        return rebalance(left, c, right, lDepth, isTop);
    }
}
function getHeight(node) {
    if (node.array[0] instanceof Node) {
        return 1 + getHeight(node.array[0]);
    }
    else {
        return 0;
    }
}
function appendNodeToTree(l, array) {
    if (l.root === undefined) {
        if (getPrefixSize(l) === 0) {
            l.bits = setPrefix(array.length, l.bits);
            l.prefix = reverseArray(array);
        }
        else {
            l.root = new Node(undefined, array);
        }
        return l;
    }
    var depth = getDepth(l);
    var index = handleOffset(depth, l.offset, l.length - 1 - getPrefixSize(l));
    var nodesToCopy = 0;
    var nodesVisited = 0;
    var shift = depth * 5;
    var currentNode = l.root;
    if (Math.pow(32, (depth + 1)) < index) {
        shift = 0;
        nodesVisited = depth;
    }
    while (shift > 5) {
        var childIndex = void 0;
        if (currentNode.sizes === undefined) {
            childIndex = (index >> shift) & mask;
            index &= ~(mask << shift);
        }
        else {
            childIndex = currentNode.array.length - 1;
            index -= currentNode.sizes[childIndex - 1];
        }
        nodesVisited++;
        if (childIndex < mask) {
            nodesToCopy = nodesVisited;
        }
        currentNode = currentNode.array[childIndex];
        if (currentNode === undefined) {
            nodesToCopy = nodesVisited;
            shift = 5;
        }
        shift -= 5;
    }
    if (shift !== 0) {
        nodesVisited++;
        if (currentNode.array.length < branchingFactor) {
            nodesToCopy = nodesVisited;
        }
    }
    var node = new Node(undefined, array);
    if (nodesToCopy === 0) {
        var newPath = nodesVisited === 0 ? node : createPath(nodesVisited, node);
        var newRoot = new Node(undefined, [l.root, newPath]);
        l.root = newRoot;
        l.bits = incrementDepth(l.bits);
    }
    else {
        var copiedNode = copyFirstK(l, nodesToCopy, array.length);
        copiedNode.array.push(createPath(depth - nodesToCopy, node));
    }
    return l;
}
function copyFirstK(newList, k, leafSize) {
    var currentNode = cloneNode(newList.root);
    newList.root = currentNode;
    for (var i = 1; i < k; ++i) {
        var index = currentNode.array.length - 1;
        if (currentNode.sizes !== undefined) {
            currentNode.sizes[index] += leafSize;
        }
        var newNode = cloneNode(currentNode.array[index]);
        currentNode.array[index] = newNode;
        currentNode = newNode;
    }
    if (currentNode.sizes !== undefined) {
        currentNode.sizes.push(arrayLast(currentNode.sizes) + leafSize);
    }
    return currentNode;
}
var concatBuffer = new Array(3);
function concatAffixes(left, right) {
    var nr = 0;
    var arrIdx = 0;
    var i = 0;
    var length = getSuffixSize(left);
    concatBuffer[nr] = [];
    for (i = 0; i < length; ++i) {
        concatBuffer[nr][arrIdx++] = left.suffix[i];
    }
    length = getPrefixSize(right);
    for (i = 0; i < length; ++i) {
        if (arrIdx === 32) {
            arrIdx = 0;
            ++nr;
            concatBuffer[nr] = [];
        }
        concatBuffer[nr][arrIdx++] = right.prefix[length - 1 - i];
    }
    length = getSuffixSize(right);
    for (i = 0; i < length; ++i) {
        if (arrIdx === 32) {
            arrIdx = 0;
            ++nr;
            concatBuffer[nr] = [];
        }
        concatBuffer[nr][arrIdx++] = right.suffix[i];
    }
    return nr;
}
function concat(left, right) {
    if (left.length === 0) {
        return right;
    }
    else if (right.length === 0) {
        return left;
    }
    var newSize = left.length + right.length;
    var rightSuffixSize = getSuffixSize(right);
    var newList = cloneList(left);
    if (right.root === undefined) {
        var nrOfAffixes = concatAffixes(left, right);
        for (var i = 0; i < nrOfAffixes; ++i) {
            newList = appendNodeToTree(newList, concatBuffer[i]);
            newList.length += concatBuffer[i].length;
            concatBuffer[i] = undefined;
        }
        newList.length = newSize;
        newList.suffix = concatBuffer[nrOfAffixes];
        newList.bits = setSuffix(concatBuffer[nrOfAffixes].length, newList.bits);
        concatBuffer[nrOfAffixes] = undefined;
        return newList;
    }
    else {
        var leftSuffixSize = getSuffixSize(left);
        if (leftSuffixSize > 0) {
            newList = appendNodeToTree(newList, left.suffix.slice(0, leftSuffixSize));
            newList.length += leftSuffixSize;
        }
        newList = appendNodeToTree(newList, right.prefix.slice(0, getPrefixSize(right)).reverse());
        var newNode = concatSubTree(newList.root, getDepth(newList), right.root, getDepth(right), true);
        var newDepth = getHeight(newNode);
        setSizes(newNode, newDepth);
        newList.root = newNode;
        newList.offset &= ~(mask << (getDepth(left) * branchBits));
        newList.length = newSize;
        newList.bits = setSuffix(rightSuffixSize, setDepth(newDepth, newList.bits));
        newList.suffix = right.suffix;
        return newList;
    }
}
exports.concat = concat;
function update(index, a, l) {
    if (index < 0 || l.length <= index) {
        return l;
    }
    var prefixSize = getPrefixSize(l);
    var suffixSize = getSuffixSize(l);
    var newList = cloneList(l);
    if (index < prefixSize) {
        var newPrefix = copyArray(newList.prefix);
        newPrefix[newPrefix.length - index - 1] = a;
        newList.prefix = newPrefix;
    }
    else if (index >= l.length - suffixSize) {
        var newSuffix = copyArray(newList.suffix);
        newSuffix[index - (l.length - suffixSize)] = a;
        newList.suffix = newSuffix;
    }
    else {
        newList.root = updateNode(l.root, getDepth(l), index - prefixSize, l.offset, a);
    }
    return newList;
}
exports.update = update;
function adjust(index, f, l) {
    if (index < 0 || l.length <= index) {
        return l;
    }
    return update(index, f(nth(index, l)), l);
}
exports.adjust = adjust;
var newAffix;
function sliceNode(node, index, depth, pathLeft, pathRight, childLeft, childRight) {
    var array = node.array.slice(pathLeft, pathRight + 1);
    if (childLeft !== undefined) {
        array[0] = childLeft;
    }
    if (childRight !== undefined) {
        array[array.length - 1] = childRight;
    }
    var sizes = node.sizes;
    if (sizes !== undefined) {
        sizes = sizes.slice(pathLeft, pathRight + 1);
        var slicedOffLeft = pathLeft !== 0 ? node.sizes[pathLeft - 1] : 0;
        if (childLeft !== undefined) {
            if (childLeft.sizes !== undefined) {
                var oldChild = node.array[pathLeft];
                slicedOffLeft +=
                    arrayLast(oldChild.sizes) - arrayLast(childLeft.sizes);
            }
            else {
                slicedOffLeft += ((index - slicedOffLeft) & ~31) + 32;
            }
        }
        for (var i = 0; i < sizes.length; ++i) {
            sizes[i] -= slicedOffLeft;
        }
        if (childRight !== undefined) {
            var slicedOffRight = sizeOfSubtree(node.array[pathRight], depth - 1) -
                sizeOfSubtree(childRight, depth - 1);
            sizes[sizes.length - 1] -= slicedOffRight;
        }
    }
    return new Node(sizes, array);
}
var newOffset = 0;
function sliceLeft(tree, depth, index, offset, top) {
    var _a = getPath(index, offset, depth, tree.sizes), path = _a.path, newIndex = _a.index, updatedOffset = _a.updatedOffset;
    if (depth === 0) {
        newAffix = tree.array.slice(path).reverse();
        return undefined;
    }
    else {
        var child = sliceLeft(tree.array[path], depth - 1, newIndex, updatedOffset, false);
        if (child === undefined) {
            ++path;
            if (path === tree.array.length) {
                return undefined;
            }
        }
        if (tree.sizes === undefined && top === false) {
            newOffset |= (32 - (tree.array.length - path)) << (depth * branchBits);
        }
        return sliceNode(tree, index, depth, path, tree.array.length - 1, child, undefined);
    }
}
function sliceRight(node, depth, index, offset) {
    var _a = getPath(index, offset, depth, node.sizes), path = _a.path, newIndex = _a.index;
    if (depth === 0) {
        newAffix = node.array.slice(0, path + 1);
        return undefined;
    }
    else {
        var child = sliceRight(node.array[path], depth - 1, newIndex, path === 0 ? offset : 0);
        if (child === undefined) {
            --path;
            if (path === -1) {
                return undefined;
            }
        }
        var array = node.array.slice(0, path + 1);
        if (child !== undefined) {
            array[array.length - 1] = child;
        }
        var sizes = node.sizes;
        if (sizes !== undefined) {
            sizes = sizes.slice(0, path + 1);
            if (child !== undefined) {
                var slicedOff = sizeOfSubtree(node.array[path], depth - 1) -
                    sizeOfSubtree(child, depth - 1);
                sizes[sizes.length - 1] -= slicedOff;
            }
        }
        return new Node(sizes, array);
    }
}
function sliceTreeList(from, to, tree, depth, offset, l) {
    var sizes = tree.sizes;
    var _a = getPath(from, offset, depth, sizes), pathLeft = _a.path, newFrom = _a.index;
    var _b = getPath(to, offset, depth, sizes), pathRight = _b.path, newTo = _b.index;
    if (depth === 0) {
        l.prefix = emptyAffix;
        l.suffix = tree.array.slice(pathLeft, pathRight + 1);
        l.root = undefined;
        l.bits = setSuffix(pathRight - pathLeft + 1, 0);
        return l;
    }
    else if (pathLeft === pathRight) {
        l.bits = decrementDepth(l.bits);
        return sliceTreeList(newFrom, newTo, tree.array[pathLeft], depth - 1, pathLeft === 0 ? offset : 0, l);
    }
    else {
        var childRight = sliceRight(tree.array[pathRight], depth - 1, newTo, 0);
        l.bits = setSuffix(newAffix.length, l.bits);
        l.suffix = newAffix;
        if (childRight === undefined) {
            --pathRight;
        }
        newOffset = 0;
        var childLeft = sliceLeft(tree.array[pathLeft], depth - 1, newFrom, pathLeft === 0 ? offset : 0, pathLeft === pathRight);
        l.offset = newOffset;
        l.bits = setPrefix(newAffix.length, l.bits);
        l.prefix = newAffix;
        if (childLeft === undefined) {
            ++pathLeft;
        }
        if (pathLeft >= pathRight) {
            if (pathLeft > pathRight) {
                l.bits = setDepth(0, l.bits);
                l.root = undefined;
            }
            else {
                l.bits = decrementDepth(l.bits);
                var newRoot = childRight !== undefined
                    ? childRight
                    : childLeft !== undefined
                        ? childLeft
                        : tree.array[pathLeft];
                l.root = new Node(newRoot.sizes, newRoot.array);
            }
        }
        else {
            l.root = sliceNode(tree, from, depth, pathLeft, pathRight, childLeft, childRight);
        }
        return l;
    }
}
function slice(from, to, l) {
    var bits = l.bits, length = l.length;
    to = Math.min(length, to);
    if (from < 0) {
        from = length + from;
    }
    if (to < 0) {
        to = length + to;
    }
    if (to <= from || to <= 0 || length <= from) {
        return empty();
    }
    if (from <= 0 && length <= to) {
        return l;
    }
    var newLength = to - from;
    var prefixSize = getPrefixSize(l);
    var suffixSize = getSuffixSize(l);
    if (to <= prefixSize) {
        return new List(setPrefix(newLength, 0), 0, newLength, l.prefix.slice(prefixSize - to, prefixSize - from), undefined, emptyAffix);
    }
    var suffixStart = length - suffixSize;
    if (suffixStart <= from) {
        return new List(setSuffix(newLength, 0), 0, newLength, emptyAffix, undefined, l.suffix.slice(from - suffixStart, to - suffixStart));
    }
    var newList = cloneList(l);
    newList.length = newLength;
    if (prefixSize <= from && to <= suffixStart) {
        sliceTreeList(from - prefixSize + l.offset, to - prefixSize + l.offset - 1, l.root, getDepth(l), l.offset, newList);
        return newList;
    }
    if (0 < from) {
        if (from < prefixSize) {
            newList.prefix = l.prefix.slice(0, prefixSize - from);
            bits = setPrefix(prefixSize - from, bits);
        }
        else {
            newOffset = 0;
            newList.root = sliceLeft(newList.root, getDepth(l), from - prefixSize, l.offset, true);
            newList.offset = newOffset;
            if (newList.root === undefined) {
                bits = setDepth(0, bits);
            }
            bits = setPrefix(newAffix.length, bits);
            prefixSize = newAffix.length;
            newList.prefix = newAffix;
        }
    }
    if (to < length) {
        if (length - to < suffixSize) {
            bits = setSuffix(suffixSize - (length - to), bits);
            newList.suffix = l.suffix.slice(0, suffixSize - (length - to));
        }
        else {
            newList.root = sliceRight(newList.root, getDepth(l), to - prefixSize - 1, newList.offset);
            if (newList.root === undefined) {
                bits = setDepth(0, bits);
                newList.offset = 0;
            }
            bits = setSuffix(newAffix.length, bits);
            newList.suffix = newAffix;
        }
    }
    newList.bits = bits;
    return newList;
}
exports.slice = slice;
function take(n, l) {
    return slice(0, n, l);
}
exports.take = take;
function findNotIndexCb(value, state) {
    if (state.predicate(value)) {
        ++state.index;
        return true;
    }
    else {
        return false;
    }
}
function takeWhile(predicate, l) {
    var index = foldlCb(findNotIndexCb, { predicate: predicate, index: 0 }, l).index;
    return slice(0, index, l);
}
exports.takeWhile = takeWhile;
function takeLastWhile(predicate, l) {
    var index = foldrCb(findNotIndexCb, { predicate: predicate, index: 0 }, l).index;
    return slice(l.length - index, l.length, l);
}
exports.takeLastWhile = takeLastWhile;
function dropWhile(predicate, l) {
    var index = foldlCb(findNotIndexCb, { predicate: predicate, index: 0 }, l).index;
    return slice(index, l.length, l);
}
exports.dropWhile = dropWhile;
function dropRepeats(l) {
    return dropRepeatsWith(elementEquals, l);
}
exports.dropRepeats = dropRepeats;
function dropRepeatsWith(predicate, l) {
    return foldl(function (acc, a) {
        return acc.length !== 0 && predicate(last(acc), a) ? acc : push(a, acc);
    }, emptyPushable(), l);
}
exports.dropRepeatsWith = dropRepeatsWith;
function takeLast(n, l) {
    return slice(l.length - n, l.length, l);
}
exports.takeLast = takeLast;
function splitAt(index, l) {
    return [slice(0, index, l), slice(index, l.length, l)];
}
exports.splitAt = splitAt;
function splitWhen(predicate, l) {
    var idx = findIndex(predicate, l);
    return idx === -1 ? [l, empty()] : splitAt(idx, l);
}
exports.splitWhen = splitWhen;
function splitEvery(size, l) {
    var _a = foldl(function (_a, elm) {
        var l2 = _a.l2, buffer = _a.buffer;
        push(elm, buffer);
        if (buffer.length === size) {
            return { l2: push(buffer, l2), buffer: emptyPushable() };
        }
        else {
            return { l2: l2, buffer: buffer };
        }
    }, { l2: emptyPushable(), buffer: emptyPushable() }, l), l2 = _a.l2, buffer = _a.buffer;
    return buffer.length === 0 ? l2 : push(buffer, l2);
}
exports.splitEvery = splitEvery;
function remove(from, amount, l) {
    return concat(slice(0, from, l), slice(from + amount, l.length, l));
}
exports.remove = remove;
function drop(n, l) {
    return slice(n, l.length, l);
}
exports.drop = drop;
function dropLast(n, l) {
    return slice(0, l.length - n, l);
}
exports.dropLast = dropLast;
function pop(l) {
    return slice(0, -1, l);
}
exports.pop = pop;
exports.init = pop;
function tail(l) {
    return slice(1, l.length, l);
}
exports.tail = tail;
function arrayPush(array, a) {
    array.push(a);
    return array;
}
function toArray(l) {
    return foldl(arrayPush, [], l);
}
exports.toArray = toArray;
function insert(index, element, l) {
    return concat(append(element, slice(0, index, l)), slice(index, l.length, l));
}
exports.insert = insert;
function insertAll(index, elements, l) {
    return concat(concat(slice(0, index, l), elements), slice(index, l.length, l));
}
exports.insertAll = insertAll;
function reverse(l) {
    return foldl(function (newL, element) { return prepend(element, newL); }, empty(), l);
}
exports.reverse = reverse;
function isList(l) {
    return typeof l === "object" && Array.isArray(l.suffix);
}
exports.isList = isList;
function zip(as, bs) {
    return zipWith(function (a, b) { return [a, b]; }, as, bs);
}
exports.zip = zip;
function zipWith(f, as, bs) {
    var swapped = bs.length < as.length;
    var iterator = (swapped ? as : bs)[Symbol.iterator]();
    return map(function (a) {
        var b = iterator.next().value;
        return swapped ? f(b, a) : f(a, b);
    }, (swapped ? bs : as));
}
exports.zipWith = zipWith;
function isPrimitive(value) {
    return typeof value === "number" || typeof value === "string";
}
function comparePrimitive(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
}
var ord = "fantasy-land/lte";
function compareOrd(a, b) {
    return a[ord](b) ? (b[ord](a) ? 0 : -1) : 1;
}
function sort(l) {
    if (l.length === 0) {
        return l;
    }
    else if (isPrimitive(first(l))) {
        return from(toArray(l).sort(comparePrimitive));
    }
    else {
        return sortWith(compareOrd, l);
    }
}
exports.sort = sort;
function sortWith(comparator, l) {
    var arr = [];
    var i = 0;
    forEach(function (elm) { return arr.push({ idx: i++, elm: elm }); }, l);
    arr.sort(function (_a, _b) {
        var a = _a.elm, i = _a.idx;
        var b = _b.elm, j = _b.idx;
        var c = comparator(a, b);
        return c !== 0 ? c : i < j ? -1 : 1;
    });
    var newL = emptyPushable();
    for (var i_3 = 0; i_3 < arr.length; ++i_3) {
        push(arr[i_3].elm, newL);
    }
    return newL;
}
exports.sortWith = sortWith;
function sortBy(f, l) {
    if (l.length === 0) {
        return l;
    }
    var arr = [];
    var i = 0;
    forEach(function (elm) { return arr.push({ idx: i++, elm: elm, prop: f(elm) }); }, l);
    var comparator = isPrimitive(arr[0].prop)
        ? comparePrimitive
        : compareOrd;
    arr.sort(function (_a, _b) {
        var a = _a.prop, i = _a.idx;
        var b = _b.prop, j = _b.idx;
        var c = comparator(a, b);
        return c !== 0 ? c : i < j ? -1 : 1;
    });
    var newL = emptyPushable();
    for (var i_4 = 0; i_4 < arr.length; ++i_4) {
        push(arr[i_4].elm, newL);
    }
    return newL;
}
exports.sortBy = sortBy;
function group(l) {
    return groupWith(elementEquals, l);
}
exports.group = group;
function groupWith(f, l) {
    var result = emptyPushable();
    var buffer = emptyPushable();
    forEach(function (a) {
        if (buffer.length !== 0 && !f(last(buffer), a)) {
            push(buffer, result);
            buffer = emptyPushable();
        }
        push(a, buffer);
    }, l);
    return buffer.length === 0 ? result : push(buffer, result);
}
exports.groupWith = groupWith;
function intersperse(separator, l) {
    return pop(foldl(function (l2, a) { return push(separator, push(a, l2)); }, emptyPushable(), l));
}
exports.intersperse = intersperse;
function isEmpty(l) {
    return l.length === 0;
}
exports.isEmpty = isEmpty;

},{}],21:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],22:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],23:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],24:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":23,"_process":21,"inherits":22}]},{},[18])(18)
});
