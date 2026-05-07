const mTypes = {// match types
    none: 0,
    L: 1,
    R: 2,
    all: 3,
    exact: 4
};

const newPathObj = (parent, tocItem, val, pStr, pArr) => {
    const toString = () => {
        const path = (pStr)? ` ${pStr}: ` : "";
        return `${tocItem.iLine + 1}: ${path}${val} (${tocItem.type})`;
    };
    const toStringShort = () => {
        const path = (pStr)? ` ${pStr}: ` : "";
        return `${path}: ${val}`;
    };
    const splitMLQ = () => {
        if(tocItem.type === tTypes.mlq && tocItem.qSize){
            const lines = val.split(/\r?\n/);
            console.log("lines", lines)
            const lineObjs = lines.map(lineVal => newPathObj(
                parent, tocItem, lineVal, pStr, pArr
            ));
            lineObjs[0].setValueType(tTypes.mlqFirst);
            lineObjs[lineObjs.length - 1].setValueType(tTypes.mlqLast);
            return lineObjs;
        }
        return null;
    }

    return {
        getPathStr: () => pStr,
        getPathArr: () => pArr,
        getValue: () => val,
        getValueType: () => tocItem.type,
        setValueType: (newType) => type = newType,
        splitMLQ: splitMLQ,
        toString: toString,
        toStringShort: toStringShort
    };
}
const newDiffObj = (pathObjL, pathObjR) => {
    //console.log(pathObjL?.getPathArr(), pathObjR?.getPathArr())
    const pathObjs = [pathObjL, pathObjR];
    const reports = [null, null];
    let mType = 0; 

    const setMType = () => {
        mType = 0;
        for(i = LEFT; i <= RIGHT; i++){
            if(pathObjs[i]){
                mType += i + 1;
            }
        }
    }

    const init = () => {
        setMType();
    }

    const disp = () => {
        const strL = pathObjs[LEFT]? pathObjs[LEFT].toString() : "null";
        const strR = pathObjs[RIGHT]? pathObjs[RIGHT].toString() : "null";
        console.log(`${LEFT}: ${strL}`);
        console.log(`${RIGHT}: ${strR}`);
    }

    const toStringShort = (subject) => {
        let str = pathObjs[subject]? pathObjs[subject].toStringShort() : "---";
        let m = mType === mTypes.exact? " m" : "";
        return `${str}${m}`;
    }

    const splitMLQ = () => {
        const mlqL = pathObjs[LEFT]?.splitMLQ();
        const mlqR = pathObjs[RIGHT]?.splitMLQ();
        let dest = null;

        if(mlqL){
            if(mlqR){
                dest = [];
                const len = Math.max(mlqL.length, mlqR.length);
                for(let i = 0; i < len; i++){
                    const pObjL = (i < mlqL.length)? mlqL[i] : null;
                    const pObjR = (i < mlqR.length)? mlqR[i] : null;
                    dest.push(newDiffObj(pObjL, pObjR));
                }
            }
            else {
                dest = [];
                for(let i = 0; i < mlqL.length; i++){
                    dest.push(newDiffObj(mlqL[i], null));
                }
            }
        }
        else if(mlqR){
            dest = [];
            for(let i = 0; i < mlqR.length; i++){
                dest.push(newDiffObj(null, mlqR[i]));
            }
        }
        return dest;
    }

    const genReports = () => {
        switch (mType){
            case mTypes.all:
            case mTypes.exact:
                reports[LEFT] = pathObjs[LEFT].getPathArr().map(b => ({branch: b, match: true }));
                reports[RIGHT] = pathObjs[RIGHT].getPathArr().map(b => ({branch: b, match: true }));
                break;
            case mTypes.L:
                reports[LEFT] = pathObjs[LEFT].getPathArr().map(b => ({branch: b, match: true }));
                break;
            case mTypes.R:
                reports[RIGHT] = pathObjs[RIGHT].getPathArr().map(b => ({branch: b, match: true }));
                break;
        }
    }

    init();
    return {
        getMType: () => mType,
        getPathObj: (subject) => pathObjs[subject],
        getPathArr: (subject) => pathObjs[subject]?.getPathArr(),
        getPathStr: (subject) => pathObjs[subject]?.getPathArr().join("/"),
        getType: (subject) => pathObjs[subject]?.type,
        splitMLQ: splitMLQ,
        genReports: genReports,
        getReports: () => reports,
        // ensure mType = all
        getValue: (subject) => pathObjs[subject].getValue(),
        getValueType: (subject) => pathObjs[subject].getValueType(),
        toStringShort: toStringShort,
        disp: disp,
        setPathObj: (subject, pathObj) => {
            pathObjs[subject] = pathObj;
            setMType();
        },
        setValueMatch: (isMatch) => {
            if(isMatch){
                mType = mTypes.exact;
            }
            else{
                setMType();
            }
        }
    }
}

