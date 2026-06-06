

const newTokClean = (tokens) => {
    const mergeObjInfo = () => {
        for(let i = 0; i < tokens.length - 1; i++){
            const t = tokens[i];
            const tNext = tokens[i + 1];
            if(t.type === tTypes.oBrace && tNext.type === tTypes.iClass){
                t[keys.objInfo] = {
                    iClass: tNext.val,
                    home: !!t.home,
                    range: {iStart: t.iLine, iEnd: -1}
                };
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
                case tTypes.guid:
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

        const findPattern = (pattern, i) => {
            let t = null;
            for(let j = i, k = 0; j < tokens.length && k < pattern.length; j++, k++){
                t = tokens[j];
                if(t.type !== pattern[k]){
                    return null;
                }
            }
            return t?.type === tTypes.oBrace? t : null;
        }

        for(let i = 0; i < tokens.length; i++){
            if(tokens[i].type === tTypes.conn){
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
            (t) => t.type !== tTypes.endl
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

        mergeObjInfo();
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
    const merge = () => {
        let first = null;
        let values = [];

        for(let i = 0; i < tokens.length - 1; i++){
            const t = tokens[i];

            if(t.type === tTypes.qVal){
                switch(t.subtype){
                    case subtypes.only:
                        t.val = JSON.stringify(
                            Util.trimQuotes(
                                t.val
                            )
                        );
                        break;
                    case subtypes.first:
                        first = t;
                        values = [t.val];
                        break;
                    case subtypes.mid:
                        values.push(t.val);
                        tokens[i] = null; // remove quote tokens, only keep merged token
                        break;
                    case subtypes.last:
                        values.push(t.val);
                        first.val = JSON.stringify(
                            Util.trimQuotes(
                                values.join("\n")
                            )
                        );
                        tokens[i] = null; // remove quote tokens, only keep merged token
                        first = null;
                }
            }
        }

        tokens = tokens.filter(t => !!t); // remove nulls
    };

    const init = () => {
        merge();
    }

    init();

    return {
        getToks: () => tokens,
    }
};

const newTabOps = (tokens) => {
    let maxTab = 0;

    const setTabs = () => {
        let tab = 0;
        for(let t of tokens){
            if(t.type === tTypes.oBrace){
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
            let oBrace = null;
            for(let i = 0; i < tokens.length; i++){
                const t = tokens[i];
                if(t.tab === tab){
                    if(t.type === tTypes.oBrace){
                        oBrace = t;
                    }
                    else if(t.type === tTypes.cBrace){
                        if(oBrace){
                            oBrace[keys.objInfo].range.iEnd = t.iLine;
                            oBrace = null;
                        }
                        else{
                            console.error(t);
                            throw new Error("unmatched closing brace at line ", t.iLine + 1);
                        }
                    }
                }
            }
        }
    };

    const findListPattern = () => {
        for(let tab = 0; tab <= maxTab; tab++){
            let oBrace = null;

            for(let i = 0; i < tokens.length - 1; i++){
                const t = tokens[i];
                const tNext = tokens[i + 1];

                if(t.tab === tab){
                    if(t.type === tTypes.oBrace){
                        oBrace = t;
                    }
                    else if(t.type === tTypes.cBrace){
                        if(tNext.tab === tab){
                            if(tNext.type === tTypes.oBrace){
                                oBrace.subtype = (oBrace.subtype)? subtypes.mid : subtypes.first;
                                tNext.subtype = subtypes.mid;
                            }

                        }
                        else if(oBrace.subtype){
                            t.subtype = subtypes.last;
                            oBrace = null;
                        }
                    }
                }
            }
        }
    }

    const findUqKeys = () => {
        for(let tab = 1; tab <= maxTab; tab++){
            let oBrace = null;
            for(let i = 0; i < tokens.length - 1; i++){
                const t = tokens[i];
                if(t.tab === tab - 1){
                    if(t.type === tTypes.oBrace && t.subtype){
                        oBrace = t;
                        //console.log((t.iLine+1), `a oBrace <= t, oBrace.subtype = ${oBrace.subtype}`)
                    }
                    else if(t.type === tTypes.oBrace){
                       // console.log((t.iLine+1), `b oBrace <= null`)
                        oBrace = null;
                    }
                }
                else if(t.tab === tab && oBrace){
                    if(t.type === tTypes.guid){
                        //console.log((t.iLine+1), `c found guid ${t.val} for oBrace at line ${oBrace.iLine + 1}`);
                        oBrace.guid = t.val;
                    }
                }
            }
        }
    }

    const applyListPattern = () => {
        const dest = [];

        const addListStart = (t) => {// t is oBrace
            // leave info off of added list braces
            dest.push({...t, [keys.objInfo]: null});
        }
        const addListItem = (t) => {// t is oBrace\
            const guid = t.guid.replace(/[-\s]/g, "_");
            dest.push({...t, type: tTypes.key, val: guid});
            dest.push({...t, type: tTypes.conn, val: ":", home: false});
            dest.push({...t, home: false});
        }
        const addListEnd = (t) => {// t is cBrace
            dest.push({...t});
        }
        
        for(i = 0; i < tokens.length; i++){
            const t = tokens[i];
            if(t.subtype && (t.type === tTypes.oBrace || t.type === tTypes.cBrace)){
                switch (t.subtype){
                    case subtypes.first:
                        addListStart(t);
                        addListItem(t);
                        break;
                    case subtypes.mid:
                        addListItem(t);
                        break;
                    case subtypes.last:
                        dest.push(t);
                        addListEnd(t);
                        break;
                }
            }
            else {
                dest.push(t);
            }

        }

        tokens = dest;
    }

    const scrapeInfo = () => {
        const addInfoItem = (valInfo, tKey, tVal) => {
            const infoItem = {
                k: Util.trimQuotes(tKey.val),
                t: tVal.type,
                i: tKey.iLine
            };

            valInfo.push(infoItem);
        };

        for(let tab = 1; tab <= maxTab; tab++){
            let valInfo = [];// table of contents for current tab level, reset at each new object at tab-1 level
            let oBrace = null;
            for(let i = 0; i < tokens.length; i++){
                const t = tokens[i];

                if(t.tab === tab - 1){
                    if(t.type === tTypes.oBrace){
                        oBrace = t;
                        valInfo = []; // reset valInfo for new object
                    }
                    else if(t.type === tTypes.cBrace){
                       oBrace[keys.valInfo] = [...valInfo];
                    }
                }
                else if(t.tab === tab && t.type === tTypes.key) {
                    addInfoItem(valInfo, t, tokens[i + 2]);
                }
            }
            //break;
        }
    };

    const addInfoLines = () => {// adds TOC
        const dest = [];

        const add = (t, type, k, v) => {
            dest.push({home: true, iLine: t.iLine, type: tTypes.key, val: `${Util.ensureQuotes(k)}`});
            dest.push({iLine: t.iLine, type: tTypes.conn, val: ":"});
            dest.push({iLine: t.iLine, type: type, val: v});
        };
        
        for(let i = 0; i < tokens.length; i++){
            const t = tokens[i];
            dest.push(t);
            if(t.type === tTypes.oBrace){
                if(t[keys.objInfo]){
                    add(t, tTypes.nqVal, keys.objInfo, JSON.stringify(t[keys.objInfo]));
                }
                if(t[keys.valInfo]){
                    add(t, tTypes.nqVal, keys.valInfo, JSON.stringify(t[keys.valInfo]));
                }
            }
        }
        tokens = dest;
    }

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
        findListPattern();
        findUqKeys();
        applyListPattern();
        setTabs();// reset tabs after list pattern changes

        scrapeInfo();
        addInfoLines();
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

    const debugJson = () => {
        const dest = [];
        let line;
        for(let t of tokens){
            if(t.home){
                if(line){
                    dest.push(line.join(""));
                }
                line = [];
            }
            line.push(t.val);
        }
        if(line){
            dest.push(line.join(""));
        }
        console.log(dest.join("\n"));
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
            debugJson();
        }
    }

    const init = () => {
        buildJson();
        buildJobj();
    }

    init();

    return {
        debugJson: debugJson,
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