importScripts('backgroundAI.js');

//receive message from content script
chrome.runtime.onMessage.addListener(
    function (request, sender) {
        if (request.message === "getmail") {
            generateResponse(request, async function (response) {
                //send async response to content script
                try {
                    await chrome.tabs.sendMessage(sender.tab.id, {message: "response", response: response});
                } catch (e) {
                    console.error(e);
                    //await chrome.tabs.reload(sender.tab.id);
                }

            });
        }
    }
);



