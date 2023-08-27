// sidebar.js

// Tabs
const showPage1 = () => {
  document.getElementById("page1").style.display = "block";
  document.getElementById("tab1").style.backgroundColor = "steelblue";
  document.getElementById("page2").style.display = "none";
  document.getElementById("tab2").style.backgroundColor = "lightblue";
};
const showPage2 = () => {
  document.getElementById("page2").style.display = "block";
  document.getElementById("tab2").style.backgroundColor = "steelblue";
  document.getElementById("page1").style.display = "none";
  document.getElementById("tab1").style.backgroundColor = "lightblue";
};
document.getElementById("tab1").addEventListener("click", function () {
  showPage1();
});
document.getElementById("tab2").addEventListener("click", function () {
  showPage2();
});
showPage1();

// state is selected keywords
let state = {
  selected_keywords: [],
  article_history: [],
  searched_keywords: [],
};

var WordDragType = "default" | "quoted" | "leftout";

var Keyword = {
  keyword: "",
  count: 0,
  position: { top: 0, left: 0 },
  type: WordDragType,
};

var article_history = {
  id: "",
  title: "",
  url: "",
};

var searched_keywords = {
  text: "",
};

// synchronize the storage with the elements on the page
function synchronizeKeywordPosition(keywordObj) {
  // get the element
  const element = document.getElementById(keywordObj.keyword);
  if (!element) return keywordObj;
  keywordObj.position.top = element.style.top;
  keywordObj.position.left = element.style.left;
  topValue = parseInt(keywordObj.position.top.slice(0, -2));
  if (topValue > 150 && topValue < 340) {
    keywordObj.type = "default";
  } else if (topValue > 375 && topValue < 565) {
    keywordObj.type = "quoted";
  } else {
    keywordObj.type = "leftout";
  }
  // console.log("keywordObj", keywordObj);
  return keywordObj;
}

// added_keywords: Keyword[]
// keywords_added_to_sidepanel: Keyword[]

// function keywordObjectFromDOMElement(element) {
//   const keyword = element.id;
//   const keywordFromState =
//     state.find((keyword) => keyword.keyword === id) || null;
//   if (!keywordFromState) return;
//   let type = "default";
//   //150-340, 375-565
//   if (top > 150 && top < 340) {
//     type = "default";
//   } else if (top > 375 && top < 565) {
//     type = "quoted";
//   } else {
//     type = "leftout";
//   }

//   const newKeyword = {
//     keyword: keyword,
//     count: keywordFromState.count,
//     position: {
//       top: element.style.top,
//       left: element.style.left,
//     },
//     type: type,
//   };
//   return newKeyword;
// }

// function updateOneKeywordInState(keyword) {
//   const index = state.findIndex(
//     (keyword) => keyword.keyword === keyword.keyword
//   );
//   if (index === -1) state.push(keyword);
//   else state[index] = keyword;
// }

// function rerenderSidepanel() {
//   const selectedKeywords = document.getElementById("selected-keyword");
//   selectedKeywords.innerHTML = "";
//   state.forEach((keyword) => {
//     if (keyword) addKeywordButton(keyword);
//   });
// }

// function sendStateToStorage() {
//   chrome.storage.local.set({ selected_keywords: state }, () => {
//     console.log("state sent to storage", state);
//   });
// }

// updateOneKeywordInState(keyword: Keyword) {

chrome.storage.local.get("selected_keywords").then((result) => {
  const selectedKeywords = result.selected_keywords || [];
  state.selected_keywords = selectedKeywords;
  console.log("previous selected keywords", selectedKeywords);
  reloadKeywords(selectedKeywords);
  // input text
  createInput(selectedKeywords);
  clearKeywordsButton();
});

chrome.storage.local.get("history").then((result) => {
  const article_history = result.history || [];
  state.article_history = article_history;
  console.log("previous article history", article_history);
  populateArticleHistoryList("articleList", article_history);
});

chrome.storage.local.get("searchInput").then((result) => {
  const searched_keywords = result.searchInput || [];
  state.searched_keywords = searched_keywords;
  console.log("previous searched keywords", searched_keywords);
  populateSearchedKeywordsList("searchedList", searched_keywords);
});

chrome.storage.onChanged.addListener((message) => {
  console.log("message", message);
  if (message.history) {
    const newArticleHistory = message.history.newValue || [];
    state.article_history = newArticleHistory;
    populateArticleHistoryList("articleList", newArticleHistory);
  }
  if (message.searchInput) {
    const newSearchedKeywords = message.searchInput.newValue || [];
    state.searched_keywords = newSearchedKeywords;
    populateSearchedKeywordsList("searchedList", newSearchedKeywords);
  }
  if (message.selected_keywords) {
    const newKeywords = message.selected_keywords.newValue || [];
    state.selected_keywords = newKeywords;
    newKeywords.forEach((keywordObj) => {
      if (keywordObj) synchronizeKeywordPosition(keywordObj);
    });
    reloadKeywords(newKeywords);
    createInput(newKeywords);
    clearKeywordsButton();
  }
});

setInterval(() => {
  createInput(state.selected_keywords);
}, 1000);

function reloadKeywords(keywords) {
  // clean up the sidepanel
  const selectedKeywords = document.getElementById("selected-keyword");
  selectedKeywords.innerHTML = "";
  // add the new keywords
  console.log("keywords", keywords);
  keywords.forEach((keywordObj) => {
    if (keywordObj) {
      addKeywordButton(keywordObj);
    }
  });
  chrome.storage.local.set({ selected_keywords: keywords }, () => {
    console.log("state sent to storage", keywords);
  });
}

