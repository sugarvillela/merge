const NAMESPACE = "MM_";// json key prefix: internal use, formatting, classnames etc.

const MM_CLASS = "MM_ICLASS";   // classname after {
const MM_TAB = "MM_TAB";        // placement on reconstruct
const MM_SPLIT = "MM_SPLIT";    // if true, ignore tab on reconstruct
const MM_TOC = "MM_TOC";        // list of object keys, in order
const MM_OID = "MM_OID";        // unique id for each object
const MM_PARENT = "MM_PARENT";  // parent id for child object, undefined if root
const MM_CHILDREN = "MM_CHILDREN";// list of child ids for parent object

const PATH_JOIN = "/";

// routing to and from local storage
const STORE_SOURCE = 0;
const STORE_JSON = 1;
const STORE_REGEN = 2;

// data subject
const LEFT = 0;
const RIGHT = 1;

const StoreNames = ["src", "json", "regen"];
const SubjectNames = ["left", "right"];

const lTypes = {// line types
    kv: "kv",           // key val
    kvnq: "kvnq",       // key val no quotes
    kvnum: "kvnum",     // key val number
    mlq: "mlq",         // multi-line quote
    oBrace: "{",
    cBrace: "}",
    oBracket: "[",
    cBracket: "]",
    split: "split",     // key object
    sublist: "sublist", // table of contents, children
    iClass: "iClass",
    plain: "plain"      // plain text for header
};

const cType = {// common types
    o: "o", // object
    a: "a", // array
    p: "p"  // primitive
};

const getType = (obj) => {
    if(Array.isArray(obj)){
        return cType.a;
    }
    if(typeof obj === 'object' && obj !== null){
        return cType.o;
    }
    return cType.p;
}

const hash32 = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) + h) ^ s.charCodeAt(i);
    }
    return h | 0;
}