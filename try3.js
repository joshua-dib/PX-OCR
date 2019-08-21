
// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
// var url = 'https://ks1912.scem.westernsydney.edu.au/Nyangumarta Dictionary Wordlists Cover 2008 Bookmarked Burgman.pdf';
var url = 'https://ks1912.scem.westernsydney.edu.au/Wirangu - English Dictionary.pdf';
// var url = 'https://ks1912.scem.westernsydney.edu.au/level_0_dictionary.pdf';

// The workerSrc property shall be specified.
pdfjsLib.workerSrc = 'https://ks1912.scem.westernsydney.edu.au/pdf.worker.js';

pdfjsLib.getDocument(url).then(function (pdf) {
    var pdfDocument = pdf;
    var pagesPromises = [];

    //test
    var pagesContents = [];
    console.log("pdf.numPages = " + pdf.numPages);
    //end test

    for (var i = 0; i < pdf.numPages; i++) {
        // Required to prevent that i is always the total of pages
        (function (pageNumber) {
            // getTextCoordinate(pageNumber, pdfDocument);

            //test
            pagesContents = pagesContents.concat(getPageContent(pageNumber, pdfDocument));
            //end test
        })(i + 1);
    }

    Promise.all(pagesContents).then(function (pgsContent) {
        //test
        console.log("pgsContents.length = " + pgsContent.length);

        //combine all pgsContent.items into one array which is textItems
        var textItems = [];
        for (var i = 0; i < pgsContent.length; i++) {
          for (var j = 0; j < pgsContent[i].items.length; j++) {
            textItems.push(pgsContent[i].items[j]);
          }
        }

        //input from user
        var keyword = "abubaldha";
        var indentationDifference;
        indentationDifference = getIndentationDifference(textItems, keyword);
        //end calibrate

        //test
        for (var i = 0; i < 1; i++) {
          for (var j = 0; j < pgsContent[i].items.length; j++) {
            console.log("str = " + pgsContent[i].items[j].str + ": len = " + pgsContent[i].items[j].str.length);
            // console.log("str.length  = " + pgsContent[i].items[j].str.length);
            // console.log("xcoords = " + pgsContent[i].items[j].transform[4]);
            // console.log("ycoords = " + pgsContent[i].items[j].transform[5]);
          }
        }
        console.log("current page length = " + pgsContent[0].items.length);
        console.log("current page length = " + pgsContent[1].items.length);
        //endtest

        //fill up the table
        fillTable(textItems, indentationDifference);

        //endtest

        // Remove loading
        // $("#loading-info").remove();
        document.getElementById("loading-info").innerHTML = " ";
        console.log("end of program");
    });

}, function (reason) {
    // PDF loading error
    console.error(reason);
});


/**
 * Retrieves the text of a specif page within a PDF Document obtained through pdf.js
 *
 * @param {Integer} pageNum Specifies the number of the page
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained
 **/
function getPageText(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the text of the page is retrieven
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                var textItems = textContent.items;
                var finalString = "";

                // Concatenate the string of the item to the final string
                for (var i = 0; i < textItems.length; i++) {
                    var item = textItems[i];

                    finalString += item.str + " ";
                }

                // Solve promise with the text retrieven from the page
                resolve(finalString);
            });
        });
    });
}

function getPageContent(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the content of the page is retrieven
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                resolve(textContent)
            });
        });
    });
}

