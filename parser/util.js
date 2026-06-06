

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
            const subtype = t.subtype? ` ${t.subtype}` : "";// set but not used
            const comma = t.comma? " comma" : ""; 
            const valInfo = t.valInfo?.length? ` valInfo:${JSON.stringify(t.valInfo)}` : "";
            console.log(
                `${t.iLine + 1} ${t.type}: ${val}${tab}${endl}${comma}${qid}${size}${oid}${split}${iClass}${subtype}${valInfo}`
            );
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