const newFlattener = (jObject, subject) => {
    const pathList = [];
    const paths = {};
    let currPath = [];
    let tab = 0;

    const disp = () => {
        console.log(`Disp ${SubjectNames[subject]}`);
        for(let p of pathList){
            console.log(paths[p].toString());
        }
    }

    const saveLeafInfo = (parent, tocItem, val) => {
        const pStr = currPath.join(PATH_JOIN);
        //const h = hash32(pathStr);
        pathList.push(pStr);
        
        paths[pStr] = newPathObj(parent, tocItem, val, pStr, [...currPath]);
        currPath.splice(tab);
    }
    
    const parseObj = (parent) => {
        const toc = parent[MM_TOC];

        for(let tocItem of toc){
            const key = tocItem.k;
            const type = tocItem.type;
            const child = parent[key];
            
            currPath.push(key);

            switch(getType(child)){
                case cType.o:
                    tab++;
                    parseObj(child);
                    tab--;
                    currPath.splice(tab);
                    break;

                case cType.a:
                    tab++;
                    parseArr(child);
                    tab--;
                    currPath.splice(tab);
                    break;
                    
                case cType.p:                    
                    saveLeafInfo(parent, tocItem, child);
                    break;
            }
        }
    }

    const parseArr = (parent) => {
        for(let i in parent){
            const child = parent[i];
            currPath.push(`${i}`);

            switch(getType(child)){
                case cType.o:
                    tab++;
                    parseObj(child);
                    tab--;
                    currPath.splice(tab);
                    break;

                case cType.a:
                    tab++;
                    parseArr(child);
                    tab--;
                    currPath.splice(tab);
                    break;

                case cType.p:
                    throw new Error("Parse error");
            }
        }
    }

    parseObj(jObject);

    return {
        getPathList: () => pathList,    // path strings, as list to retain order
        getPaths: () => paths,          // object/map: key = pathString, val = pathObj
        getPathObjects: () => pathList.map(p => paths[p]),
        disp: disp
    }
}

const newDiff_1 = (props) => {
    const { flatteners, objs } = props;
    
    const pathsL = flatteners[LEFT].getPathObjects();
    const pathsR = flatteners[RIGHT].getPathObjects();
    let diffL = [];
    let diffR = [];
    let diffs = [];
    let i = 0, j = 0;

    const lookAheadL = () => {// look for curr right in left
        const target = pathsR[j].getPathStr();
        let k = i + 1;
        while(k < pathsL.length){
            if(pathsL[k].getPathStr() === target){
                return k;
            }
            k++;
        }
        return Number.MAX_SAFE_INTEGER;
    }
    const lookAheadR = () => {// look for curr left in right
        const target = pathsL[i].getPathStr();
        let k = j + 1;
        while(k < pathsR.length){
            if(pathsR[k].getPathStr() === target){
                return k;
            }
            k++;
        }
        return Number.MAX_SAFE_INTEGER;
    }
    const skipL = (k) => {// add rights until match reached
        while(j < k && j < pathsR.length){
            // diffL.push(undefined);
            // diffR.push(pathsR[j]);
            diffs.push(
                newDiffObj(null, pathsR[j])
            );
            j++;
        }
    }
    const skipR = (k) => {// add lefts until match reached
        while(i < k && i < pathsL.length){
            // diffL.push(pathsL[i]);
            // diffR.push(undefined);
            diffs.push(
                newDiffObj(pathsL[i], null)
            );
            i++;
        }
    }
    const lookAhead = () => {
        const kL = lookAheadL();
        const kR = lookAheadR();
        if(kL === Number.MAX_SAFE_INTEGER && kR ===  Number.MAX_SAFE_INTEGER){
            return false;
        }
        else if(kL <= kR){// kL less; add lefts until match
            skipR(kL);
        }
        else {      // kR less; add rights until match
            skipL(kR);
        }

        return true;
    }

    const setNewLists = () => {
        i = 0;
        j = 0;
        let r = 40;

        while(i < pathsL.length && j < pathsR.length){
            const strL = pathsL[i].getPathStr();
            const strR = pathsR[j].getPathStr();

            if(strL === strR){
                // diffL.push(strL);
                // diffR.push(strR);
                diffs.push(
                    newDiffObj(pathsL[i], pathsR[j])
                );
                i++;
                j++;
            }
            else if(!lookAhead()){
                // const objL = pathsL[strL];
                // const objR = pathsR[strR];
                // objL.orphan = true;
                // objR.orphan = true;
                i++;
                j++;
            }
            if(r <= 0){
                break;
            }
            r--;
        }
        while(i < pathsL.length){
            // diffL.push(pathsL[i]);
            // diffR.push(undefined);
            diffs.push(
                newDiffObj(pathsL[i], null)
            );
            i++;
        }
        while(j < pathsR.length){
            // diffL.push(undefined);
            // diffR.push(pathsR[j]);
            diffs.push(
                newDiffObj(null, pathsR[j])
            );
            j++;
        }
    }

    const disp = () => {
        for(let d of diffs){
            const left = d.getPathStr(LEFT) || "---"
            const right = d.getPathStr(RIGHT) || "---"
            console.log(`${left} | ${right}`);
        }
    }

    const init = () => {
        setNewLists();
        //disp();
    }

    init();

    return {
        getDiff: () => ({flatteners: flatteners, objs: objs, diffs: diffs, diffL: diffL, diffR: diffR})
    };
}

