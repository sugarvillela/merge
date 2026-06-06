const newDiffDisp = () => {
    const jObjects = [];
    const getData = () => {
        for(let i = LEFT; i <= RIGHT; i++){
            if(Stores[STORE_JSON][i].haveData()){
                jObjects.push(Stores[STORE_JSON][i].getData().text)
            }
            else {
                return false;
            }
        }
        return true;
    }
    const endl = (parent) => {
        parent.appendChild(document.createElement("br"));
    }
    const renderBlank = (parent) => {
        const span = document.createElement("span");
        span.className = "bgDiffWide";
        span.textContent = "-";
        parent.appendChild(span);
    }
    const rebuildMlq = (diffObj, subject) => {
        // precondition: tType = qVal and diffObj[subject] is not null
        const val = diffObj.getValue(subject);
        switch(diffObj.getSubtype(subject)){
            case subtypes.only:
                return Util.ensureQuotes(val);
            case subtypes.first:
                return Util.ensureOpenQuote(val);
            case subtypes.last:
                return Util.ensureCloseQuote(val);
            default: // subtypes.mid
                return val;
        }
    }
    const render = (parent, subject, diffObj) => {
        //diffObj.disp();
        const report = diffObj.getReports()[subject];
        let sep = "";
        // console.log("render report", subject)
        // console.log(report)
        if(report){
            let className = "";
            let value = diffObj.getValue(subject);
            const type = diffObj.getValueType(subject);
            switch(type){// never null because report is not null
                case tTypes.numVal:
                    className = "charNumVal";
                    break;
                case tTypes.nqVal:
                case tTypes.unk:
                    className = "charNQVal";
                    break;
                case tTypes.qVal:
                    value = rebuildMlq(diffObj, subject);
                    className = "charQVal";
                    break;
            }
            if(diffObj.showPath(subject)){
                for(let branch of report){
                    const span = document.createElement("span");
                    span.className = "charKey";
                    //TODO remove branch.match
                    span.textContent = sep + branch.branch;
                    parent.appendChild(span);
                    sep = "/";
                }

                const connSpan = document.createElement("span");
                connSpan.textContent = ": ";
                parent.appendChild(connSpan);
            }

            if(value && type !== tTypes.unk){
                const valueSpan = document.createElement("pre");
                if(diffObj.getMType() !== mTypes.exact){
                    className += " bgDiffValue"
                }
                valueSpan.className = className;
                valueSpan.textContent = value;
                parent.appendChild(valueSpan);
            }

            endl(parent);
        }
        else{
            renderBlank(parent);
        }
    }

    const show = () => {
        if(getData()){
            const pathDiff = DiffMain.init(jObjects[LEFT], jObjects[RIGHT]);
            if(pathDiff){
                const {diffs, objL, objR} = pathDiff.getDiff();
                const parentL = document.getElementById("diff" + LEFT);
                const parentR = document.getElementById("diff" + RIGHT);
                parentL.innerHTML = "";
                parentR.innerHTML = "";
                for(let d of diffs){
                    //d.disp();
                    render(parentL, LEFT, d);
                    render(parentR, RIGHT, d);
                }
            }
        }
    }

    return {
        show: show
    };
};