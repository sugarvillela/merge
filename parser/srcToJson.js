

const newTokClean = (tokens) => {
    const mergeClassNames = () => {
        for(let i = 0; i < tokens.length - 1; i++){
            const t = tokens[i];
            const tNext = tokens[i + 1];
            if(t.type === tTypes.oBrace && tNext.type === tTypes.iClass){
                t.iClass = tNext.val;
            }
        }
        tokens = tokens.filter(
            (t) => t.type !== tTypes.iClass
        );
    };

    const trimAll = () => {
        tokens.forEach((t) => {
            switch(t.type){
                case tTypes.nqVal:
                    t.val = Util.ensureQuotes(t.val);
                    break;
                case tTypes.conn:
                    t.val = t.val.trim();
                    break;
                case tTypes.key:
                    t.val = t.val.trim();
                    if(t.val.startsWith("- ")){// special trim for keys, remove leading dash if present
                        t.val = t.val.substring(2);
                    }
                    t.val = Util.ensureQuotes(t.val);
            }
        });
    };

    const fixConns = () => {
        tokens.forEach((t) => {
            if(t.val === "=" && t.type === tTypes.conn){
                t.val = ":";
            }
        });
    };

    const killSemicolons = () => {
        tokens = tokens.filter((t) => t.type !== tTypes.conn || t.val !== ";" );
    };

    const markSplits = () => {
        const objPattern = [tTypes.conn, tTypes.endl, tTypes.oBrace];
        const arrPattern = [tTypes.conn, tTypes.endl, tTypes.oBracket, tTypes.oBrace];

        const findPattern = (pattern, i) => {
            //console.log(pattern)
            let t = null;
            for(let j = i, k = 0; j < tokens.length && k < pattern.length; j++, k++){
                t = tokens[j];
                //console.log(t?.iLine, "loop", t?.type, "pattern", pattern[k])
                if(t.type !== pattern[k]){
                    //console.log(t?.iLine, "null", t?.type, "pattern", pattern[k])
                    return null;
                }
            }
            //console.log(t?.iLine, "finish", t?.type)
            return t?.type === tTypes.oBrace? t : null;
        }

        for(let i = 0; i < tokens.length; i++){
            if(tokens[i].type === tTypes.conn){
                //debugOneTok(tokens[i])
                let t = null;
                if(
                    (t = findPattern(objPattern, i))// || (t = findPattern(arrPattern, i))
                )
                {
                    t.split = true;
                }
            }
        }
        tokens = tokens.filter(
            (t) => t.type !== tTypes.endl && t.type !== tTypes.iClass
        );
    };

    const killEndl = () => {
        tokens = tokens.filter(
            (t) => t.type !== tTypes.endl
        );
    };

    const init = () => {
        if(tokens[0].type !== tTypes.oBrace){// remove header string
            Metadata.setHeader(tokens[0].val.trim());
            tokens.shift();
        }
        mergeClassNames();
        trimAll();
        fixConns();
        killSemicolons();
        markSplits();
        killEndl();
        tokens.forEach((t) => {
            if(t.type === tTypes.unk){
                t.val = JSON.stringify(Util.trimQuotes(t.val));// wrap unknown values in quotes to preserve as strings in JSON
            }
        })
    }

    init();

    return {
        getToks: () => tokens
    };
}

const newMlqMerge = (tokens) => {
    const map = {};

    const add = () => {
        for(t of tokens){
            if(t.type === tTypes.qVal){
                let qList = map[t.qid] || (map[t.qid] = []);
                qList.push(t);
            }
        }
    };

    const merge = () => {
        for(let i = 0; i < tokens.length - 1; i++){
            const t = tokens[i];

            if(t.type === tTypes.qVal){
                const qList = map[t.qid];
                if(qList){
                    if(qList.length > 1){
                        const values = qList.map(qt => qt.val);
                        t.size = values.length;
                        t.val = JSON.stringify(
                            Util.trimQuotes(
                                values.join("\n")
                            )
                        );
                        t.type = tTypes.mlq;
                        //t.val = values.join("\n");
                        //console.log("a merge:", t.val)
                        map[t.qid] = null; // prevent duplicate merges
                    }
                    else if(t.val !== '""'){
                        t.val = JSON.stringify(
                            Util.trimQuotes(
                                t.val
                            )
                        );
                        //console.log("b merge:", t.val)
                        t.size = 1;
                    }
                }
                else{
                    tokens[i] = null; // remove quote tokens, only keep merged token
                }
            }
        }

        tokens = tokens.filter(t => t); // remove nulls
    };

    const init = () => {
        add();
        merge();
    }

    init();

    return {
        getToks: () => tokens,
    }
};

