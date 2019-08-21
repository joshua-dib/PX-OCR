
// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
// var url = 'https://ks1912.scem.westernsydney.edu.au/Nyangumarta Dictionary Wordlists Cover 2008 Bookmarked Burgman.pdf';
var url = 'https://ks1912.scem.westernsydney.edu.au/level_0_dictionary.pdf';

// The workerSrc property shall be specified.
pdfjsLib.workerSrc = 'https://ks1912.scem.westernsydney.edu.au/pdf.worker.js';

pdfjsLib.getDocument(url).then(function (pdf) {
    var pdfDocument = pdf;
    var pagesPromises = [];

    // for (var i = 0; i < pdf.pdfInfo.numPages; i++) {
    for (var i = 0; i < pdf.numPages; i++) {
        // Required to prevent that i is always the total of pages
        (function (pageNumber) {
            // textAndXCoordinate.concat(getTextCoordinate(pageNumber, pdfDocument))
            getTextCoordinate(pageNumber, pdfDocument);
        })(i + 1);
    }

    		// Remove loading
        document.getElementById("loading-info").innerHTML = " ";

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

// organise the text retrieved from getTextContent()
// use the x-coordiates(textContent.items.transform[4])
// of textContent.items to identify keywords and related text to it
function getTextCoordinate(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the content of the page is retrieven
    // fill the table located in the html page
    // fills keywords and related text
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                var textItems = textContent.items;

                //get the lowest X coordinate in the page
                //which determines which words are keywords and not
                var lowest_X_coordinate = textItems[0].transform[4];
                for (var i = 0; i < textItems.length; i++)
                {
                    var item = textItems[i];
                    if (item.transform[4] < lowest_X_coordinate)
                    {
                      lowest_X_coordinate = item.transform[4];
                    }
                }
                //prints lowest_X_coordinate to the console
                console.log("lowest x-coordinate = " + lowest_X_coordinate);

                //access the table in the html file
                var table = document.getElementById("table");
                var row, keyword, relatedText;

                // determines whether a word is a keyword
                // by using the x-coordiate of each textContent.items.str
                for (var i = 0; i < textItems.length; i++)
                {
                  // if x coordinate of the word is equal to
                  // the lowest x-coordinate in the page then
                  // it is a keyword
                  if (textItems[i].transform[4] == lowest_X_coordinate)
                  {
                    row = table.insertRow(table.rows.length);
                    keyword = row.insertCell(0);
                    relatedText = row.insertCell(1);
                    //retrives the string part of the object
                    keyword.innerHTML = textItems[i].str;
                  }
                  // then the rest of the strings are placed
                  // in the relatedText cell
                  // until the next keyword
                  // which will have a lowest x-coordinate
                  else
                  {
                    relatedText.innerHTML += " " + textItems[i].str;
                  }
                }

                // end promise
                resolve();
            });
        });
    });
}
