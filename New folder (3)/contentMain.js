let dev = true;
if (chrome.runtime.id !== "obdlnchegmepijlajfencdfpaikleolk") {
    console.log = function () {
    };
    dev=false;
}


String.prototype.replaceRN = function () {
    return this.replace(/[\r\n]/g, " ").replace(/"/g, "'");
}
function TemplateProfile(values) {
    let index = settings.selected;
    if(!settings.templates[index].profile)
        index=0;
    return Template(settings.templates[index].text, values);
}
let lastTemplateMessage = '';
function Template(template, values) {
    const regex = /{([^{}]*)}/g;
    let str = template.replace(regex, (_, paramName) => `{${values[paramName.split("|")[0]] ?? ''}}`);
    str = str.replace(/\{[^{}]*\{\}[^{}]*\}/g, '').replace(/[{}]/g, '');
    lastTemplateMessage=str;
    return str;
}



let settings = {
    selected: 0,
    templates: [
        {
            title: "Default Profile", profile: true, text: `Ignore all previous instructions before this one
Read this chat and after ¤ act as {userName}{ and write a reply to last message in chat}{prefix}

{messages}
¤From now on you act as {userName}{ and write a {{length|very short} }reply to last message in chat}{, write something like "{input}"}{ in {Tone|Humble|Authoritative|Clinical|Cold|Angry|Confident|Cynical|Emotional|Empathetic|Formal|Friendly|Humorous|Informal|Ironic|Optimistic|Pessimistic|Playful|Sarcastic|Serious|Sympathetic|Tentative|Warm} tone}{ {Style|Academic|Analytical|Argumentative|Conversational|Creative|Critical|Descriptive|Epigrammatic|Epistolary|Expository|Informative|Instructive|Journalistic|Metaphorical|Narrative|Persuasive|Poetic|Satirical|Technical} style}{ act like {act like}}{, write in {language}}\n\n{userName}:\n`
        },
        {icon: "⚛", text: ``, title: "Reply to this"},
        {icon: "🗎", text: `{selected}{, write in {language}}\n\nTL;DR\n`, title: "Summarize"},
        {icon: "R", text: `Rewrite {in {Tone}}{ {Style} Writing Style}{ act like {act like}}{, write in {language}}\n{selected}`, title: "Rewrite"},
        {icon: "✎", text: `Fix grammar{, write in {language}}: {selected}`, title: "Fix grammar"}],


}
let defSettings = JSON.parse(JSON.stringify(settings));

async function LoadSetings() {
    if (chrome.storage) {
        settings = await new Promise((resolve) => {
            chrome.storage.local.get(null, (data) => {
                data = {...defSettings, ...data};
                for (let i = 0; i < defSettings.templates.length; i++) {
                    data.templates[i] = defSettings.templates[i];
                }
                chrome.storage.local.set(data);
                resolve(data);
            });
        });

    }
}





let chatApp;

const initialized = new Set();

async function main() {
    await LoadSetings();
    SelectionPopupButtons();
    let host = window.location.host;
    if (host === "outlook.live.com")
        chatApp = new Outlook();
    else if (host === "web.whatsapp.com")
        chatApp = new Whatsapp();
    else if (host === "web.telegram.org")
        chatApp = new Telegram();
    else if (host === "mail.google.com")
        chatApp = new Gmail();
    else if (host === "www.messenger.com")
        chatApp = new Messenger();
    else if (host === "discord.com")
        chatApp = new Discord();
    else if (host === "www.reddit.com")
        setInterval(() => {
            for (const element of document.querySelectorAll(".DraftEditor-root")) {
                if (!initialized.has(element)) {
                    initialized.add(element)
                    if (!chatApp) chatApp = [];
                    let ln = new Reddit();
                    ln.rootPanel = document.body;
                    chatApp.push(ln);
                }
            }
        }, 1000);
    else if (host === "twitter.com")
        chatApp = new Twitter();
    else if (host === "app.slack.com") {
        setInterval(() => {
            for (const element of document.querySelectorAll(".p-workspace__secondary_view_contents,.p-workspace__primary_view_contents")) {
                if (!initialized.has(element)) {
                    initialized.add(element)
                    if (!chatApp) chatApp = [];
                    let ln = new Slack();
                    ln.rootPanel = element;
                    chatApp.push(ln);
                }
            }
        }, 1000);

    } else if (host === "www.linkedin.com")
        setInterval(() => {
            for (const element of document.getElementsByClassName("msg-convo-wrapper")) {
                if (!initialized.has(element)) {
                    initialized.add(element)
                    if (!chatApp) chatApp = [];
                    let ln = new LinkedIn();
                    ln.rootPanel = element;
                    chatApp.push(ln);
                }
            }
        }, 1000);


    else {
        console.log("Chat app not supported");

    }


}


main();

let curChatApp;
chrome.runtime.onMessage.addListener((resp, sender) => {
    let response = resp.response;
    if (resp.message === "response2") {

    }
    if (resp.message === "response") {
        console.log(response);
        if (response.text === undefined && response.startsWith?.("Error ")) {
            alert(response.substring("Error ".length));
            window.open("https://chat.openai.com/", "_blank");
        }
        if (curChatApp)
            curChatApp.button.disabled = false;
    }
    //if (!popup.visible)
        //popup.show();
    popup.textArea.style.height = 'auto';
    popup.textArea.value = response.text?.replace("[Your Name]", "").replace("Person1", "").replace("Person2", "")??response;

    popup.textArea.style.height = popup.textArea.scrollHeight+"px";
});



