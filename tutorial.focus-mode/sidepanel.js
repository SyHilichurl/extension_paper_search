// sidebar.js
const displayedKeywords = new Set();

// const mydragstart = (ev) => {
//   ev.dataTransfer.setData("text/plain", ev.target.id);
// };

// const mydragover = (ev) => {
//   ev.preventDefault();
// };

// const mydrop = (ev) => {
//   if (ev.dataTransfer !== null) {
//     const data = ev.dataTransfer.getData("text/plain");
//     document.getElementById(data).remove();
//   }
// };

// const addDropZoneListeners = () => {
//   const dropZone = document.getElementById("drop-zone");
//   dropZone.addEventListener("ondrop", mydrop);
//   dropZone.addEventListener("ondragover", mydragover);
// };

chrome.runtime.onMessage.addListener((message) => {
  if (message.selected_keyword) {
    const keyword = message.selected_keyword;

    // Check if the keyword has been displayed before based on its text content
    if (!displayedKeywords.has(keyword)) {
      displayedKeywords.add(keyword);

      const selectedKeywords = document.getElementById("selected-keyword");
      const newSelectedKeyword = document.createElement("button");
      newSelectedKeyword.textContent = keyword;
      newSelectedKeyword.className = "selected-keyword-button-in-sidepanel";
      newSelectedKeyword.id = keyword;
      newSelectedKeyword.addEventListener("click", () => {
        chrome.runtime.sendMessage({ chosen_keyword: keyword });
      });

      //   newSelectedKeyword.draggable = true;
      //   newSelectedKeyword.addEventListener("ondragstart", mydragstart);
      selectedKeywords.appendChild(newSelectedKeyword);
    }
  }
});
// document.addEventListener("DOMContentLoaded", () => {
//   addDropZoneListeners();
// });
