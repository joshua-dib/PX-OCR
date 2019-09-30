var KEYWORD;
var START_PAGE;
var END_PAGE;
var HEADER;
var FOOTER;

// The workerSrc property shall be specified.
pdfjsLib.workerSrc = 'pdfjs/build/pdf.worker.js';


document.querySelector('#form').addEventListener('submit', e => {
    e.preventDefault()

    const files = document.querySelector('#files').files
    console.log('TCL: files', files)

    Array.from(files).forEach(workWithFile)

    //get keyword
    KEYWORD = document.getElementById("form").elements.namedItem("keyword").value;
    //get startSearchPage
    START_PAGE = document.getElementById("form").elements.namedItem("startSearchPage").value;
    START_PAGE = parseInt(START_PAGE);
    //get endSearchPage
    END_PAGE = document.getElementById("form").elements.namedItem("endSearchPage").value;
    END_PAGE = parseInt(END_PAGE);

    //get sample header on a page
    HEADER = document.getElementById("form").elements.namedItem("header").value;
    //get sample footer on a page
    FOOTER = document.getElementById("form").elements.namedItem("footer").value;
})

const workWithFile = file => {
    const fileReader = new FileReader();

    fileReader.onload = function () {
        const typedarray = new Uint8Array(this.result)

        pdfjsLib.getDocument(typedarray).then(function (pdf) {
            var pdfDocument = pdf;
            var pagesPromises = [];

            //test
            var pagesContents = [];
            console.log("pdf.numPages = " + pdf.numPages);
            //end test

            // for (var i = 0; i < pdf.numPages; i++) {
            for (var i = START_PAGE; i < END_PAGE + 1; i++) {
                // Required to prevent that i is always the total of pages
                pagesContents = pagesContents.concat(getPageContent(i+1, pdfDocument));
            }

            Promise.all(pagesContents).then(function (pgContents) {
                //combine all pgsContent.items into one array which is textItems
                var textItems = [];
                textItems = textItems.concat(combinePagesToOne(pgContents));

                //test
                for (var i = 0; i < textItems.length; i++) {
                  console.log(textItems[i].str);
                }

                console.log("///////////////////////");

                var lines = [];
                lines = lines.concat(combineLineByLine(textItems));

                for (var i = 0; i < lines.length; i++) {
                  console.log(lines[i].str);
                  console.log(lines[i].str.length);
                }

                var indentationDifference;
                indentationDifference = getIndentationDifference(KEYWORD, lines);

                var xCoordinatesOfKeyword = [];
                xCoordinatesOfKeyword = xCoordinatesOfKeyword.concat(collectXCoordinate(lines, indentationDifference));

                //test
                var headerYcoords = getHeaderYcoordinate(HEADER, lines);
                if (HEADER != 'none' || HEADER != 'None' || HEADER != 'NONE') {
                  var tempLines = [];
                  tempLines = tempLines.concat(removeHeaders(lines, headerYcoords));
                  lines = [];
                  lines = lines.concat(tempLines);
                }

                var footerYcoords = getFooterYcoordinate(FOOTER, lines);
                if (FOOTER != 'none' || FOOTER != 'None' || FOOTER != 'NONE') {
                  var tempLines = [];
                  tempLines = tempLines.concat(removeFooters(lines, footerYcoords));
                  lines = [];
                  lines = lines.concat(tempLines);
                }
                //endtest

                fillTable2(lines, indentationDifference, xCoordinatesOfKeyword);

                // Remove loading
                console.log("end of program");
            });

        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });

    }
    fileReader.readAsArrayBuffer(file);
}

function combinePagesToOne(contents) {
    var items = [];
    for (var i = 0; i < contents.length; i++) {
        for (var j = 0; j < contents[i].items.length; j++) {
            items.push(contents[i].items[j]);
        }
    }
    return items;
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

function getIndentationDifference(keyword, lines) {
  var indentationDifference;

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].str.search(keyword) != -1) {
      console.log(lines[i].str + " == " + keyword);
      indentationDifference = lines[i+1].xCoordinate - lines[i].xCoordinate;

      console.log("indentationDifference = " + indentationDifference);
      indentationDifference = indentationDifference.toFixed(1); // round to 1 dec pl
      console.log("rounded indentationDifference = " + indentationDifference);

      return indentationDifference;
    }
  }
  return indentationDifference;
}

