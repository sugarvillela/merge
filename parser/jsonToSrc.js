const newListFix = (jObject) => {
    let tab = 0;
    const parseObj = (obj) => {
        const valInfo = obj[keys.valInfo];

        for(let infoItem of valInfo){
            const key = infoItem.k;
            const child = obj[key];

            if(getType(child) === cType.o){
                const isList = !child[keys.objInfo];
                if(isList){
                    obj[key] = convertToList(child);
                }
                else{
                    parseObj(child);
                }
            }
        };
    }

    const convertToList = (obj) => {
        const list = [];
        const valInfo = obj[keys.valInfo];

        for(let infoItem of valInfo){
            const key = infoItem.k;
            const type = infoItem.t;
            const child = obj[key];
            list.push(child);
            parseObj(child);
        }
        return list;
    }

    parseObj(jObject);
}

const newJsonToTokens = (jObject, metadata) => {
    const tokens = [];
    let tab = 0;

    const add = (type, val, tab, home = false) => {
        const t ={
            type: type,
            val: val,
            tab: tab,
            home: home
        };

        tokens.push(t);
    }

    const parseObj = (obj) => {
        const objInfo = obj[keys.objInfo];
        const valInfo = obj[keys.valInfo];
        
        add(tTypes.oBrace, "{", tab, objInfo.h);// objInfo.h = home
        tab++;
        add(tTypes.iClass, ` ${objInfo.k}`, tab);

        for(let infoItem of valInfo){
            const key = infoItem.k;
            const type = infoItem.type;
            const child = obj[key];

            add(tTypes.key, key, tab, true);
            add(tTypes.conn, " = ", tab);

            switch(getType(child)){
                case cType.o:
                    parseObj(child);
                    break;
                case cType.a:
                    parseArr(child);
                    break;
                case cType.p:   
                    add(infoItem.type, child, tab);  
                    add(tTypes.conn, ";", tab);                 
                    break;
            }
        }

        tab--;
        add(tTypes.cBrace, "}", tab, true);
    };

    const parseArr = (arr) => {
        for(let child of arr){
            parseObj(child);
        }
    };

    const init = () => {
        if(metadata?.header){
            add(tTypes.nqVal, metadata.header, 0, true);
        }

        parseObj(jObject);
    };

    init();

    return {
        getTokens: () => tokens
    };

}

const newSBuild = (tokens) => {
    const lines = [];

    const tab = (n) => {
        return (n > 0)? ' '.repeat(n * TAB) : "";
    }

    const init = () => {
        let currLine = null;

        for(let t of tokens){
            let indent;
            if(t.home){
                if(currLine){
                    lines.push(currLine.join(""));
                }
                currLine = [];
                indent = tab(t.tab);
            }
            else{
                indent = "";
            }

            const v = (t.type === tTypes.qVal)? `${Util.ensureQuotes(t.val)}` : t.val;
            currLine.push(`${indent}${v}`)
        }

        if(currLine){
            lines.push(currLine.join(""));
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
        newListFix(jObject);
        let tokens = newJsonToTokens(jObject, metadata).getTokens();
        let lines = newSBuild(tokens).getLines();

        Stores[STORE_REGEN][subject].setMetadataAndText(metadata, lines.join("\n"));
    };

    return {
        init: init
    };
})();