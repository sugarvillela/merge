const newLineItr = (lines) => {
    const disp = () => {
        for(let line of lines){
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

const newTokenAcc = (lineItr) => {
    let oToks = [];

    const add = (type, val, home = undefined) => {
        oToks.push({home: home, iLine: lineItr.currIndex(), type: type, val: val, trim: val.trim()});
    }

    const addQ = (val, subtype, home = undefined) => {
        oToks.push({home: home, iLine: lineItr.currIndex(), type: tTypes.qVal, val: val, trim: val.trim(), subtype: subtype});
    }

    const endl = {iLine: 0, type: tTypes.endl, val: ""};
    const addEndl = () => oToks.push(endl);

    const add4 = (m, type) => {
        add(tTypes.key, m[1], true);
        add(tTypes.conn, m[2]);
        if(m.length > 3 && m[3]){
            add(type, m[3]);
        }
        if(m.length > 4 && m[4]){
            add(tTypes.conn, m[4]);
        }
        addEndl();
    };

    const add2 = (m, type) => {
        add(type, m[1], true);
        if(m.length > 2 && m[2]){
            add(tTypes.conn, m[2]);
        }
        addEndl();
    }

    const addUnk = (line) => {
        add(tTypes.unk, line, true);
        addEndl();
    }

    const push = (tok) => {
        oToks.push(tok);
    };

    return {
        add: add,       // add directly to list, includes iLine
        addQ: addQ,     // same as add, plus subtype for quoted val
        add4: add4, 
        add2: add2,
        addUnk: addUnk,
        addEndl: addEndl,
        push: push,
        getToks: () => oToks,
        debugToks: () => debugToks(oToks)
    }
}

const newJsonTokener = (json) => {
    let tokenAcc;

    const rxs = [
        {r: /^([ ]*[\{\[])$/, f: (m) => tokenAcc.add2(m, tTypes.oBrace)},
        {r: /^([ ]*[\}\]])(,?)$/, f: (m) => tokenAcc.add2(m, tTypes.cBrace)},
        {r: /^([^:]+)([ ]?:[ ]?)([\{\[])$/, f: (m) => tokenAcc.add4(m, tTypes.oBrace)},
        {r: /^([^:]+)([ ]?:[ ]?)([\{\[][ ]*[\}\]])(,?)$/, f: (m) => tokenAcc.add4(m, tTypes.ocBrace)},
        {r: /^([^:]+)([ ]?:[ ]?)(\-?[\.\d]+)(,?)$/, f: (m) => tokenAcc.add4(m, tTypes.numVal)},
        {r: /^([^:]+)([ ]?:[ ]?)([^",]+)(,?)$/, f: (m) => tokenAcc.add4(m, tTypes.nqVal)},
        {r: /^([^:]+)([ ]?:[ ]?)("(?:[^"\\]|\\.)*")(,?)$/, f: (m) => tokenAcc.add4(m, tTypes.qVal)},
        {r: /^([ ]*"(?:[^"\\]|\\.)*")(,?)$/, f: (m) => tokenAcc.add2(m, tTypes.qVal)}
    ]
    const init = () => {
        const lines = json.split("\n");
        const lineItr = newLineItr(lines);
        tokenAcc = newTokenAcc(lineItr);

        while(lineItr.haveNext()){
            const line = lineItr.curr();
            matched = false;
            for(let rx of rxs){
                if(m = line.match(rx.r)){
                    rx.f(m);
                    matched = true;
                    break;
                }
            }
            if(!matched){
                tokenAcc.addUnk(line)
            }
            lineItr.inc();
        }
    }

    init();

    return {
        getToks: tokenAcc.getToks,
        debugToks: () => tokenAcc.debugToks
    };
}

const newMultiLineQuoteParse = (lineItr, tokenAcc) => {
    const rKeyEq = /^([^=]+)([ ]?=[ ]?)(")/;  // partial key val with opening quote, for detecting start of multi-line quote
    const rEndStr = /^(.*")(;)$/;   // partial value with closing quote, for detecting end of multi-line quote and separating trailing connector
    const escChar = "\\";
    let qCount = 0;
    let currUq = 0;
    let subtype = subtypes.first;

    const countQuotes = (line) => {
        let esc = false;
        let c = 0; 
        
        for(let i = 0; i < line.length; i++){
            if(line[i] === escChar){
                esc = true;
            }
            else if(esc){
                esc = false;
            }
            else if(line[i] === '"'){
                c++;
            }
        }
        return c;
    };

    const balanced = () => qCount && (qCount % 2 === 0);

    const tryEndQuote = (val, home) => {
        let m;
        if(balanced() && (m = val.match(rEndStr))){// found end quote
            subtype = (subtype === subtypes.first)? subtypes.only : subtypes.last;
            tokenAcc.addQ(m[1], subtype, home);
            tokenAcc.add(tTypes.conn, m[2]);
            qCount = 0;
        }
        else{// still in multi-line quote
            tokenAcc.addQ(val, subtype, home);
        }
        
        tokenAcc.addEndl();
    }

    const addKeyEquals = (line) => {
        const m = line.match(rKeyEq);
        if(m){
            tokenAcc.add(tTypes.key, m[1], true);
            tokenAcc.add(tTypes.conn, m[2]);
            return m[1].length + m[2].length;
        }
        return 0;
    }

    const handleQuote = (line) => {
        
        if(qCount > 0){// subsequent line in multi-line quote
            subtype = subtypes.mid;
            qCount += countQuotes(line);
            tryEndQuote(line, true);

            return true;
        }
        if((qCount = countQuotes(line)) > 0){// initial line in multi-line quote
            subtype = subtypes.first;
            currUq = Uq.next();
            const keyEqLen = addKeyEquals(line);
            if(keyEqLen){
                tryEndQuote(line.substring(keyEqLen), false);
            }
            else{
                tryEndQuote(line, true);
            }

            return true;
        }

        return false;
    }

    return {
        handleQuote: handleQuote
    };
}

const newSourceTokener = (sourceText) => {
    let lineItr;
    let tokenAcc;

    const addIClass = (m) => {
        const iLine = lineItr.currIndex();
        tokenAcc.push({home: true, iLine: iLine, type: tTypes.oBrace, val: m[1]});
        tokenAcc.push({iLine: iLine, type: tTypes.iClass, val: m[2]});
        tokenAcc.addEndl();
    };

    const addKeyEqualsIClass = (m) => {
        const iLine = lineItr.currIndex();
        tokenAcc.push({home: true, iLine: iLine, type: tTypes.key, val: m[1]});
        tokenAcc.push({iLine: iLine, type: tTypes.conn, val: m[2]});
        tokenAcc.push({iLine: iLine, type: tTypes.oBrace, val: m[3]});
        tokenAcc.push({iLine: iLine, type: tTypes.iClass, val: m[4]});
        tokenAcc.addEndl();
    };

    const rxs = [
        {r: /^([^=]+)([ ]?=[ ]?)([\{] )(I\w+)$/, f: (m) => addKeyEqualsIClass(m)},  // val = { IClassName
        {r: /^([ ]*[\{] )(I\w+)$/, f: (m) => addIClass(m)},                         // { IclassName
        {r: /^([ ]*[\}])(;?)$/, f: (m) => tokenAcc.add2(m, tTypes.cBrace)},         // }
        {r: /^([^=]+)([ ]?=[ ]?)$/, f: (m) => tokenAcc.add4(m, undefined)},         // key = 
        {r: /^([^=]+)([ ]?=[ ]?)([\{\[])$/, f: (m) => tokenAcc.add4(m, tTypes.oBrace)},                 // key = { IClassName
        {r: /^([^=]+)([ ]?=[ ]?)([\{\[][ ]*[\}\]])(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.ocBrace)},  // key = {};
        {r: /^([^=]+)([ ]?=[ ]?)(\-?[\.\d]+)(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.numVal)},         // key = -2.17;
        {r: /^([^=]+)([ ]?=[ ]?)(GUID[^;]+)(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.guid)},          // key = GUID 1234;
        {r: /^([^=]+)([ ]?=[ ]?)([^";]+)(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.nqVal)},              // key = unquoted;
        {r: /^([^=]+)([ ]?=[ ]?)("(?:[^"\\]|\\.)*")(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.qVal)},    // key = "quoted";
        {r: /^([ ]*"(?:[^"\\]|\\.)*")(;?)$/, f: (m) => tokenAcc.add2(m, tTypes.qVal)}// "quoted";
    ];

    const init = () => {
        const lines = sourceText.split("\n");
        lineItr = newLineItr(lines);
        tokenAcc = newTokenAcc(lineItr);
        const mlqParse = newMultiLineQuoteParse(lineItr, tokenAcc);

        while(lineItr.haveNext()){
            const line = lineItr.curr().trimEnd();
            if(!mlqParse.handleQuote(line)){
                matched = false;

                for(let rx of rxs){
                    if(m = line.match(rx.r)){
                        rx.f(m);
                        matched = true;
                        break;
                    }
                }
                if(!matched){
                    tokenAcc.addUnk(line)
                }
            }

            lineItr.inc();
        }
    }

    init();

    return {
        getToks: tokenAcc.getToks,
        debugToks: () => debugToks(tokenAcc.getToks())
    };
}