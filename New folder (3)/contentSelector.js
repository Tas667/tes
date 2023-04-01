const gpt4highlight = "gpt4highlight"
// Function to highlight elements with the same class
function highlightElementsByClass(className) {
    const elements = document.getElementsByClassName(className.className);
    for (let i = 0; i < elements.length; i++) {
        if(!elements[i].innerText) continue;
        // Remove highlight class from all parent elements
        let parent = elements[i].parentNode;
        while (parent && parent !== document.body) {
            parent.classList.remove(gpt4highlight);
            parent = parent.parentNode;
        }
       Array.from(elements[i].getElementsByClassName(gpt4highlight)).forEach(el => el.classList.remove(gpt4highlight));

        // Add highlight class to the current element
        elements[i].classList.add(gpt4highlight);
        if (elements[i] === targetElement) {
            break;
        }
    }
}



// Function to handle mouseover event
let targetElement;


// Function to handle mouseout event
function Clear() {
    for (let el of document.querySelectorAll(".gpt4highlight")) {
        el.classList.remove(gpt4highlight);
    }
}


// Add CSS styles for highlighting
const style = document.createElement("style");
style.textContent = `
.gpt4highlight {
  background-color:  rgba(255, 255, 0, 0.3); outline: 2px solid red;
  transition: background-color 0.3s;
}`;
document.head.appendChild(style);


function HighlightFromSelection()
{
    const selectedNodes = getAllSelectedNodes();
    console.log(selectedNodes);
    if(selectedNodes.length === 0)
        selectedNodes.push(document.getSelection().focusNode.parentElement);



    for (let element of selectedNodes) {
        //let element = document.getSelection().anchorNode.parentElement;
        while (element && !element.className) {
            element = element.parentElement;
        }
        if (element) {
            targetElement = element;
            highlightElementsByClass(element);
        }
    }

}
