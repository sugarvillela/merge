const newClassDiffUtil = () => {
    const getUniquePathList = (paths) => {
        const uq = {};
        Object.values(paths).forEach(p => {
            const k = `${p.s}_${p.e}`;
            uq[k] = p;
        });

        const uqValues = Object.values(uq)
        uqValues.sort((a, b) => a.s - b.s);
        return uqValues;
    }

    const toSortedList = (paths) => {
        const values = Object.values(paths);
        values.sort((a, b) => a.s - b.s);
        return values;
    }

    const toUqSortedList = (paths) => {
        const values = getUniquePathList(paths);
        values.sort((a, b) => a.s - b.s);
        return values;
    }

    return {
        getUniquePathList: getUniquePathList,
        toSortedList: toSortedList,
        toUqSortedList: toUqSortedList
    };
}

const newClassFlattener = (jObject, subject, label) => {
    const preParse = (parent, grandparent) => {
        if(parent[keys.objInfo] && grandparent && !grandparent[keys.objInfo]){
            grandparent[keys.objInfo] = {...parent[keys.objInfo], k: "ignore"};
            //console.log("added", grandparent[keys.objInfo])
        }

        const valInfo = parent[keys.valInfo];
        
        for(let infoItem of valInfo){
            const child = parent[infoItem.k];
            if(getType(child) === cType.o){
                preParse(child, parent);
            }
        }
    }

    const paths = {};
    let currPath = [];
    let tab = -1;

    const saveLeafInfo = (parent, infoItem, val) => {
        const objInfo = {...parent[keys.objInfo]};
        const shortPath = [...currPath];

        shortPath.pop();
        const shortPathStr = shortPath.join(PATH_JOIN);
        
        objInfo.pStr = shortPathStr;
        objInfo.subject =subject;
        objInfo.label = label;
        paths[shortPathStr] = objInfo;

        currPath.splice(tab);
    }
    
    const parseObj = (parent) => {
        const valInfo = parent[keys.valInfo];

        for(let infoItem of valInfo){
            const key = infoItem.k;
            const child = parent[key];
            
            currPath.push(key);

            switch(getType(child)){
                case cType.o:
                    tab++;
                    parseObj(child);
                    tab--;
                    currPath.splice(tab);
                    break;                    
                case cType.p:                    
                    saveLeafInfo(parent, infoItem, child);
                    break;
            }
        }
    }

    const init = () => {
        preParse(jObject, null);
        parseObj(jObject);
    }

    init();

    return {
        getKeys: () => Object.keys(paths),
        getValue: (key) => paths[key],
        havePath: (path) => !!paths[path]
    };

}

const newClassDiff = (flatL, flatR) => {
    const util = newClassDiffUtil();
    let removed;
    let added;

    const genDiffReport = (a, b) => {
        const keys = a.getKeys();
        const diff = {};

        keys.forEach(k => {
            if(!b.havePath(k)){
                diff[k] = a.getValue(k)
            }
        });

        return util.toUqSortedList(diff);
    }

    const getFormatted = () => {
        const formatOne = (source, addedOrRemoved) => {
            const dest = [];
            let width = 0;

            source.forEach(r => {
                const range = `${r.s+1}-${r.e+1}`;
                width = Math.max(width, range.length);
                r.range = range;
            });

            source.forEach(r => {
                const range = r.range.padEnd(width, " ");
                const label = (r.label === undefined)? "" : ` '${r.label}'`;
                const subject = (r.subject === undefined)? "" : ` (${SubjectNames[r.subject]} side)`;
                dest.push(`Line ${range}: ${r.k} ${addedOrRemoved}${label}${subject}`);
            });

            return dest;
        }

        const formatted = {
            "removed" : formatOne(removed, "removed from"),
            "added": formatOne(added, "added to"),
        };

        return formatted;
    }

    const init = () => {
        removed = genDiffReport(flatL, flatR);
        added = genDiffReport(flatR, flatL);
    }

    init();

    return {
        getRemoved: () => removed,
        getAdded: () => added,
        getFormatted: getFormatted
    }
}

const ClassDiffMain = (() => {
    const init = (jObjectL, jObjectR) => {
        const flatL = newClassFlattener(jObjectL, LEFT, "pre");
        const flatR = newClassFlattener(jObjectR, RIGHT, "post");
        const diff = newClassDiff(flatL, flatR);

        const formatted = diff.getFormatted();
        formatted["removed"].forEach(r => console.log(r));
        formatted["added"].forEach(r => console.log(r));
    };

    return {
        init: (left, right) => init(left, right)
    };
})();