const NAMESPACE = "MM_";// json key prefix: internal use, formatting, classnames etc.

const MM_LIST = "MM_LIST"; // classname after {, iLine start, iLine end
const MM_TAB = "MM_TAB";        // placement on reconstruct
const MM_SPLIT = "MM_SPLIT";    // if true, ignore tab on reconstruct
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

const getType = (obj) => {
    if(obj === null){
        return cType.n;
    }
    if(Array.isArray(obj)){
        return cType.a;
    }
    if(typeof obj === 'object'){
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