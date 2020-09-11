const config = {
  defaultQuizDifficulty: "hard",
  defaultNumOfReturnedQuestions: 10,
  apiKey: "18198489-88893dd6b37a22d1974117646",
  defaultNumOfReturnedResults: 3,
};

let quizObj;

// random numbers generator
const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 9: General Knowledge
// 10: Entertainment: Books
// 11: Entertainment: Film
// 12: Entertainment: Music
// 13: Entertainment: Musicals & Theatres
// 14: Entertainment: Television
// 15: Entertainment: Video Games
// 16: Entertainment: Board Games
// 17: Science & Nature
// 18: Science: Computers
// 19: Science: Mathematics
// 20: Mythology
// 21: Sports
// 22: Geography
// 23: History
// 24: Politics
// 25: Art
// 26: Celebrities
// 27: Animals
// 28: Vehicles
// 29: Entertainment: Comics
// 30: Science: Gadgets
// 31: Entertainment: Japanese Anime & Manga
// 32: Entertainment: Cartoon & Animations

// fetch Quiz API data
const getQuizData = async (numOfQuestions, difficulty) => {
  difficulty = difficulty || config.defaultQuizDifficulty;
  numOfQuestions = numOfQuestions || 10;
  const quizAPI = `https://opentdb.com/api.php?amount=${numOfQuestions}&category=11&difficulty=${difficulty}&type=multiple`;
  let response = await fetch(quizAPI);
  return await response.json();
};

// fetch images for quiz auestions
const getImageData = async (imgSubject, numOfImg) => {
  numOfImg = numOfImg || config.defaultNumofReturnedResults;
  const searchStr = imgSubject.replace(/[^\w\s]/gi, "").replace(" ", "+");
  const imgAPI = `https://pixabay.com/api/?key=${config.apiKey}&q=${searchStr}?&image_type=photo&orientation=horizontal&per_page=${numOfImg}`;
  let response = await fetch(imgAPI);
  return await response.json();
};

////////////////////////////////////////////////////////
// dynamic HTML content generators
////////////////////////////////////////////////////////
const genHTMLQuestionLayout = (QuizDataItem, index) => {
  let htmlResult = "";
  htmlResult += `<div class="carousel-item">
      <img class="d-block w-100" src="${QuizDataItem.imgURL}" alt="${index} slide" />
      <div class="d-md-block mb-4">
      <div class="mx-auto"><h5 class="m-4">${QuizDataItem.question}</h5></div>
        <div class="list-group">
            ${genHTMLAnswersLayout(QuizDataItem.answers_list.list)}
        </div>
      </div>
    </div>
  </div>`;
  return htmlResult;
};

const genHTMLAnswersLayout = ansObj => {
  if (!ansObj || ansObj.length < 1) return "";
  let htmlResult = "";
  ansObj.forEach((item, index) => {
    //htmlResult += `<a href="#" class="list-group-item list-group-item-action">${item}</a>`;
    htmlResult += `<button type="button" class="list-group-item list-group-item-action" data-answer-index="${index}">${item}</button>`;
  });
  return htmlResult;
};

const genHTMLCarouselIndicator = index => {
  return `<li data-target="#quizEnumerator" data-slide-to="${index}"></li>`;
};

////////////////////////////////////////////////////////
// update web elements
////////////////////////////////////////////////////////
const updateCarouselImage = (dataItem, index) => {
  document
    .querySelector(".carousel-inner")
    .insertAdjacentHTML("beforeend", genHTMLQuestionLayout(dataItem, index));
};

const updateCarouselIndicator = index => {
  let htmlResult = "";
  for (let i = 0; i < index; i++) {
    htmlResult += genHTMLCarouselIndicator(i);
  }
  document.querySelector(".carousel-indicators").insertAdjacentHTML("beforeend", htmlResult);
};

