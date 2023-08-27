console.log("Adding info");

let OPENAI_API_KEY = "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";

function getArticles() {
  const articles = [...document.querySelectorAll("li.arxiv-result")].map(
    (article) => {
      const title = article.querySelector("p.title.is-5.mathjax").innerText;
      const authors = article
        .querySelector("p.authors")
        .innerText.replace("\n", " ")
        .replace("Authors: ", "")
        .split(", ");

      const abstract = article
        .querySelector("span.abstract-full.has-text-grey-dark.mathjax")
        .innerText.replace("\n", " ")
        .replace("Abstract: ", "")
        .replace("△ Less", "")
        .trim();

      const submittedDateString = article
        .querySelector("p.is-size-7")
        .innerText.replace("\n", " ")
        .replace("Submitted ", "")
        .replace("originally announced", "")
        .replace(".", "")
        .split(";")[0]
        .trim();

      const submittedDate = dateStringToDataTime(submittedDateString);

      //  23 July, 2021
      function dateStringToDataTime(dateString) {
        const [month, day, year] = dateString
          .split(" ")
          .map((item) => item.replace(",", ""));
        return new Date(`${year}-${month}-${day}`);
      }

      const articleLink = article.querySelector(
        "div.is-marginless p.list-title a"
      ).href;

      const pdfLink = article.querySelector(
        "div.is-marginless p.list-title span a"
      ).href;

      return {
        title,
        authors,
        abstract,
        submittedDate,
        articleLink,
        pdfLink,
        domReference: article,
      };
    }
  );
  return articles;
}

function getUserSearchKeywords() {
  // const queryString = window.location.search;
  // const urlParams = new URLSearchParams(queryString);
  // const userSearchKeyWords = urlParams.get("query").replace("+", " ");
  return "";
}

/*
GPT STUFF 
*/

async function summarizeArticle(title, abstract, userSearchKeyWords) {
  const systemContext = `
  You are a helpful academic research assistant. You will try your best to summarize information of the paper for the user. 
  The input for you is the title and abstract of the paper, in this format:
  {
      title: "......",
      abstract: "......"
  }
  Your answer should strictly follow this format:
  {
      "summary": "......",
      "keywords": ["....", ....],
      "relatedTopics": ["....", ....]
  }
  `;

  function composeLLMInputData(title, abstract, userSearchKeywords) {
    return `
  {
    "title": "${title}",
    "abstract": "${abstract}",
  }
  `;
  }

  const apiKey = OPENAI_API_KEY;
  const url = "https://api.openai.com/v1/chat/completions";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const data = JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemContext },
      {
        role: "user",
        content: composeLLMInputData(title, abstract, userSearchKeyWords),
      },
    ],
    temperature: 0.7,
  });

  console.log(`Requesting Summary of ${title}.`);
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: data,
  });

  const result = await response.json();
  console.log("result", result);
  const messageContent = result.choices[0].message.content;
  console.log("messageContent", result.choices[0].message.content);
  const processedMessageContent = messageContent.replace(/[\r\n]+/gm, "");
  console.log("processedMessageContent", processedMessageContent);
  const parsedResult = JSON.parse(messageContent);
  return parsedResult;
}

async function main() {
  const articles = getArticles();
  const articleList = document.querySelector("ol.breathe-horizontal");
  const userSearchKeyWords = getUserSearchKeywords();
  console.log("All articles", articles);
  for (let i = 0; i < 2; i++) {
    const firstArticle = articles[i];
    try {
      const firstSummary = await summarizeArticle(
        firstArticle.title,
        firstArticle.abstract,
        userSearchKeyWords
      );
      // console.log('Summary:', firstSummary);

      // const newSummary = document.createElement('p');
      // newSummary.innerHTML = `<span class="has-text-black-bis has-text-weight-semibold">Summary</span> ${firstSummary.summary}`;
      // newSummary.className = 'authors';
      // firstArticle.domReference.appendChild(newSummary);

      const newKeywords = document.createElement("li");
      // newKeywords.innerHTML = `<span class="has-text-black-bis has-text-weight-semibold">Suggested Keywords:</span> ${firstSummary.keywords.join(
      //   ", "
      // )}`;
      // newKeywords.className = "authors";
      // firstArticle.domReference.appendChild(newKeywords);
      newKeywords.className = "keywords-container";
      firstSummary.keywords.forEach((keyword) => {
        const newKeyword = document.createElement("button");
        newKeyword.textContent = keyword;
        newKeyword.className =
          "rounded-sm bg-zinc-100 hover:bg-zinc-200 px-2 py-1 m-0.5 text-sm border-2 border-black";
        newKeyword.addEventListener("click", () => {
          chrome.storage.local.get("selected_keywords").then((result) => {
            const selectedKeywords = result.selected_keywords || [];
            console.log("previous selected keywords", selectedKeywords);
            const storedKeywordIndex = selectedKeywords.findIndex(
              (storedKeyword) => storedKeyword.keyword === keyword
            );
            if (storedKeywordIndex !== -1) {
              selectedKeywords[storedKeywordIndex].count += 1;
            } else {
              selectedKeywords.push({
                keyword: keyword,
                count: 1,
                position: {
                  top: Math.floor(Math.random() * 200 + 635),
                  left: 0,
                },
                type: "leftout",
              });
            }
            chrome.storage.local.set({
              selected_keywords: [...selectedKeywords],
            });
          });
          // chrome.runtime.sendMessage({ selected_keyword: keyword });
        });
        newKeywords.appendChild(newKeyword);
      });
      // firstArticle.domReference.appendChild(newKeywords);
      if (i === articles.length - 1) {
        articleList.appendChild(newKeywords);
      } else {
        let nextArticle = articleList.children[2 * i + 1];
        articleList.insertBefore(newKeywords, nextArticle);
      }

      // const newRelativeTopics = document.createElement('p');
      // newRelativeTopics.innerHTML = `<span class="has-text-black-bis has-text-weight-semibold">Related Topics: </span> ${firstSummary.relatedTopics.join(
      //   ', '
      // )}`;
      // newRelativeTopics.className = 'authors';
      // firstArticle.domReference.appendChild(newRelativeTopics);
    } catch (e) {
      console.log("error", e);
    }
  }
}

// get the input from the user
const searchInput = document.querySelector("input#query");
// add the input to the storage
chrome.storage.local.get("searchInput", (result) => {
  const storedSearchInput = result.searchInput || "";
  storedSearchInput.push({ text: searchInput.value });
  console.log("storedSearchInput", storedSearchInput);
  // remove all duplicates
  const uniqueStoredSearchInput = storedSearchInput.filter(
    (item, index, self) => index === self.findIndex((t) => t.text === item.text)
  );
  chrome.storage.local.set({ searchInput: uniqueStoredSearchInput });
});

main();
