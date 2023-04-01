const writeLog = document.getElementById('writeLog');
const gptVersion = document.getElementById('gpt-version');
const templateSelect = document.getElementById('template-select');
const languageSelect = document.getElementById('language-select');

document.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { //when Supported messengers are clicked
        e.preventDefault();
        chrome.tabs.create({url: e.target.href});
    }
});

[writeLog, gptVersion, languageSelect].forEach(el => el.addEventListener('change', () => saveSettings()));

setInterval(saveSettings, 500);

function saveSettings() {
    chrome.storage.local.set({
        writeLog: writeLog.checked,
        gptVersion: gptVersion.value,
        gptTitle: gptVersion.options[gptVersion.selectedIndex]?.text,
        template: templateSelect.value,
        language: languageSelect.value
    });
}


//load settings
let settings;
function loadSettings() {
    chrome.storage.local.get(null, (sets) => {
        settings = sets;
        console.log(settings);
        writeLog.checked = settings.writeLog ?? false;

        // Load the language select
        const languageSelect = document.getElementById('language-select');
        navigator.languages.forEach((lang) => {
            const option = document.createElement('option');

            // Use Intl.DisplayNames to get the display name of the language
            const languageNames = new Intl.DisplayNames(navigator.language, {type: 'language'});
            const languageName = languageNames.of(lang);

            option.value = languageName;
            option.textContent = languageName;
            languageSelect.appendChild(option);
        });
        languageSelect.value = settings.language || ''; // Set the initial selected value to the current value in settings or default



        // Load the templates
        let profiles= settings.templates.filter(a=>a.profile);
        if (profiles.length>1) {
            templateSelect.innerHTML = '';
            settings.templates.forEach((template, index) => {
                if(template.profile) {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = template.title;
                    templateSelect.appendChild(option);
                }
            });
            templateSelect.value = settings.selected;
        }
        else
            templateSelect.hidden=true;

        const regex = /{([^{}]*)}/g;
        let template= settings.templates[settings.selected??0];
        if(!template.profile)
            template= settings.templates[settings.selected=0];
        const matches = new Set(template.text.match(regex));
        let body = document.getElementById('dynamic-settings');
        body.innerHTML= '';
        matches.forEach(match => {
            let paramName = match.slice(1, -1);
            if (paramName !== "userName" && paramName !== "selected" && paramName !== "messages" && paramName !== "input"&& paramName !== "prefix"&& paramName !== "language") {
                // If paramName contains '|', create a dropdown list


                if (paramName.includes('|')) {
                    const values = paramName.split('|');
                    paramName = values[0];
                    const title = values.shift(); // remove the first value and set it as the title
                    const select = document.createElement("select");
                    select.style.color = "black";

                    // Create title span element for the first value
                    const titleSpan = document.createElement("span");
                    titleSpan.innerText = title + " ";
                    body.appendChild(titleSpan);


                    const option = document.createElement("option");
                    option.text = "default";
                    option.value = '';
                    select.add(option);

                    // Create options for each remaining value
                    values.forEach(value => {
                        const option = document.createElement("option");
                        option.text = value;
                        option.value = value;
                        select.add(option);
                    });

                    // Set the initial selected value to the current value in settings
                    select.value = settings[paramName] || '';

                    select.addEventListener("change", () => {
                        chrome.storage.local.set({[paramName]: select.value});
                    });

                    // Append the select to the body or any other element
                    body.appendChild(select);
                    body.appendChild(document.createElement("br"));
                } else { // Otherwise, create a textarea
                    const textarea = document.createElement("textarea");
                    textarea.placeholder = `${paramName}`;
                    textarea.value = settings[paramName] ?? "";
                    textarea.style.color = "black";
                    textarea.style.display = "block";

                    textarea.addEventListener("change", () => {
                        chrome.storage.local.set({[paramName]: textarea.value});
                    });

                    // Append the textarea to the body or any other element
                    body.appendChild(textarea);
                }
            }
        });


        const models = settings.models;
        if (models?.length > 1) {
            for (let i = 0; i < models.length; i++) {
                let option = document.createElement("option");
                option.text = models[i].title;
                option.value = models[i].slug;
                gptVersion.add(option);
            }
        } else
            gptVersion.hidden = true;

        gptVersion.value = settings.gptVersion ??  models[0].slug;


    });
}
loadSettings()

templateSelect.addEventListener('change', () => {
    chrome.storage.local.set({selected: templateSelect.value});
    loadSettings()
});

document.addEventListener("contextmenu", function (e) {
    var menuItem = document.getElementById("menu-item");
    menuItem.style.display = "block";
    menuItem.style.top = e.pageY + "px";
    menuItem.style.left = e.pageX + "px";
});