function addKeywordButton(keywordObj) {
  const keyword = keywordObj.keyword;
  const selectedKeywords = document.getElementById("selected-keyword");
  const newSelectedKeyword = document.createElement("div");
  newSelectedKeyword.style = "position:absolute; z-index: 9";
  newSelectedKeyword.id = keyword;
  newSelectedKeyword.className = "draggable";

  newSelectedKeyword.style.top = keywordObj.position.top;
  newSelectedKeyword.style.left = keywordObj.position.left;
  const header = document.createElement("div");
  header.appendChild(document.createTextNode(keyword));
  header.className =
    "rounded-md bg-zinc-100 hover:bg-zinc-200 px-4 py-2 m-1 text-md border-2 border-black transition-colors duration-500 ease-in-out";
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

// Change Current Input Div every second
function createInput(keywords) {
  const inputKeyword = document.getElementById("currentInput");
  let newInput = "";
  keywords.forEach((keywordObj) => {
    if (keywordObj) {
      synchronizeKeywordPosition(keywordObj);
      if (keywordObj.type === "default") {
        newInput += keywordObj.keyword;
        newInput += " & ";
      } else if (keywordObj.type === "quoted") {
        newInput += '"';
        newInput += keywordObj.keyword;
        newInput += '" & ';
      }
    }
  });
  newInput = newInput.slice(0, -2);
  inputKeyword.innerHTML = newInput;
  // click addClassButton and newInput will be sent to background.js
  const createButton = document.getElementById("addClassButton");
  createButton.addEventListener("click", () => {
    let msg = { chosen_keyword: newInput };
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

    // save the current position of the element to chrome storage
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
    let header = document.getElementById(elmnt.id + "header");
    //150-340, 375-565
    if ((pos4 > 150 && pos4 < 340) || (pos4 > 375 && pos4 < 565)) {
      header.className = header.className.replace("bg-zinc", "bg-blue");
    } else {
      header.className = header.className.replace("bg-blue", "bg-zinc");
    }
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
    chrome.storage.local.get("selected_keywords").then((result) => {
      const selectedKeywords = result.selected_keywords || [];
      selectedKeywords.forEach((keywordObj) => {
        if (keywordObj) synchronizeKeywordPosition(keywordObj);
      });
      // check if the keyword's type is leftout and clear
      const newKeywords = selectedKeywords.filter(
        (keyword) => keyword.type !== "leftout"
      );
      chrome.storage.local.set({ selected_keywords: newKeywords }, () => {
        console.log("state sent to storage", newKeywords);
      });
    });
  });
}

let OPENAI_API_KEY = "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";

const openDialogButton = document.getElementById("openDialogButton");
const dialogBox = document.getElementById("dialogBox");
const inputField = document.getElementById("inputField");
const submitButton = document.getElementById("submitButton");
const closeDialogButton = document.getElementById("closeDialogButton"); // Add this line

openDialogButton.addEventListener("click", () => {
  dialogBox.style.display = "block";
});

closeDialogButton.addEventListener("click", () => {
  dialogBox.style.display = "none";
  inputField.value = "";
});

submitButton.addEventListener("click", () => {
  const inputValue = inputField.value;
  if (inputValue) {
    askAI(inputValue).then((rep) => {
      console.log("rep", rep);
      aiDialog = document.getElementById("aiDialog");
      aiDialog.innerHTML = rep;
      // Close the dialog box
      inputField.value = "";
    });
  }
});

async function askAI(userQuestion) {
  console.log("state", state);
  const selected_keywords = state.selected_keywords
    .filter(
      (keyword) => keyword.type === "default" || keyword.type === "quoted"
    )
    .map((keyword) => keyword.keyword)
    .join(", ");
  const searched_keywords = state.searched_keywords
    .map((searches) => searches.text)
    .join(", ");
  const article_history = state.article_history
    .map((article) => article.title)
    .join(", ");

  let prompt =
    `Your are a helpful academic librarian. The student is doing some research and here's what they have so far:\n` +
    `They highlighted the following keywords: ${selected_keywords}\n` +
    `They searched for the following keywords: ${searched_keywords}\n` +
    `They have skimmed the following articles: ${article_history}\n` +
    `Now they are thinking about: ${userQuestion}\n` +
    `You are going to help them by giving some advice or answering their question.\n` +
    `And please limit your response within 100 words.`;
  console.log("prompt", prompt);
  const apiKey = OPENAI_API_KEY;
  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const data = JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: userQuestion,
      },
    ],
    temperature: 0.7,
  });
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: data,
  });
  const result = await response.json();
  //console.log("result", result);
  const messageContent = result.choices[0].message.content;
  console.log("messageContent", result.choices[0].message.content);
  return messageContent;
}

// Function to populate a list with items including title and URL
function populateArticleHistoryList(listId, items) {
  const list = document.getElementById(listId);
  list.innerHTML = ""; // Clear previous items

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = item.title;
    link.href = item.url;
    listItem.appendChild(link);
    list.appendChild(listItem);
  }
}

// Function to populate the searched keywords list
function populateSearchedKeywordsList(listId, items) {
  const list = document.getElementById(listId);
  list.innerHTML = ""; // Clear previous items

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item.text;
    list.appendChild(listItem);
  });
}
