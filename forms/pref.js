
const getPrefForm = () => {
    const formName = "PrefForm";
    const idModal = "modalPref";

    let data = PrefStore.getData();
    
    const radios = [
        {text: "Main Debug", options: ["Source", "Json"], selected: 0, storeKey: "debugSrc"},
        {text: "Local Storage", options: ["Don't parse", "Parse"], selected: 0, storeKey: "useStorage"}
    ];

    radios.forEach(r => r.selected = data[r.storeKey]);

    // console.log("init")
    // console.log(data)
    // console.log(radios)
    
    const onRadioChange = (i,j) => {
        //console.log("onRadioChange", i, j)
        radios[i].selected = j;
        //console.log(radios)
    };

    const accept = () => {
        data = {};
        radios.forEach(r => data[r.storeKey] = r.selected);
        PrefStore.setData(data);
        MainDisplay.showDebug();
    };

    const radio =  (r, i) => {
        const {text, options, selected} = r;
        const id = `r_${i}`;

        const optionsMap = options.map((o, j) => {
            //console.log(o, i, j, selected)
            const checked = (j === selected)? "checked" : "";
            return `
                <div class="form-check-inline">
                    <input class="form-check-input" type="radio" name="${id}" id="${id}" ${checked}
                    onchange="${formName}.onRadioChange(${i},${j})" >
                    <label class="form-check-label" for="${id}">
                    ${o}
                    </label>
                </div>`;
        });
        return `
            <div class="form-group">
                <label for="${id}" >${text}</label></br>
                ${optionsMap.join(" ")}
            </div>`;
        
    };

    const gen = () => {
        const modalDiv = document.createElement('div');
        modalDiv.classList.add('modal', 'fade');
        modalDiv.id = idModal;
        modalDiv.setAttribute('tabindex', '-1');
        modalDiv.setAttribute('role', 'dialog');
        modalDiv.setAttribute('aria-labelledby', `${idModal}Label`);
        modalDiv.setAttribute('aria-hidden', 'true');

        const formGroups = radios.map((item, i) => {
            return radio(item, i);
        });

        modalDiv.innerHTML = `
          <div class="modal-dialog modal-dialog-scrollable modal-lg dnav" role="document" shown.bs.modal="() => console.log('aaaa')">
            <div class="modal-content dnav">
              <div class="modal-header dnav">
                <h5 class="modal-title" Label">Preferences</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <div class="container-fluid " id="co_" >
                    ${formGroups.join(" ")}
                </div>
              </div>
              <div class="modal-footer">
                  <button type="button" class="btn btn-success" data-dismiss="modal"
                        onclick="${formName}.accept()" id="su_" >Submit</button>
                  <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        `;

        const dest = document.getElementById("forms");
        dest.appendChild(modalDiv);
    };
    
    return {
        gen: gen,
        onRadioChange: onRadioChange,
        accept: accept
    };
};