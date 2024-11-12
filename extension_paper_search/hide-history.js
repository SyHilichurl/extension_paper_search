console.log("Hiding History");

// Add listeners to each search result item
function addListenersToSearchResults() {
  // console.log("Adding listeners to search results");
  const searchResults = [
    ...document.querySelectorAll("p.list-title.is-inline-block"),
  ];
  // console.log("searchResults", searchResults);
  searchResults.forEach((searchResult) => {
    searchResult.addEventListener("click", onMouseEnter);
    searchResult.addEventListener("contextmenu", onMouseEnter);
    // searchResult.addEventListener("mouseleave", onMouseLeave);
  });
}

// Handle mouse enter event
function onMouseEnter(event) {
  // clear storage history
  // chrome.storage.local.set({ history: [] });

  const onClickedTitle = event.target.textContent;
  const listItem = findListItemByTitle(onClickedTitle);

  listItem.classList.add("is-active");
  const title = listItem.querySelector("p.title.is-5.mathjax").innerText;
  const url = listItem.querySelector("div.is-marginless p.list-title a").href;
  // Add title to history
  chrome.storage.local.get("history", (result) => {
    const history = result.history || [];
    const isTitleInHistory = history.some(
      (history) => history.id === onClickedTitle
    );
    if (!isTitleInHistory) {
      history.push({ id: onClickedTitle, title: title, url: url });
      chrome.storage.local.set({ history });
      console.log("history", history);
    }
  });
}

// Map the title to the list item
function findListItemByTitle(title) {
  const listItems = document.querySelectorAll("li.arxiv-result");
  for (const listItem of listItems) {
    if (listItem.textContent.includes(title)) {
      return listItem;
    }
  }
}

// Add class to the list item
function addClassToSearchResultItem() {
  chrome.storage.local.get("history", (result) => {
    const history = result.history || [];

    // Iterate through history
    for (const his of history) {
      const listItem = findListItemByTitle(his.id);
      if (listItem) {
        listItem.classList.add("is-active");
      }
    }
  });
}

async function main() {
  try {
    addListenersToSearchResults();
    addClassToSearchResultItem();
  } catch (e) {
    console.log("error", e);
  }
}

main();
