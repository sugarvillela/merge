const newTokenAcc = (lineItr) => {
    let oToks = [];

    const endl = {iLine: 0, type: tTypes.endl, val: ""};
    const addEndl = () => oToks.push(endl);

    const add4 = (m, type) => {
        const iLine = lineItr.currIndex();
        oToks.push({home: true, iLine: iLine, type: tTypes.key, val: m[1]});
        oToks.push({iLine: iLine, type: tTypes.conn, val: m[2]});
        if(m.length > 3 && m[3]){
            oToks.push({iLine: iLine, type: type, val: m[3]});
        }
        if(m.length > 4 && m[4]){
            oToks.push({iLine: iLine, type: tTypes.conn, val: m[4]});
        }
        addEndl();
    };
    const add2 = (m, type) => {
        const iLine = lineItr.currIndex();
        oToks.push({home: true, iLine: iLine, type: type, val: m[1]});
        if(m.length > 2 && m[2]){
            oToks.push({iLine: iLine, type: tTypes.conn, val: m[2]});
        }
        addEndl();
    }
    const addUnk = (line) => {
        const iLine = lineItr.currIndex();
        oToks.push({home: true, iLine: iLine, type: tTypes.unk, val: line});
        addEndl();
    }

    const push = (tok) => {
        oToks.push(tok);
    };

    return {
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

    const tryEndQuote = (val, home, iLine) => {
        let m;
        if(balanced() && (m = val.match(rEndStr))){// found end quote
            tokenAcc.push( {home: home, iLine: iLine, type: tTypes.qVal, val: m[1], qid: currUq} );
            tokenAcc.push( {iLine: iLine, type: tTypes.conn, val: m[2]} );
            qCount = 0;
        }
        else{// still in multi-line quote
            tokenAcc.push( {home: home, iLine: iLine, type: tTypes.qVal, val: val, qid: currUq} );
        }
        
        tokenAcc.addEndl();
    }

    const addKeyEquals = (line) => {
        const m = line.match(rKeyEq);
        if(m){
            const iLine = lineItr.currIndex();
            tokenAcc.push( {home: true, iLine: iLine, type: tTypes.key, val: m[1]} );
            tokenAcc.push( {iLine: iLine, type: tTypes.conn, val: m[2]} );
            return m[1].length + m[2].length;
        }
        return 0;
    }

    const handleQuote = (line) => {
        const iLine = lineItr.currIndex();
        if(qCount > 0){// subsequent line in multi-line quote
            qCount += countQuotes(line);
            tryEndQuote(line, true, iLine);

            return true;
        }
        if((qCount = countQuotes(line)) > 0){// initial line in multi-line quote
            currUq = Uq.next();
            const keyEqLen = addKeyEquals(line);
            if(keyEqLen){
                tryEndQuote(line.substring(keyEqLen), false, iLine);
            }
            else{
                tryEndQuote(line, true, iLine);
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
        {r: /^([^=]+)([ ]?=[ ]?)$/, f: (m) => tokenAcc.add4(m, undefined)},         // 
        {r: /^([^=]+)([ ]?=[ ]?)([\{\[])$/, f: (m) => tokenAcc.add4(m, tTypes.oBrace)},
        {r: /^([^=]+)([ ]?=[ ]?)([\{\[][ ]*[\}\]])(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.ocBrace)},
        {r: /^([^=]+)([ ]?=[ ]?)(\-?[\.\d]+)(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.numVal)},
        {r: /^([^=]+)([ ]?=[ ]?)([^";]+)(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.nqVal)},
        {r: /^([^=]+)([ ]?=[ ]?)("(?:[^"\\]|\\.)*")(;?)$/, f: (m) => tokenAcc.add4(m, tTypes.qVal)},
        {r: /^([ ]*"(?:[^"\\]|\\.)*")(;?)$/, f: (m) => tokenAcc.add2(m, tTypes.qVal)}
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
                    //console.log("unk", line)
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