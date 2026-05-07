

const STR_ID = "MMQQ_"; // json value prefix: long strings kept in Metadata to rejoin later

const TAB = 4;

const Metadata = (() => {
    let metadata = {};
    
    const disp = () => {
        console.log(metadata)
    }

    return {
        haveHeader: () => metadata.hasOwnProperty("header"),
        setHeader: (header) => metadata.header = header,
        getHeader: () => metadata.header,
        setFileMetadata: (fileMetadata) => metadata.fileMetadata = fileMetadata,
        getFileMetadata: () => metadata.fileMetadata,
        getMetadata: () => metadata,
        disp: disp,
        clear: () => {
            metadata = {};
        }
    };
})();

const Uq = (() => {
    let id = 0;
    
    return {
        next: () => ++id
    };
})();

const Util = (() => {
    const trimQuotes = (val) => {
        if(val.length >= 2 && val[0] === '"' && val[val.length - 1] === '"'){
            return val.substring(1, val.length - 1);
        }
        return val;
    };
    const ensureQuotes = (val) => {
        return `"${trimQuotes(val)}"`;
    }
    const ensureOpenQuote = (val) => {
        return `"${trimQuotes(val)}`;
    }
    const ensureCloseQuote = (val) => {
        return `${trimQuotes(val)}"`;
    }

    return {
        trimQuotes: trimQuotes,
        ensureQuotes: ensureQuotes,
        ensureOpenQuote: ensureOpenQuote,
        ensureCloseQuote: ensureCloseQuote
    };
})();

const newCharItr = (text) => {
    let i = 0;
    
    return {
        haveNext: () => i < text.length,
        havePeek: () => i < text.length - 1,
        inc: () => i++,
        curr: () => text[i],
        peek: () => text[i + 1],
        currIndex: () => i
    };
};

const newLineItr = (lines) => {
    const disp = () => {
        for(let line of lines){
            debugLine(line);
        }
    }
    
    let i = 0;
    
    return {
        haveNext: () => i < lines.length,
        havePeek: () => i < lines.length - 1,
        inc: () => i++,
        curr: () => lines[i],
        peek: () => lines[i + 1],
        currIndex: () => i,
        getLines: () => lines,
        disp: () => disp()
    };
};

const newLineObj = () => ({
        text: "",       // raw text
        k: "",          // parsed key and value
        v: "",
        iLine: 0,       // 0-index line in source file (display as 1-index)
        tab: 0,         // actual indent in source file * 1/4
        comma: false,   // format: add comma?
        isSplit: false, // format: ignore tab and join with previous line?
        type: lTypes.kv,
        group: 0,       // for locating array pattern in object group
        grpStart: false,
        grpEnd: false,
        oId: 0,         // object id for joining oBrace with cBrace
        parent: 0,      // oId of parent   
        children: [],   // oids of child objects
        toc: [],        // list of non-internal fields for restoring orig order of fields
    }
);

const debugLine = (line) => {
    const hasValue = (v) => {
        return(!!v || v === "0" || v === 0 || v === false);
    }
    let kv = "";
    if(hasValue(line.v)){
        if(hasValue(line.k)){
            kv = ` ${line.k}=${line.v} `;
        }
        else{
            kv = ` ""=${line.v} `;
        }
    }
    else if(hasValue(line.k)){
        kv = ` ${line.k}= `;
    }

    const text = line.text? ` ${line.text} `: "";

    let grp = "";
    if(line.grpStart){
        grp = "grpStart:" + line.group;
    }
    else if(line.grpEnd){
        grp = "grpEnd:" + line.group;
    }
    else if(line.group){
        grp = "grp:" + line.group;
    }
    // if(!line.type){
    //     console.error(line)
    // }

    let toc = "";
    if(line.toc?.length){
        toc = ` ${JSON.stringify(line.toc)} `;
    }
    const isSplit = line.isSplit? " isSplit " : "";

    const oId = line.oId? ` oId=${line.oId} ` : "";
    console.log(`${line.iLine + 1} ${line.type} tab:${line.tab}${text}${grp}${kv}${oId}${isSplit}${toc}`)
}

const debugOneTok = (t, ofInterest) => {  
    const buildValue = (t) => {
        const k = t.k? `- ${t.k} = ` : "";
        const v = t.v? `${t.v}` : "";
        return `${k}${v}`;
    }

    if(t){
        if(!ofInterest || ofInterest.includes(t.type)){
            const val = t.val || buildValue(t);
            const tab = t.tab || t.tab === 0? ` tab:${t.tab} ` : "";
            const qid = t.qid? ` qid:${t.qid}` : "";
            const size = t.size? ` size:${t.size}` : "";
            const oid = t.oid? ` oid:${t.oid}` : ""; 
            const split = t.split? ` split` : "";  
            const iClass = t.iClass? ` iClass:${t.iClass}` : ""; 
            const endl = t.endl? " endl" : ""; 
            const comma = t.comma? " comma" : ""; 
            const toc = t.toc?.length? ` toc:${JSON.stringify(t.toc)}` : "";
            // if(tok.type === tTypes.oBrace || tok.type === tTypes.cBrace){
            //     console.log(tok);
            // }
            //tok.home && console.log(`${tok.iLine + 1}:`);
            console.log(`${t.iLine + 1} ${t.type}: ${val}${tab}${endl}${comma}${qid}${size}${oid}${split}${iClass}${toc}`);
        }
    }
    else{
        console.log("null tok");
    }
}

const debugToks = (toks, ofInterest) => {
    console.log(`Tokens length`, toks.length)
    for(let t of toks){
        debugOneTok(t, ofInterest);
    }    
}