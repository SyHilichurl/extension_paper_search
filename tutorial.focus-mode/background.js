// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

const extensions = "https://developer.chrome.com/docs/extensions";
const webstore = "https://developer.chrome.com/docs/webstore";
const arxiv = "https://arxiv.org";

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(arxiv)) {
    // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === "ON" ? "OFF" : "ON";

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });

    if (nextState === "ON") {
      // Insert the CSS file when the user turns the extension on
      await chrome.scripting.insertCSS({
        files: ["focus-mode.css", "search-bar-sticky.css"],
        target: { tabId: tab.id },
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["libs/tailwindcss_3.3.3.js", "add-info.js"],
        // files: ["hide-history.js"],
      });

      chrome.runtime.onMessage.addListener((message) => {
        // user clicked on a keyword from the sidepanel
        // this function should replace the current search input with the selected input
        if (message.chosen_keyword) {
          console.log("chosen_keyword", message.chosen_keyword);
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (chosen_keyword) => {
              // replace the current search input with the selected input
              const searchInput = document.querySelector("input#query");
              searchInput.value = chosen_keyword;
              // scroll to search input
              searchInput.scrollIntoView({ behavior: "smooth" });
            },
            args: [message.chosen_keyword],
          });
        }
      });

      chrome.runtime.onMessage.addListener((request, sendResponse) => {
        if (request.action === "clearKeywords") {
          // Clear the "selected_keywords" data from local storage
          chrome.storage.local.remove("selected_keywords", () => {
            console.log("Selected keywords cleared.");
            sendResponse({ cleared: true });
          });
        }
      });
    } else if (nextState === "OFF") {
      // Remove the CSS file when the user turns the extension off
      await chrome.scripting.removeCSS({
        files: ["focus-mode.css"],
        target: { tabId: tab.id },
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        // files: ["remove-info.js"],
        files: ["hide-history.js"],
      });
    }
  }
});
