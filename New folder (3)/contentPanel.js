let mouseEvent;

let isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
let stylePopup = {position: 'fixed', background: isDarkMode ? '#343a40' : 'white', border: '1px solid rgba(0, 0, 0, 0.2)', borderRadius: '0.25rem', padding: '1rem', zIndex: '10000', display: 'none', maxWidth: '80%', maxHeight: '80%', overflow: 'auto'};
let textColor = isDarkMode ? 'white' : 'black';
let styleTextArea = { marginTop: '10px' ,display: 'block',width: '500px', resize: 'both', borderRadius: '0.25rem', border: '1px solid rgba(0, 0, 0, 0.2)', padding: '0.5rem', background: isDarkMode ? '#23272b' : 'white', color: textColor,};
let styleButton = { display: 'inline-block', marginTop: '10px',marginRight: '10px', borderRadius: '0.25rem', border: '1px solid rgba(0, 0, 0, 0.2)', background: isDarkMode ? '#6c757d' : '#007bff', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer',};
function applyStyles(styles, ...elements)  {
    elements.forEach(element =>
        Object.entries(styles).forEach(([property, value]) => {
            element.style[property] = value;
        })
    );
}

let popup = CreatePanel();
let preview = CreatePreviewPanel();
function CreatePreviewPanel(){

    const [popup, textarea, closeButton,sendButton] = ['div', 'textarea', 'button','button' ].map(tag => document.createElement(tag))
    applyStyles(stylePopup, popup);
    applyStyles(styleTextArea, textarea);
    applyStyles(styleButton, closeButton,sendButton);
    closeButton.addEventListener('click', () => popup.hide());
    popup.textarea=textarea;


    closeButton.textContent = 'Close';
    sendButton.textContent = 'Generate';

    sendButton.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({message: "getmail", text: textarea.value, writeLog: settings.writeLog ?? false});
    });
    popup.hide = () => {
        popup.style.display = 'none';
    }
    popup.show = () => {
        popup.style.display = 'block';
        popup.style.left = 0 + 'px';
        popup.style.top = 0 + 'px';

        textarea.style.height = 'auto';
        textarea.value = lastTemplateMessage;
        textarea.style.height = textarea.scrollHeight+"px";

        textarea.clientHeight = window.innerHeight - 100;
    }

    [textarea, closeButton,sendButton].forEach(child => popup.appendChild(child));
    document.body.appendChild(popup);

    return popup;

}
function CreatePanel() {

    const [popup,nameField, textarea, closeButton, titleElement,editButton,sendButton,copyButton] = ['div', 'input', 'textarea', 'button', 'h3', 'button','button','button' ].map(tag => document.createElement(tag))
    applyStyles(stylePopup, popup);
    applyStyles(styleTextArea, textarea,nameField);
    applyStyles(styleButton, closeButton, editButton,sendButton,copyButton);
    applyStyles({marginBottom: '10px',color: textColor}, titleElement);

    popup.id = "popup";
    nameField.placeholder = 'Enter your name';
    textarea.placeholder = 'Enter your message';

    closeButton.textContent = 'Close';
    editButton.textContent = 'Edit';
    editButton.style.display = 'none';
    copyButton.textContent = 'Copy';

    copyButton.addEventListener('click', () => {
        let input = document.getSelection().focusNode === popup ? document.getSelection().toString() || textarea.value : textarea.value;
        navigator.clipboard.writeText(input);
        popup.hide();
    });
    closeButton.addEventListener('click', () => popup.hide());
    popup.addEventListener('mousedown', e=> {if(e.button === 2) editButton.style.display = 'inline-block'});
    editButton.addEventListener('click', () => { preview.show();});

    sendButton.addEventListener('click', async () => {

        await LoadSetings();
        let input = popup.textArea.value;

        let userName = nameField.value||"Person1"

        let hls = Array.from(document.getElementsByClassName(gpt4highlight))
        let messages = [];

        for (let i = 0; i < hls.length; i++) {
            if(hls[i].innerText.trim().length<3) continue;
            //messages.push("[Message context "+ getShortHashCode(hls[i].className+Array.from(hls[i].querySelectorAll('[class]')).map(a=>a.className).join(""))+"]\n" +hls[i].innerText);
            messages.push(hls[i].innerText);
        }

        let text = TemplateProfile( {
            ...settings,
            title: document.title,
            userName: userName,
            input: input,
            selected: document.getSelection().toString(),
            //prefix:", each message is prefixed with [Message]",
            messages: messages.slice(-10).join("\n")
        })

        console.log(text);

        await chrome.runtime.sendMessage({message: "getmail", text: text, writeLog: settings.writeLog ?? false});


    });
    sendButton.textContent = 'Send';



    [titleElement,nameField, textarea,sendButton, copyButton,editButton,closeButton].forEach(child => popup.appendChild(child));
    document.body.appendChild(popup);

    let isDragging = false, offsetX, offsetY;

    popup.textArea = textarea;



    popup.addEventListener('mousedown',  e => {
        if (e.target === textarea) return;
        isDragging = true;
        offsetX = e.clientX - popup.getBoundingClientRect().left;
        offsetY = e.clientY - popup.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove',  e => {
        mouseEvent = e;
        if (!isDragging) return;
        e.preventDefault();
        const [popupWidth, popupHeight, windowWidth, windowHeight] = [popup.clientWidth, popup.clientHeight, window.innerWidth, window.innerHeight];
        const x = Math.min(Math.max(e.clientX - offsetX, 0), windowWidth - popupWidth);
        const y = Math.min(Math.max(e.clientY - offsetY, 0), windowHeight - popupHeight);
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
    });
    document.addEventListener('mouseup', () => isDragging = false);

    popup.show = (title) => {
        titleElement.textContent = title??"GPT 4 Chat";
        textarea.value = "Loading...";
        popup.visible = true;
        nameField.style.display =sendButton.style.display  = document.getElementsByClassName(gpt4highlight).length === 0? 'none' : 'inline-block';


        if (!isDragging) {
            popup.style.display = 'block';
            const [popupWidth, popupHeight, windowWidth, windowHeight] = [popup.clientWidth, popup.clientHeight, window.innerWidth, window.innerHeight];
            const x = Math.min(Math.max(mouseEvent.clientX, 0), windowWidth - popupWidth);
            const y = Math.min(Math.max(mouseEvent.clientY, 0), windowHeight - popupHeight);
            popup.style.left = x + 'px';
            popup.style.top = y + 'px';
        }
    };

    popup.hide = () => {
        Clear()
        popup.visible = false;
        popup.style.display = 'none';
    };

    return popup;
}