const newTabOps = (tokens) => {
    const ocMap = {};
    const coMap = {};
    let maxTab = 0;

    const setTabs = () => {
        let tab = 0;
        for(let t of tokens){
            if(t.type === tTypes.oBrace){
                t.oid = Uq.next();
                t.tab = tab;
                tab++;
                maxTab = Math.max(maxTab, tab);
            }
            else if(t.type === tTypes.cBrace){
                tab--;
                t.tab = tab;
            }
            else{
                t.tab = tab;
            }
        }
    };

    const linkOpenClose = () => {
        for(let tab = 0; tab <= maxTab; tab++){
            let oid = 0;
            for(let i = 0; i < tokens.length; i++){
                const t = tokens[i];
                if(t.tab === tab){
                    if(t.type === tTypes.oBrace){
                        oid = t.oid;
                        coMap[oid] = t;
                    }
                    else if(t.type === tTypes.cBrace){
                        if(oid){
                            t.oid = oid;
                            ocMap[oid] = t;
                            oid = 0;
                        }
                        else{
                            console.error(t);
                            //throw new Error("unmatched closing brace at line ", t.iLine + 1);
                        }
                    }
                }
            }
        }
        //console.log("ocMap", ocMap);
        //console.log("coMap", coMap);
    };

    const scrapeInfo = () => {
        const addTocItem = (toc, keyTok, valTok) => {
            const qSize = (valTok.size && valTok.size > 1)? `,"qSize":${valTok.size}` : "";
            toc.push(JSON.parse(`{"k":${keyTok.val},"type":"${valTok.type}","iLine":${keyTok.iLine}${qSize}}`));
            //toc.push(JSON.parse(`{"k":"someVal","type":"someType","iLine":23}`));
        };
        for(let tab = 1; tab <= maxTab; tab++){
            let toc = [];// table of contents for current tab level, reset at each new object at tab-1 level
            for(let i = 0; i < tokens.length; i++){
                const t = tokens[i];
                if(t.type === tTypes.oBrace){
                    if(t.tab === tab - 1){
                        //console.log(t.iLine, ": oBrace:", t.tab, t.oid, JSON.stringify(toc));
                        toc = []; // reset toc for new object
                    }
                }
                else if(t.type === tTypes.cBrace){
                    if(t.tab === tab - 1){
                        coMap[t.oid].toc = [...toc];
                    }
                }
                else if(t.tab === tab && t.type === tTypes.key) {
                    addTocItem(toc, t, tokens[i + 2]);
                }
            }
            //break;
        }
    };

    const addInfoLines = () => {// adds TOC and oid
        const dest = [];

        const add = (t, type, k, v) => {
            dest.push({home: true, iLine: t.iLine, type: tTypes.key, val: `"${k}"`});
            dest.push({iLine: t.iLine, type: tTypes.conn, val: ":"});
            dest.push({iLine: t.iLine, type: type, val: v});
        };
        
        for(let i = 0; i < tokens.length; i++){
            const t = tokens[i];
            dest.push(t);
            if(t.type === tTypes.oBrace){
                add(t, tTypes.nqVal, MM_TOC, JSON.stringify(t.toc));
                add(t, tTypes.qVal, MM_CLASS, `"${t.iClass}"`);
                add(t, tTypes.numVal, MM_TAB, `${t.tab}`);
                add(t, tTypes.nqVal, MM_SPLIT, t.split? "true" : "false");
            }
        }
        tokens = dest;
    }

    const findLists = () => {
        for(let tab = 0; tab <= maxTab; tab++){
            for(let i = 0; i < tokens.length - 1; i++){
                const t = tokens[i];
                const tNext = tokens[i + 1];
                if(t.tab === tab && t.type === tTypes.cBrace){
                    if( 
                        tNext.tab === tab && 
                        tNext.type === tTypes.oBrace 
                    ){
                        const group = Uq.next();
                        t.group = group;
                        tNext.group = group;

                        t.comma = true;

                        const oTok = coMap[t.oid];
                        if(!oTok.group){
                            oTok.group = group;
                            oTok.grpStart = true;
                        }

                        const cTok = ocMap[tNext.oid];
                        cTok.group = group;
                    }
                    else if(t.group){
                        t.grpEnd = true;
                    }
                }
            }
        }
    }

    const addBrackets = () => {
        const dest = [];
        for(let t of tokens){
            if(t.grpStart){
                dest.push({
                    val: "[",
                    type: tTypes.oBracket,
                    iLine: t.iLine,
                    tab: -1
                });
                dest.push(t);
            }
            else if(t.grpEnd){
                dest.push(t);
                dest.push({
                    val: "]",
                    type: tTypes.cBracket,
                    iLine: t.iLine,
                    tab: -1
                });
            }
            else{
                dest.push(t);
            }
        }

        tokens = dest;
    };

    const addCommas = () => {
        const dest = [];
        let i;
        for(i = 0; i < tokens.length - 1; i++){
            const tNext = tokens[i + 1];
            const t = tokens[i];
            dest.push(t);
            if(
                t.type !== tTypes.oBrace && 
                t.type !== tTypes.oBracket && 
                t.type !== tTypes.key && 
                t.type !== tTypes.conn && 
                tNext.type !== tTypes.cBrace && 
                tNext.type !== tTypes.cBracket
            ){
                dest.push({
                    val: ",",
                    type: tTypes.conn,
                    iLine: t.iLine
                }); // add comma between values, but not after keys or before closing braces/brackets
            }
        }
        dest.push(tokens[i]);
        tokens = dest;
    };

    const init = () => {
        setTabs();
        linkOpenClose();
        scrapeInfo();
        findLists();
        addInfoLines();
        addBrackets();
        addCommas();
    }
    init();

    return {
        getToks: () => tokens,
    }
};

