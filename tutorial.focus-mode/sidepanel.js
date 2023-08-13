// sidebar.js

main();

function main() {
  chrome.storage.local.get("selected_keywords").then((result) => {
    const selectedKeywords = result.selected_keywords || [];
    console.log("previous selected keywords", selectedKeywords);
    reloadKeywords(selectedKeywords);
    // input text
    createInput(selectedKeywords);
    clearKeywordsButton();
  });
}

chrome.storage.onChanged.addListener((message) => {
  console.log("message", message);
  const keywords = message.selected_keywords.newValue || [];
  reloadKeywords(keywords);
});

function reloadKeywords(keywords) {
  // clean up the sidepanel
  const selectedKeywords = document.getElementById("selected-keyword");
  selectedKeywords.innerHTML = "";
  // add the new keywords
  keywords.forEach((keyword) => {
    if (keyword) addKeywordButton(keyword);
  });
}

function addKeywordButton(keyword) {
  const selectedKeywords = document.getElementById("selected-keyword");
  const newSelectedKeyword = document.createElement("div");
  newSelectedKeyword.style = "position:absolute; z-index: 9";
  newSelectedKeyword.id = keyword;
  newSelectedKeyword.className = "draggable";

  const top = getPosition(selectedKeywords);
  newSelectedKeyword.style.top = top;

  const header = document.createElement("div");
  header.appendChild(document.createTextNode(keyword));
  header.className =
    "rounded-md bg-zinc-100 hover:bg-zinc-200 px-4 py-2 m-1 text-md border-2 border-black";
  header.id = keyword + "header";
  header.style = "cursor: move;z-index: 10";
  newSelectedKeyword.appendChild(header);

  // newSelectedKeyword.addEventListener("click", () => {
  //   let msg = { chosen_keyword: keyword };
  //   chrome.runtime.sendMessage(msg);
  // });
  // Check if the keyword has been displayed before based on its text content

  selectedKeywords.appendChild(newSelectedKeyword);
  dragElement(newSelectedKeyword);
}

function getPosition(selectedKeywords) {
  const length = selectedKeywords.children.length;
  const maxHeight = selectedKeywords.offsetHeight + 40;
  const top = 100 + Math.floor(length * maxHeight) + "px";
  return top;
}

//60-250, 280-470
function createInput(keywords) {
  const createButton = document.getElementById("addClassButton");
  createButton.addEventListener("click", () => {
    const chosen_keywords = [];
    keywords.forEach((keyword) => {
      const element = document.getElementById(keyword);
      const rect = element.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      if (top > 60 && top < 250) {
        chosen_keywords.push(keyword);
      } else if (top > 280 && top < 470) {
        chosen_keywords.push('"' + keyword + '"');
      }
    });
    const combinedKeywords = chosen_keywords.join(" & ");
    console.log("Combined Keywords:", combinedKeywords);
    let msg = { chosen_keywords: combinedKeywords };
    chrome.runtime.sendMessage(msg);
  });
}

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Add listener to the clear button
function clearKeywordsButton() {
  const clearKeywordsButton = document.getElementById("clearKeywordsButton");
  clearKeywordsButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "clearKeywords" }, (response) => {
      if (response.cleared) {
        console.log("Selected keywords cleared from clear.js");
      }
    });
  });
}

// &, |, -, "", (), *, ?, ti:"", au:"", cat:""
