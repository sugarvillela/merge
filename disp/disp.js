

const newLineNumRender = (toks, parent, showLineNum) => {
    let maxWidth = 0;

    const render = (tok) => {
        if(tok.home){
            const str = `${tok.iLine + 1}`;
            const span = document.createElement("span");
            span.className = "lineNum";
            span.textContent = str.padEnd(maxWidth, " ");
            parent.appendChild(span);
        }
    }

    if(showLineNum){
        maxWidth = (toks[toks.length - 1].iLine + 1).toString().length + 3; // padding for line numbers
        return {
            render: render
        }
    }
    else{
        return {
            render: () => {}
        }
    }

}

const newOCLink = () => {
    const stack = [];
    const linked = new Set();

    const clearAll = () => {
        linked.forEach(span => span.className = "charConn");
    }
    const linkAB = (spanA, spanB) => {
        clearAll();
        spanA.className = "charLinked";
        spanB.className = "charLinked";
    }

    const link = (tok, spanA) => {
        if(tok.type === tTypes.oBrace){
            stack.push(spanA);    
        }
        else if(tok.type === tTypes.cBrace && stack.length){
            const spanB = stack.pop();
            spanA.addEventListener("click", () => linkAB(spanA, spanB));
            spanB.addEventListener("click", () => linkAB(spanA, spanB));
            linked.add(spanA);
            linked.add(spanB);
        }
        else{
            spanA.addEventListener("click", clearAll);
        }
    };

    return {
        link: link
    }
}

const mapColor = (type) => {
    switch(type){
        case tTypes.key:
            return "charKey";
        case tTypes.numVal:
            return "charNumVal";
        case tTypes.qVal:
            return "charQVal";
        case tTypes.guid:
            return "charGuidVal";
        case tTypes.nqVal:
        case tTypes.unk:
            return "charNQVal";
        case tTypes.iClass:
            return "charClassVal";

        default:
            return "charConn";
    }
}

const newKeyValRender = (toks, parentName, subject, showLineNum = false) => {
    const render = () => {
        const parent = document.getElementById(parentName + subject);
        parent.innerHTML = "";
        const lineNumbers = newLineNumRender(toks, parent, showLineNum);
        const ocLink = newOCLink();

        for(let tok of toks){
            if(tok.type === tTypes.endl){
                parent.appendChild(document.createElement("br"));
            }
            else{
                lineNumbers.render(tok);
                const span = document.createElement("span");
                span.className = mapColor(tok.type);
                span.textContent = tok.val;
                ocLink.link(tok, span);
                parent.appendChild(span);
            }
        }
    }

    return {
        render: render
    }
}

const newJsonDisp = () => {
    const show = () => {
        for(let i = LEFT; i <= RIGHT; i++){
            if(Stores[STORE_JSON][i].haveData()){
                const data = Stores[STORE_JSON][i].getData();
                const json = JSON.stringify(data, null, 4);
                const tokener = newJsonTokener(json);
                const toks = tokener.getToks();
                const disp = newKeyValRender(toks, 'formatted', i, true);
                disp.render();
            }
            //break;
        }
    }

    return {
        show: show
    };
};

const newSourceDisp = () => {
    const show = () => {
        for(let i = LEFT; i <= RIGHT; i++){
            if(Stores[STORE_SOURCE][i].haveData()){
                const data = Stores[STORE_SOURCE][i].getData();
                const sourceText = data.text;
                const tokener = newSourceTokener(sourceText);
                //tokener.debugToks();
                const toks = tokener.getToks();
                const disp = newKeyValRender(toks, 'formatted', i, true);
                disp.render();
            }
        }
    }

    return {
        show: show
    };
};

const newRegenDisp = () => {
    const show = () => {
        if(Stores[STORE_JSON][LEFT].haveData()){
            const data = Stores[STORE_JSON][LEFT].getData();
            JsonToSrcMain.init(data.text, LEFT, data.metadata)
        }
        if(Stores[STORE_REGEN][LEFT].haveData()){
            const data = Stores[STORE_REGEN][LEFT].getData();
            const json = data.text;
            const tokener = newSourceTokener(json);
            //tokener.debugToks();
            const toks = tokener.getToks();
            const disp = newKeyValRender(toks, "regen", LEFT, true);
            disp.render();
        }
    }

    return {
        show: show
    };
};

MainDisplay = (() => {
    const showFilenames = () => {
        const parentNames = ["srcStatus", "diffStatus", "regenStatus"];
        for(let i = LEFT; i <= RIGHT; i++){
            if(Stores[STORE_JSON][i].haveData()){
                const data = Stores[STORE_JSON][i].getData();
                let filename = data?.metadata?.fileMetadata?.name || "";
                const ext = data.metadata?.fileMetadata?.ext || "";
                if(filename && ext){
                    filename += ext;
                }
                for(pName of parentNames){
                    const parent = document.getElementById(pName + i);
                    if(parent){
                        parent.innerHTML = filename;
                    }
                }
            }
        }
    }
    const showDebug = () => {
        const debugJson = PrefStore.getData()["debugSrc"];
        const disp = debugJson? newJsonDisp() : newSourceDisp();
        disp.show();
    }
    const showDiff = () => {
        newDiffDisp().show();
    }
    const showRegen = () => {
        newRegenDisp().show();
    }

    return {
        showFilenames: showFilenames,
        showDebug: showDebug,
        showDiff: showDiff,
        showRegen: showRegen
    };
})();