function getIndentationDifference(textItems, keyword) {
  var indentationDifference;
  //calibrate universal indentation across all textItems
  var keyword_X_Coordinate;
  var keyword_Y_Coordinate;
  var relatedText_X_Coordinate;
  var relatedText_Y_Coordinate;

  keyword = removeWhiteSpace(keyword);
  keyword = removeNewLine(keyword);
  console.log("keyword = " + keyword);

  //search for keyword in textItems
  var currentString = '';
  var tempString = '';
  for (var i = 0; i < textItems.length; i++) {
    currentString = textItems[i].str;
    currentString = removeWhiteSpace(currentString);
    currentString = removeNewLine(currentString);

    if (keyword == currentString) {
      //set x-coordinate of keyword
      keyword_X_Coordinate = textItems[i].transform[4];
      keyword_Y_Coordinate = textItems[i].transform[5];

      //search for the related text
      for (var j = (i + 1); j < textItems.length; j++) {
        if (keyword_Y_Coordinate != textItems[j].transform[5]) {
          tempString = textItems[j].str; //related text to keyword
          tempString = removeWhiteSpace(tempString);
          tempString = removeNewLine(tempString);

          if (tempString.length > 0) {
            relatedText_X_Coordinate = textItems[j].transform[4];

            //exit for loops
            i = textItems.length;
            j = textItems.length;
          }
        }
      }
    }
  }

  //test
  console.log("keyword = " + keyword);
  console.log("keyword_X_Coordinate = " + keyword_X_Coordinate);
  console.log("relatedText = " + tempString);
  console.log("relatedText_X_Coordinate = " + relatedText_X_Coordinate);
  //calculate different between xCoords of keyword and relatedText
  indentationDifference = relatedText_X_Coordinate - keyword_X_Coordinate;

  // important, round to 1 dec place
  indentationDifference = indentationDifference.toFixed(1); //round to one dec place


  console.log("indentationDifference = " + indentationDifference);

  return indentationDifference
}

function fillTable(items, indentDifference) {
  //access the table in the html file
  var table = document.getElementById("table");
  var row, keyword, relatedText;
  var currIndentDiff;

  for (var i = 0; i < items.length; i++)
  // for (var i = 0; i < 767; i++)//test
  {
    if (isKeyword(i, items, indentDifference))
    {
      insertKeywordToTable(table, items[i].str);
      i++; //move to next word
      while (!isKeyword(i, items, indentDifference)) {
        insertRelatedText(table, items[i].str);
        i++;
        if (!isWithinBoundary(i, items)) {
          break;
        }
      }
      i--; //move back since this word is a keyword
    }
  }
}

function insertKeywordToTable(table, word) {
  var row, keyword ,relatedText;

  row = table.insertRow(table.rows.length);
  keyword = row.insertCell(0);
  relatedText = row.insertCell(1);

  keyword.innerHTML = word;
  relatedText.innerHTML = " ";
}

function insertRelatedText(table, word) {
  var relatedText;
  table.rows[table.rows.length - 1].cells[1].innerHTML += word + " ";
}

function isKeyword(index, items, indentDifference) {
  var tempDifference;
  var i = index + 1;

  if (!isSpace(items[index].str)) {
    while (isOnSameLine(items[index], items[i])) {
      i++;
      if (!isWithinBoundary(i, items)) {
        return false;
      }
    }
    while (isSpace(items[i].str)) { //assumption: all indented lines does not start with a space
      i++;
    }
    //get difference in x-coordinates
    tempDifference = items[i].transform[4] - items[index].transform[4];
    tempDifference = tempDifference.toFixed(1); // round to 1 dec place
    //compare to globalIndentation
    if (tempDifference != indentDifference) {
      //test
      console.log(items[index].str + "/" + items[i].str);
      console.log(items[index].transform[4] + "/x/" + items[i].transform[4]);
      console.log(items[index].transform[5] + "/y/" + items[i].transform[5]);
      console.log("xDiff = " + tempDifference);
      //endtest
      return false;
    } else {
      //test
      console.log(items[index].str + "/" + items[i].str);
      console.log(items[index].transform[4] + "/x/" + items[i].transform[4]);
      console.log(items[index].transform[5] + "/y/" + items[i].transform[5]);
      console.log("xDiff = " + tempDifference);
      //endtest
      return true;
    }

  } else {
    return false;
  }
}

function isWithinBoundary(index, items) {
  if (index >= items.length) {
    return false;
  } else {
    return true;
  }
}

function isSpace(str) {
  if (str.length > 1) {
    return false;
  } else {
    if (!/\s/.test(str)) {
      return false;
    } else {
      return true;
    }
  }
}

function isOnSameLine(item1, item2) {
  //compare y-coordinates of two words
  if (item1.transform[5] != item2.transform[5]) {
    return false;
  } else {
    return true;
  }
}

function removeWhiteSpace(str) {
  var str = str.replace(/\s+|/g, '');
  return str;
}

function removeNewLine(str) {
  var str = str.replace(/\n|\r/g, "");
  return str;
}