function fillTable2(lines, indentationDifference, xCoordinatesOfKeyword) {
  var table = document.getElementById("table").getElementsByTagName("tbody")[0];
  // var table = document.getElementById("table");
  var row, keyword, relatedText;
  var isOnRelatedText = false;

  for (var i = 0; i < lines.length; i++) {
    if (xCoordinatesOfKeyword.includes(lines[i].xCoordinate.toFixed(1))) {
      keyword = getKeywordFromStr(lines[i].str);
      relatedText = getRelatedTextFromStr(lines[i].str);

      initializeRow(table);
      insertKeywordToTable(table, keyword);
      insertRelatedText(table, relatedText);
      insertProcessNumber(table);
    } else {
      if (table.rows.length > 0) {
        insertRelatedText(table, lines[i].str);
      }
    }
  }

  $('#table').DataTable({
  serverside:false,
  dom: "<'row'<'col-sm-6'lB><'col-sm-6'f>>" +
  "<'row'<'col-md-12'tr>>" +
  "<'row'<'col-sm-5'i><'col-sm-7'p>>",
  buttons: [
      {
                extend: 'copyHtml5',
                exportOptions: {
                    columns: ':visible'
                }
            },
            {
                extend: 'csvHtml5',
                exportOptions: {
                    columns: ':visible'
                }
            },
            {
                extend: 'pdfHtml5',
                exportOptions: {
                    columns: ':visible'
                }
            },
      {
                extend: 'print',
                exportOptions: {
                    columns: ':visible'
                }
            },
            'colvis'
        ]
  });
  document.getElementById("table").style.visibility = "visible";
}

function collectXCoordinate(lines, indentationDifference) {
  var xCoords = [];
  var notKeywordsXcoords = [];

  for (var i = 0; i < lines.length; i++) {
    if (isKeyword(i, lines, indentationDifference)) {
        if (!xCoords.includes(lines[i].xCoordinate.toFixed(1))) {
          xCoords.push(lines[i].xCoordinate.toFixed(1));
          console.log("keyword with indented line = " + lines[i].str + lines[i+1].str);
          console.log(lines[i].str + " = " + lines[i].yCoordinate);
          console.log(lines[i+1].str + " = " + lines[i+1].yCoordinate);
        }
      }
  }

  console.log("xCoords");
  for (var i = 0; i < xCoords.length; i++) {
    console.log(xCoords[i]);
  }

  return xCoords;
}

function isRelatedText(index, lines, indentDifference) {
  var lineAbove = index - 1;
  var tempDifference;

  while (isInRange(lineAbove, lines)) {
    tempDifference = lines[index].xCoordinate - lines[lineAbove].xCoordinate;
    tempDifference = tempDifference.toFixed(1);
    if (tempDifference == indentDifference) {
      return true;
    }
    lineAbove--;
  }
  return false;
}

function getHeaderYcoordinate(header, lines) {
  var headerYcoords;

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].str.search(header) != -1) {
      headerYcoords = lines[i].yCoordinate;
      break;
    } else {
      headerYcoords = -1;
    }
  }
  console.log("headerYcoords = " + headerYcoords);
  return headerYcoords;
}

function getFooterYcoordinate(footer, lines) {
  var footerYcoords;

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].str.search(footer) != -1) {
      footerYcoords = lines[i].yCoordinate;
      break;
    } else {
      footerYcoords = -1;
    }
  }
  console.log("footerYcoords = " + footerYcoords);
  return footerYcoords;
}

function removeHeaders(lines, yCoords) {
  var linesWithoutHeaders = [];

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].yCoordinate >= yCoords) {
      console.log("removed header: " + lines[i].str);
      lines.splice(i, 1);
    }
  }
  linesWithoutHeaders = linesWithoutHeaders.concat(lines);

  return linesWithoutHeaders;
}

