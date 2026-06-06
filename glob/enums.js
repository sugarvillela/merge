/* used by tokener and other parsing utils */
const tTypes = {// token types
    oBrace: "oBrace",   // {[
    cBrace: "cBrace",   // }]
    oBracket: "oBracket",   // [ used when specificity is needed to distinguish from { in source file
    cBracket: "cBracket",   // ]
    ocBrace: "ocBrace", // special case [] {}
    key: "key",         // key in kv pair
    numVal: "numVal",   // number value in kv pair
    qVal: "qVal",       // quoted string value in kv pair
    nqVal: "nqVal",     // non-quoted string value in kv pair
    guid: "guid",       // non-quoted string value starting with GUID in kv pair
    conn: "conn",       // connector: colon, comma, = 
    unk: "unk",
    endl: "endl",
    iClass: "iClass"    // class name after { in source file, for reconstructing with correct spacing
}

/* used by multi-line quote handlers */
const subtypes = {// quote types
    first: "first",
    mid: "mid",
    last: "last",
    only: "only"
};

/* used by diff */
const mTypes = {// match types
    none: 0,
    L: 1,
    R: 2,
    all: 3,     // matches entire path but not value
    exact: 4    // matches entire path and value
};

/* used by recursive json parsing*/
const cType = {// common types
    o: "o", // object
    a: "a", // array
    p: "p", // primitive
    n: "n", // null
};

const keys = {// special json keys for internal use
    objInfo: "MM_OBJ_INFO", // classname after {, iLine start, iLine end
    valInfo: "MM_VAL_INFO", // keys: type, subtype for qVal, iLine for val
}