const newJBuild = (tokens) => {
    const R_ERR = /position (\d+)/;
    const ERR_DISP_SIZE = 15;

    let jList;
    let jObj;

    const buildJson = () => {
        jList = tokens.map(t => t.val);
    }

    const buildJobj = () => {
        const jStr = jList.join("");

        try {
            jObj = JSON.parse(jStr);
        } 
        catch (e) {
            debugToks(tokens);
            const errStr = e.toString();
            const m = errStr.match(R_ERR);
            if(m){
                const pos = errStr.match(R_ERR)[1] - 1;
                const start = Math.max(0, pos - ERR_DISP_SIZE);
                const end = start + (ERR_DISP_SIZE * 2) + 1;
                const errDetail = `${jStr.substring(start, pos)} -->${jStr.charAt(pos)} ${jStr.substring(pos + 1, end)}`;
                alert(`${errStr}\n${errDetail}\nSee console for debug info`);
                jObj = null;
            }
            else{
                alert(`${errStr}\nSee console for debug info`);
            }
            //debugJson();
        }
    }

    const init = () => {
        buildJson();
        buildJobj();
    }

    init();

    return {
        debugJson: () => console.log(jList.join("")),
        getJson: () => jList.join(""),
        getJObj: () => jObj,
        getToks: () => tokens
    };
}

const SrcToJsonMain = (() => {
    const init = (sourceText, subject, fileMetadata) => {
        console.log("Run src to json");
        Metadata.clear();
        Metadata.setFileMetadata(fileMetadata);
        //console.log(sourceText);
        const tokener = newSourceTokener(sourceText);
        //tokener.debugToks();
        let toks = tokener.getToks();
        toks = newTokClean(toks).getToks();
        toks = newMlqMerge(toks).getToks();
        toks = newTabOps(toks).getToks(); 
        const jBuild = newJBuild(toks);
        Stores[STORE_JSON][subject].setMetadataAndText(Metadata.getMetadata(), jBuild.getJObj());
        MainDisplay.showFilenames();
        MainDisplay.showDebug();// force update
        //debugToks(toks, [tTypes.oBrace, tTypes.cBrace, tTypes.oBracket, tTypes.cBracket]);
        //debugToks(toks);//, [tTypes.nqVal, tTypes.numVal]

    }

    return {
        init: init
    };
})();