const newDiff_2 = (props) => {
    let {flatteners, objs, diffs} = props;
    
    const lookInObjTree = (left, right) => {
        const objR = objs[right];

        const parseObj = (d) => {
            let pArr = d.getPathArr(left);
            let child = objR;
            const pathR = [];

            for(let p of pArr){
                const nextChild = child[p];
                if(nextChild){
                    pathR.push(p);
                    child = nextChild;
                }
                else {
                    return undefined;
                }
            }
    
            const pathStr = pathR.join(PATH_JOIN);
            return flatteners[right].getPathObjects().find(
                p => p.getPathStr(right) === pathStr
            );
        }

        let found;
        for(let i = 0; i < diffs.length; i++){
            let d = diffs[i];
            let otherPath = d.getPathStr(right)
            if(
                !otherPath && 
                (found = parseObj(d))
            ){
                d.setPathObj(right, found);
            }
        }
    }

    const removeDups = () => {
        const set = new Set();
        const uqs = [];

        for(let d of diffs){
            if(d.getMType() !== mTypes.all){
                uqs.push(d);
            }
            else{
                const path = d.getPathStr(LEFT);
                if(!set.has(path)){
                    set.add(path);
                    uqs.push(d);
                }
            }
        }

        diffs = uqs;
    }

    const setValueMatch = () => {
        //console.log("setValueMatch")
        for(let d of diffs){
            if( d.getMType() === mTypes.all ){
                d.setValueMatch(d.getValue(LEFT) === d.getValue(RIGHT));
            }
        }
    }

    const disp = () => {
        const len = diffL.length;
        for(let i = 0; i < len; i++){
            const left = diffL[i]? pathsL[diffL[i]].toStringShort() : "---"
            const right = diffR[i]? pathsR[diffR[i]].toStringShort() : "---"
            console.log(`${left} | ${right}`);
            //console.log(`${diffL[i]} | ${diffR[i]}`);
        }
    }

    let diffL = [];
    let diffR = [];

    const init = () => {
        lookInObjTree(LEFT, RIGHT);
        lookInObjTree(RIGHT, LEFT);
        removeDups();
        setValueMatch();

        // diffL = [];
        // diffR = [];
        // for(let d of diffs){
        //     diffL.push(d.getPathStr(LEFT));
        //     diffR.push(d.getPathStr(RIGHT));
        // }
        //disp();
    }

    init();

    return {
        getDiff: () => ({flatteners: flatteners, objs: objs, diffs: diffs})
    };
}

const newDiff_3 = (props) => {
    let {flatteners, objs, diffs} = props;

    const splitMLQ = () => {
        const dest = [];
        let newDiffs;
        //console.log("setValueMatch")
        for(let i = 0; i < diffs.length; i++){
            const d = diffs[i];
            if( d.getMType() === mTypes.exact && (newDiffs = d.splitMLQ())){
                dest.push(...newDiffs);
            }
            else if( d.getMType() === mTypes.all && (newDiffs = d.splitMLQ())){
                dest.push(...newDiffs);
            }
            else{
                dest.push(d);
            }
        }
        dest.forEach(x => x.disp())
        diffs = dest;
    }

    const genReports = () => {
        //console.log("setValueMatch")
        for(let d of diffs){
            d.genReports();
        }
    }

    const init = () => {
        splitMLQ();
        genReports();
    }

    init();

    return {
        getDiff: () => ({flatteners: flatteners, objs: objs, diffs: diffs})
    };
}

const DiffMain = (() => {
    const init = (objL, objR) => {
        console.log("Run diff")
        const flatL = newFlattener(objL, LEFT);
        //flatL.disp();
        const flatR = newFlattener(objR, RIGHT);

        const props1 = {flatteners: [flatL, flatR], objs:[objL, objR]};
        const pathDiff1 = newDiff_1(props1);
        
        const props2 = pathDiff1.getDiff();
        const pathDiff2 = newDiff_2(props2);

        const props3 = pathDiff2.getDiff();
        const pathDiff3 = newDiff_3(props2);

        return pathDiff3;
    };

    return {
        init: (left, right) => init(left, right)
    };
})();