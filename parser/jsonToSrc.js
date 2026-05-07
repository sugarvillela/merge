const newSTranslate = (jObject) => {
    let tokens = [];
    let iLine = 0;

    const parseObj = (obj) => {
        const tab = obj[MM_TAB];
        const toc = obj[MM_TOC];

        tokens.push({
            type: tTypes.oBrace,
            v: `{ ${obj[MM_CLASS]}`,
            iLine: iLine++,
            tab: tab,
            isSplit: obj[MM_SPLIT],
        });

        for(let tocItem of toc){
            const key = tocItem.k;
            const type = tocItem.type;
            const child = obj[key];
            //console.log("objType", type, "childType", getType(child), "childKey", key)

            switch(getType(child)){
                case cType.o:
                    tokens.push({
                        type: tTypes.key,
                        iLine: iLine,
                        k: key,
                        tab: tab + 1,
                        endl: child[MM_SPLIT]
                    });
                    // console.log("o split", child[MM_SPLIT])
                    // if(child[MM_SPLIT]){
                    //     console.log("found split")
                    //     iLine++;
                    // }
                    parseObj(child);
                    break;
                case cType.a:
                    tokens.push({
                        type: tTypes.key,
                        iLine: iLine,
                        k: key,
                        tab: tab + 1,
                        endl: child[0][MM_SPLIT]
                    });
                    // console.log("a split", child[0][MM_SPLIT])
                    // if(child[0][MM_SPLIT]){
                    //     console.log("found split")
                    //     iLine++;
                    // }
                    parseArr(child);
                    break;
                case cType.p:                     
                    tokens.push({
                        type: type,
                        iLine: iLine++,
                        k: key,
                        v: child,
                        tab: tab + 1,
                    });
                    break;
            }
        }

        tokens.push({
            type: tTypes.cBrace,
            v: "}",
            tab: tab,
            iLine: iLine++
        });
    };

    const parseArr = (arr) => {
        for(let i in arr){
            const child = arr[i];
            switch(getType(child)){
                case cType.o:
                    parseObj(child);
                    break;
                case cType.a:
                    parseArr(child);// no real life cases 
                    break;
                case cType.p:
                    tokens.push({
                        //type: tTypes.plain,
                        v: child,
                        iLine: iLine++
                    });
            }
        }
    };

    const mergeSplits = () => {
        for(let i = 0; i < tokens.length - 1; i++){
            const t = tokens[i];
            const tNext = tokens[i + 1];
            if(
                t.type === tTypes.key && t.iLine === tNext.iLine){
                t.v = tNext.v;
                t.type = tNext.type;
                i++;
                tokens[i] = null;
            }
            //t.comma = (tNext.type !== tTypes.cBrace && tNext.type !== tTypes.cBracket);
        }
        tokens = tokens.filter(x => x);
    };
    const setCommas = () => {
        for(let i = 0; i < tokens.length; i++){
            const t = tokens[i];

            if(
                t.type === tTypes.oBrace || 
                t.type === tTypes.cBrace || 
                t.type === tTypes.key
            ){
                t.comma = false;
            }
            else{
                t.comma = true;
            }
        }
    };

    parseObj(jObject);
    mergeSplits();
    setCommas();

    // mergeSplits();
    // return newLineItr(lines);
    return {
        getTokens: () => tokens
    };
};

const newSBuild = (tokens, metadata) => {
    const lines = [];

    const tab = (n) => {
        return (n > 0)? ' '.repeat(n * TAB) : "";
    }

    const formatValue = (t) => {
        return t.type === tTypes.qVal? `"${t.v}"` : t.v;
    }

    const init = () => {
        const header = metadata?.header;
        if(header){
            lines.push(header);
        }
        for(let t of tokens){
            const indent = tab(t.tab);
            const k = t.k? `- ${t.k} = ` : "";
            const v = (t.v || t.v === "")? `${formatValue(t)}` : "";
            const comma = t.comma? ";" : "";
            lines.push(`${indent}${k}${v}${comma}`)
        }
    }

    init();

    return {
        getLines: () => lines,
        getStr: () => lines.join("\n")
    }
}

const JsonToSrcMain = (() => {
    const init = (jObject, subject, metadata) => {
        console.log("Run json to src");
        // console.log(jObject)
        // console.log(metadata)
        const tokens = newSTranslate(jObject).getTokens();
        const sBuild = newSBuild(tokens, metadata);
        const sStr = sBuild.getStr();
        //console.log(sBuild.getStr());
        Stores[STORE_REGEN][subject].setMetadataAndText(metadata, sStr);
    };

    return {
        init: init
    };
})();