const updateCarouselDisplay = () => {
  updateCarouselIndicator(quizObj.results.length);
  //$(".carousel-item").first().addClass("active");
  document.querySelector(".carousel-item:first-child").classList.add("active");
  //$(".carousel-indicators > li").first().addClass("active");
  document.querySelector(".carousel-indicators > li:first-child").classList.add("active");
  $("#quizEnumerator").carousel();

  document.querySelectorAll("button[type='button']").forEach(function (item) {
    item.addEventListener("click", function (e) {
      btnAction(e);
    });
  });
};

////////////////////////////////////////////////////////
// event listeners
////////////////////////////////////////////////////////
$("#quizEnumerator").on("slide.bs.carousel", function (e) {
  if (e.from === quizObj.results.length - 1 && e.to === 0) {
    e.preventDefault();

    const userMark = quizObj.results
      .map(x => x.userIsCorrect)
      .reduce((acc, curr) => {
        if (typeof acc[curr] == "undefined") {
          acc[curr] = 1;
        } else {
          acc[curr] += 1;
        }
        return acc;
      }, {}).true;

    //console.log(userMark);
    $("#quizEnumerator").hide();
    $(".card").show();
    $(".card").addClass("m-3");
    document.querySelector("h4.card-title").innerHTML =
      userMark >= 5 ? "You Nailed it!!" : "Next time you gonna make it...";
    document.querySelector(
      "p.card-text"
    ).innerHTML = `Your score is ${userMark} out of ${quizObj.results.length} questions`;
  }
});

const btnAction = e => {
  updateUserAnswerSelection(e.target.dataset.answerIndex);
  e.target.classList.add("active");
  $("#quizEnumerator").carousel("next");
};

////////////////////////////////////////////////////////
// App logic
////////////////////////////////////////////////////////
const updateUserAnswerSelection = userAnsweredIndex => {
  const currQuestion = parseInt(document.querySelector("#quizEnumerator .active").dataset.slideTo);
  const currAnswer = parseInt(userAnsweredIndex);
  if (!isNaN(currQuestion) && !isNaN(currAnswer)) {
    quizObj.results[currQuestion].userAnsweredIndex = currAnswer;
    quizObj.results[currQuestion].userIsCorrect =
      quizObj.results[currQuestion].answers_list.correct_answer_index === currAnswer;
  }
};

const updateImgOnDataSet = async (resultItem, imgResults) => {
  if (imgResults.total > 0) {
    // API returend relevent images
    resultItem.imgURL = imgResults.hits[0].webformatURL;
  } else {
    const getMuchMoreResults = Math.pow(
      config.defaultNumOfReturnedResults,
      config.defaultNumOfReturnedResults
    );
    // No relevant images returned by the API
    await getImageData(quizObj.results[0].category, getMuchMoreResults).then(imgResults => {
      if (imgResults.total > 0) {
        resultItem.imgURL = imgResults.hits[getRndInteger(0, getMuchMoreResults - 1)].webformatURL;
      } else {
        console.log("2: "); //+ answerslist);
      }
    });
  }
};

const buildAnsersList = (correctAnswer, incorrectAnswers) => {
  let resultArr = Array.from(incorrectAnswers);
  const rndcorrectAnswerIndex = getRndInteger(0, incorrectAnswers.length); // no need to add one...
  resultArr.splice(rndcorrectAnswerIndex, 0, correctAnswer);
  return {
    list: resultArr,
    correct_answer_index: rndcorrectAnswerIndex,
  };
};

////////////////////////////////////////////////////////
// init app
////////////////////////////////////////////////////////
getQuizData().then(data => {
  quizObj = data;
  quizObj.results.forEach((resultItem, index) => {
    resultItem.answers_list = buildAnsersList(
      resultItem.correct_answer,
      resultItem.incorrect_answers
    );
    const rndPictureAnswer =
      resultItem.answers_list.list[getRndInteger(0, resultItem.answers_list.list.length - 1)];
    getImageData(rndPictureAnswer).then(imgResults => {
      updateImgOnDataSet(resultItem, imgResults).then(() => {
        updateCarouselImage(resultItem, index);
      });
    });
  });
  setTimeout(() => {
    updateCarouselDisplay();
  }, 1000);
});
