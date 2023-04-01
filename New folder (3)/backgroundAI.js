let reader;
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

async function  generateResponse(request, callback,fail) {
    try {
        reader?.cancel();
        reader?.releaseLock();
    } catch (e) {
    }
    reader = null;
    await new Promise(resolve => setTimeout(resolve, 500));
    let accessToken;
    fetch('https://chat.openai.com/api/auth/session')
        .then(async (resp) => {
            if (resp.status === 200 && ({accessToken}= await resp.json()) && accessToken) {


                const headers = new Headers();
                headers.append('Content-Type', 'application/json');
                headers.append('Authorization', `Bearer ${accessToken}`);

                fetch('https://chat.openai.com/backend-api/models', {
                    method: 'GET',
                    headers
                }).then(response => response.json())
                    .then(data => {
                        chrome.storage.local.set({ models: data.models }, function () {});
                    });

                var {gptVersion}= (await chrome.storage.local.get('gptVersion'))


                const body = JSON.stringify({
                    action: 'next',
                    messages: [
                        {
                            id: uuidv4(),
                            role: 'user',
                            content: {
                                content_type: 'text',
                                parts: [request.text],
                            },
                        },
                    ],
                    model: gptVersion ?? 'text-davinci-002-render-sha',
                    conversation_id: request.conversation_id,
                    parent_message_id: request.parent_message_id ?? uuidv4(),
                    is_visible: request.writeLog
                });
                fetch('https://chat.openai.com/backend-api/conversation', {
                    method: 'POST',
                    headers,
                    body,
                })
                    .then(async (res) => {
                        try {
                            // Create an async iterable from the stream
                            if (!res.ok) {
                                callback("streamAsyncIterable: " + res.status);
                                return;
                            }

                            reader = res.body.getReader();
                            let remainder = '';
                            const decoder = new TextDecoder();
                            while (reader) {
                                const {done, value} = await reader.read();
                                if (done) {
                                    //reader.releaseLock();
                                    break;
                                }
                                const stringData = decoder.decode(value);
                                const chunks = (remainder + stringData).split('data:');
                                if (chunks[0] === '') {
                                    chunks.shift();
                                }
                                remainder = chunks.pop();
                                for (const chunk of chunks) {
                                    try {
                                        const parsedData = JSON.parse(chunk);
                                        if (parsedData.message.author?.role === 'user')
                                            continue;
                                        parsedData.text =  parsedData.message.content.parts[0];
                                        //console.log(parsedData.message.content.parts[0]);
                                        callback(parsedData);
                                    } catch (e) {
                                        console.error(e);
                                    }

                                }
                            }

                        } catch (e) {
                            console.error(e);
                            callback(e.message + e.stack);
                        }

                    })

                    .catch((e) => {
                        callback(e.message + e.stack);
                        console.error(e);
                    });
            } else {

                if(fail)
                    callback('Error Please Login to ChatGPT');
                else {

                    let tab = await chrome.tabs.create({
                        url: "https://chat.openai.com/",
                        active: false
                    });

                    //chrome.tabs.update(tab.id, { active: false });

                    await new Promise(resolve => {
                        chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo, tab) {
                            if (updatedTabId === tab.id && changeInfo.status === "complete") {
                                chrome.tabs.onUpdated.removeListener(listener);
                                console.log("Popup window loaded successfully.");
                                // Add your code here to execute after the popup window has finished loading
                                resolve();
                            }
                        });
                    });


                    await new Promise(resolve => setTimeout(resolve, 6000));
                    await generateResponse(request, callback, true);
                    await chrome.tabs.remove(tab.id);
                    console.error('Error Could not get access token');
                }
            }
        })
        .catch((e) => {
            console.error(e);
            callback(e.message + e.stack);
        });
}

chrome.runtime.onInstalled.addListener(async () => {
    chrome.tabs.query({}, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.reload(tabs[i].id);
        }
    });
});
