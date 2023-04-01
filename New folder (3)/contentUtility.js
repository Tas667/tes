/*
function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash;
}

function getShortHashCode(str) {
    const hash = djb2Hash(str).toString();
    return hash.substring(hash.length - 2);
}
*/


function getAllSelectedNodes() {
    const selection = window.getSelection();
    const selectedNodes = [];

    function isChildOfSelectedNode(node) {
        return selectedNodes.some(selectedNode => selectedNode.contains(node));
    }

    for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        const commonAncestor = range.commonAncestorContainer;
        const startNode = range.startContainer;
        const endNode = range.endContainer;

        if (startNode === endNode && startNode.nodeType === Node.ELEMENT_NODE && !isChildOfSelectedNode(startNode)) {
            selectedNodes.push(startNode);
        } else {
            const treeWalker = document.createTreeWalker(commonAncestor, NodeFilter.SHOW_ELEMENT, {
                acceptNode: node => {
                    if (isChildOfSelectedNode(node)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            while (treeWalker.nextNode()) {
                const currentNode = treeWalker.currentNode;
                if (range.intersectsNode(currentNode) && !isChildOfSelectedNode(currentNode)) {
                    selectedNodes.push(currentNode);
                }
            }
        }
    }

    return selectedNodes;
}