function removeFooters(lines, yCoords) {
  var linesWithoutFooters = [];

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].yCoordinate <= yCoords) {
      console.log("removed footer: " + lines[i].str);
      lines.splice(i, 1);
    }
  }
  linesWithoutFooters = linesWithoutFooters.concat(lines);

  return linesWithoutFooters
}

function isIndented(lineAbove, lineCurrent, lines) {
  if (isInRange(lineAbove, lines)) {
    if (lines[lineCurrent].xCoordinate > lines[lineAbove].xCoordinate) {
      return true;
    } else {
      false;
    }
  } else {
    return false;
  }
}

function isInRange(index, array) {
  if (index < 0 || index >= array.length) {
    return false;
  } else {
    return true;
  }
}

function getKeywordFromStr(str) {
  var keyword = '';
  var i = 0;

  do {
    keyword += str[i];
    i++;
  } while (i < str.length && !isSpace(str[i]));

  return keyword;
}

function getRelatedTextFromStr(str) {
  var relatedText = '';
  var i = 0;

  while (i < str.length && !isSpace(str[i])) {
    i++;
  }
  while (i < str.length) {
    relatedText += str[i];
    i++
  }

  return relatedText;
}

function initializeRow(table) {
  var row, keyword, relatedText, processNumber;

  row = table.insertRow(table.rows.length);
  keyword = row.insertCell(0);
  relatedText = row.insertCell(1);
  processNumber = row.insertCell(2);

}

function insertKeywordToTable(table, word) {
    var relatedText;
    table.rows[table.rows.length - 1].cells[0].innerHTML += word;
}

function insertRelatedText(table, word) {
    var relatedText;
    table.rows[table.rows.length - 1].cells[1].innerHTML += word + "<br>";
}

function insertProcessNumber(table) {
  var processNumber = table.rows.length - 1;
  table.rows[table.rows.length - 1].cells[2].innerHTML += processNumber;
}

function isKeyword(index, lines, indentDifference) {
    var tempDifference;
    var i = index + 1;
    var lineBelow = index + 1;
    var lineAbove = index - 1;

    if (isInRange(lineBelow, lines)) {
      testIsKeyword(index, lineBelow, lines);

      tempDifference = lines[lineBelow].xCoordinate - lines[index].xCoordinate;
      tempDifference = tempDifference.toFixed(1);
      if (indentDifference == tempDifference) {
        //test
        // if (isInRange(lineAbove, lines)) {
        //   tempDifference = lines[index].xCoordinate - lines[lineAbove].xCoordinate;
        //   tempDifference = tempDifference.toFixed(1);
        //   if (tempDifference == indentDifference) {
        //     return false;
        //   }
        // }
        if (isRelatedText(index, lines, indentDifference)) {
          return false;
        }
        //end test
        return true;
      }
    }
    return false;
}

function testIsKeyword(index1, index2, items) {
    console.log(items[index1].str + "/" + items[index2].str);
    console.log(items[index1].xCoordinate + "/x/" + items[index2].xCoordinate);
    console.log(items[index1].yCoordinate + "/y/" + items[index2].yCoordinate);
    console.log("xDiff = " + (items[index2].xCoordinate - items[index1].xCoordinate));
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
    var yCoords1 = item1.transform[5];
    var yCoords2 = item2.transform[5];

    yCoords1 = yCoords1.toFixed(3);
    yCoords2 = yCoords2.toFixed(3);

    if (yCoords1 != yCoords2) {
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

function Line(str, xCoordinate, yCoordinate) {
  this.str = str;
  this.xCoordinate = xCoordinate;
  this.yCoordinate = yCoordinate;

  this.addToString = function(str) {
    this.str += str;
  };
}

function combineLineByLine(items) {
  var lines = [];
  var tempString = '';
  var xCoords, yCoords;

  for (var i = 0; i < items.length; i++)
  {
    if (!isSpace(items[i].str)) {
      tempString = items[i].str;
      xCoords = items[i].transform[4];
      yCoords = items[i].transform[5];

      while (((i+1) < items.length) && isOnSameLine(items[i],items[i+1])) {
        // console.log("test2");
        tempString += items[i+1].str;
        i++;
      }

      if (i > items.length) {
        break;
      }

      lines.push(new Line(tempString, xCoords, yCoords));
    }
  }

  return lines;
}
