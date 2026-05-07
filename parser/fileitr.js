const getStore = (STORE_KEY, defaultData) => {
    let data;

    const refresh = () => {
        try{
            const dataStr = localStorage.getItem(STORE_KEY);
            data = JSON.parse(dataStr);
            return true
        }
        catch(e){
            data = {};
            return false;
        }
    };

    if(!refresh() && defaultData){
        data = defaultData; 
        localStorage.setItem(STORE_KEY, JSON.stringify(defaultData));
    }

    const setData = (d) => {
        data = d;
        localStorage.setItem(STORE_KEY, JSON.stringify(d));
    }

    const setMetadataAndText = (metadata, text) => { 
        setData({metadata: metadata, text: text});
    };

    const statusStr = (store, subject) => {
        return `${StoreNames[store]} ${SubjectNames[subject]}: have data ${!!data}`;
    };

    const clear = () => {
        if(defaultData){
            data = defaultData;
            localStorage.setItem(STORE_KEY, JSON.stringify(data));
        }
        else{
            setMetadataAndText({}, "");
        }
    }

    return {
        haveData: () => refresh(),
        setMetadataAndText: setMetadataAndText,
        setData: setData,
        getData: () => data,
        clear: clear, 
        statusStr: statusStr
    };
};

const PrefStore = getStore("mm:pref", {metadata: {}, useStorage: 1, debugSrc: 1});

// STORE_SOURCE = 0;
// STORE_JSON = 1;
// STORE_REGEN = 2;
// LEFT = 0;
// RIGHT = 1;
const Stores = [
    [getStore("mm:src1"), getStore("mm:src2")],
    [getStore("mm:json1"), getStore("mm:json2")],
    [getStore("mm:regen")]
];

const storeStatus = () => {
    for(let store = 0; store < Stores.length; store++){
        for(let subject = 0; subject < Stores[store].length; subject++){
            console.log(Stores[store][subject].statusStr(store, subject))
        }

    }
};
// const StoreSrc1 = getStore("mm:src1");
// const StoreSrc2 = getStore("mm:src2");

// const StoreJson1 = getStore("mm:json1");
// const StoreJson2 = getStore("mm:json2");

// const StoreRegen = getStore("mm:regen");

const getFileReader = (store, subject, f) => {
    const allowedTypes = [".cls", ".sbs"];

    /*private*/ const splitFileName = (name) => {
        const i = name.lastIndexOf(".");
        return (i === -1)? 
            [name, ""] : 
            [name.substring(0, i), name.substring(i)];
    }
    /*private*/ const assertType = (ext) => {
        if(ext !== ".cls" && ext !== ".sbs"){
            throw new Error(`Allowed file types: ${allowedTypes}`);
        }
    }
    const init = (file) => {
        //const file = event.target.files[0]; // Get the first selected file
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const [name, ext] = splitFileName(file.name);
                assertType(ext);

                const metadata = {
                    name: name,
                    ext: ext,
                    modified: file.lastModified,
                    store: store,
                    subject: subject
                };
                
                const text = e.target.result;

                Stores[store][subject].setMetadataAndText(metadata, text); // Store the file content in local storage
                
                // const filename = file.name;
                console.log(`Name: ${name}, Size: ${file.size} bytes`);
                f(text, subject, metadata);     // Pass the file content to the designated Parser
                //console.log(event);
            };
            reader.readAsText(file); 
        }
        else {
            alert("Unable to read file");
        }
    };

    return {
        init: (file) => init(file)
    };
};

// const FileSource1 = (() => {
//     return getFileItr(StoreSrc1, ToJsonMain.init);
// })();

const Files = [
    [getFileReader(STORE_SOURCE, LEFT, SrcToJsonMain.init), getFileReader(STORE_SOURCE, RIGHT, SrcToJsonMain.init)]
];



