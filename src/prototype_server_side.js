var KEYWORD;
var START_PAGE;
var END_PAGE;
var HEADER;
var FOOTER;
var isValid;
var fileAttached;
var pSpeech = ["pronoun", "noun", "adjective", "adverb","intransitive verb", "transitive verb","ending","verb", "preposition", "conjuction", "interjection", "article",
	"cli.", "v.", "n.", "inst.", "adv.", "adj."
];
var HEADER_FOOTER_TOLERANCE = 3.0;
var KEYWORD_COORDINATES = [];
var KEYWORD_COORDINATES_COUNT = [];

// The workerSrc property shall be specified.
pdfjsLib.workerSrc = 'pdfjs/build/pdf.worker.js';

document.getElementById("save").addEventListener("click", saveTable);
function saveTable() {
  var table = document.getElementById("table");
	
  if (table.rows.length <= 1) {
    alert("Table is empty.");
  } else {
    if (typeof(Storage) !== "undefined") {
      console.log("localStorage/sessionStorage support..");

      var arrayTable = [];
      var currentRow = [];
      var stringifyTable;

      //This for loop starts with index 1
      for (var i = 2; i < table.rows.length; i++) {
        for (var j = 0; j < table.rows[i].cells.length; j++) {
          currentRow.push(table.rows[i].cells[j].innerHTML);
        }
        arrayTable.push(currentRow);
        currentRow = [];
      }

      //JSON version
      stringifyTable = JSON.stringify(arrayTable);
      localStorage.setItem("table", stringifyTable);

      // //individual keys for each row
      // for (var i = 0; i < arrayTable.length; i++) {
      //   stringifyTable = JSON.stringify(arrayTable[i]);
      //   localStorage.setItem(stringifyTable, stringifyTable);
      // }

      // // not JSON version
      // localStorage.setItem("table", arrayTable);
    } else {
      console.log("No Web Storage support..");
    }
  }
}

document.getElementById("retrieve").addEventListener("click", retrieveTable);
function retrieveTable() {
	
	$('#table').DataTable().clear();
	$('#table').DataTable().destroy();
  var values = [];
  var keys = Object.keys(localStorage);
  var i = keys.length;
  if (i == 0) {
    alert("Local storage is empty");
  } else {
    if (typeof(Storage) !== "undefined") {
      console.log("localStorage/sessionStorage support..");

      var parsedArray = JSON.parse(localStorage.getItem("table"))
      console.log(parsedArray);

      var table = document.getElementById("table").getElementsByTagName("tbody")[0];

      for (var i = 0; i < parsedArray.length; i++) {
        initializeRow(table);
        insertKeywordToTable(table, parsedArray[i][1]);
		insertRelatedText(table, parsedArray[i][3]);
		insertPartOfSpeech(table, parsedArray[i][2])
        insertProcessNumber(table);

      }
	  document.getElementById("tableWrapper").style.visibility = "visible";
	  document.getElementById("save").disabled=false;
    } else {
      console.log("No Web Storage support..");
    }
  }
  intialiseDatatables();
}

document.querySelector('#form').addEventListener('submit', e => {
	e.preventDefault()

	const files = document.querySelector('#files').files
	console.log('TCL: files', files)
	fileAttached=document.getElementById('files').value

	//get keyword
	KEYWORD = document.getElementById("form").elements.namedItem("keyword").value;
	//get startSearchPage
	START_PAGE = document.getElementById("form").elements.namedItem("startSearchPage").value;
	START_PAGE = parseInt(START_PAGE)-1;
	//get endSearchPage
	END_PAGE = document.getElementById("form").elements.namedItem("endSearchPage").value;
	END_PAGE = parseInt(END_PAGE)-1;

	if (formValidate()) {
		Array.from(files).forEach(workWithFile)
	}
	//     //get sample header on a page
	//     HEADER = document.getElementById("form").elements.namedItem("header").value;
	//     //get sample footer on a page
	//     FOOTER = document.getElementById("form").elements.namedItem("footer").value;
})

function formValidate(){
	console.log(START_PAGE)
	isValid=true;
	if(fileAttached==0){
		document.getElementById('files').classList.add("is-invalid");
		isValid= false;
	}
	else{
		document.getElementById('files').classList.remove("is-invalid");
	}
	if(isNaN(START_PAGE)){
		document.getElementById('startSearchPage').classList.add("is-invalid");
		isValid= false;
	}
	else{
		document.getElementById('startSearchPage').classList.remove("is-invalid");
	}
	if(isNaN(START_PAGE)){
		document.getElementById('endSearchPage').classList.add("is-invalid");
		isValid= false;
	}
	else{
		document.getElementById('endSearchPage').classList.remove("is-invalid");
	}
	if(KEYWORD==0){
		document.getElementById('keyword').classList.add("is-invalid");
		isValid= false;
	}
	else{
		document.getElementById('keyword').classList.remove("is-invalid");
	}
	return isValid;
}


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
				pagesContents = pagesContents.concat(getPageContent(i + 1, pdfDocument));
			}

			Promise.all(pagesContents).then(function (pgContents) {
				HEADER = document.getElementById("header");
				FOOTER = document.getElementById("footer");
				var tempLines = [];

				if (HEADER.checked == true) {
					// if (HEADER != 'none' && HEADER != 'None' && HEADER != 'NONE') {
					tempLines = tempLines.concat(removeHeaders2(pgContents));
					pgContents = [];
					pgContents = pgContents.concat(tempLines);

					tempLines = [];
				}

				if (FOOTER.checked == true) {
					// if (FOOTER != 'none' && FOOTER != 'None' && FOOTER != 'NONE') {
					tempLines = tempLines.concat(removeFooters2(pgContents));
					pgContents = [];
					pgContents = pgContents.concat(tempLines);

					tempLines = [];
				}

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

function removeHeaders2(contents) {
	var items = [];
	var headerYcoords;

	for (var i = 0; i < contents.length; i++) {
		headerYcoords = contents[i].items[0].transform[5];
		for (var j = 0; j < contents[i].items.length; j++) {
			if (headerYcoords < contents[i].items[j].transform[5]) {
				headerYcoords = contents[i].items[j].transform[5];
			}
		}

		for (var j = 0; j < contents[i].items.length; j++) {
			if ((headerYcoords - HEADER_FOOTER_TOLERANCE) <= contents[i].items[j].transform[5]) {
				console.log("removed header: " + contents[i].items[j].str);
				console.log(headerYcoords - HEADER_FOOTER_TOLERANCE + " / " + contents[i].items[j].transform[5]);
				contents[i].items.splice(j, 1);
				j--;
			}
		}
	}
	return contents;
}

function removeFooters2(contents) {
	var footerYcoords;

	for (var i = 0; i < contents.length; i++) {
		footerYcoords = contents[i].items[0].transform[5];
		for (var j = 0; j < contents[i].items.length; j++) {
			if (footerYcoords > contents[i].items[j].transform[5]) {
				if (!isSpace(contents[i].items[j].str)) {
					footerYcoords = contents[i].items[j].transform[5];
				}
			}
		}

		for (var j = 0; j < contents[i].items.length; j++) {
			if ((footerYcoords + HEADER_FOOTER_TOLERANCE) >= contents[i].items[j].transform[5]) {
				console.log("removed footer: " + contents[i].items[j].str);
				console.log(footerYcoords + HEADER_FOOTER_TOLERANCE + " / " + contents[i].items[j].transform[5]);
				contents[i].items.splice(j, 1);
				j--;
			}
		}
	}
	return contents;
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
			indentationDifference = lines[i + 1].xCoordinate - lines[i].xCoordinate;

			console.log("indentationDifference = " + indentationDifference);
			indentationDifference = indentationDifference.toFixed(1); // round to 1 dec pl
			console.log("rounded indentationDifference = " + indentationDifference);

			return indentationDifference;
		}
	}
	return indentationDifference;
}

function fillTable2(lines, indentationDifference, xCoordinatesOfKeyword) {
	
	$('#table').DataTable().clear();
	$('#table').DataTable().destroy();
	var table = document.getElementById("table").getElementsByTagName("tbody")[0];
	var row, keyword, relatedText, pSpeech;
	var isOnRelatedText = false;

	for (var i = 0; i < lines.length; i++) {
		if (xCoordinatesOfKeyword.includes(lines[i].xCoordinate.toFixed(1))) {
			keyword = getKeywordFromStr(lines[i].str);
			relatedText = getRelatedTextFromStr(lines[i].str);

			initializeRow(table);
			insertKeywordToTable(table, keyword);
			insertRelatedText(table, relatedText);
			insertProcessNumber(table);

			pSpeech = getPartOfSpeech(table);
			insertPartOfSpeech(table, pSpeech)
		} else {
			if (table.rows.length > 0) {
				insertRelatedText(table, lines[i].str);
			}
		}
	}
	///
	intialiseDatatables();
	document.getElementById("tableWrapper").style.visibility = "visible";
	document.getElementById("save").disabled=false
}

function intialiseDatatables(){
	var tableDT = $('#table').DataTable({
		responsive: true,
		ordering: false,
		altEditor: true,

		"columns": [{
				"data": "ProcessNumber"
			},
			{
				"data": "Keyword"
			},
			{
				"data": "PartOfSpeech"
			},
			{
				"data": "RelatedText"
			}
		],

		select: {
			style: 'single'
		},

		dom: "<'row'<'col-sm-6'lB><'col-sm-6'f>>" +
			"<'row'<'col-md-12't>>" +
			"<'row'<'col-sm-5'i><'col-sm-7'p>>",
		buttons: [{
				text: 'Add',
				name: 'add' // DO NOT change name
			},
			{
				extend: 'selected', // Bind to Selected row
				text: 'Edit',
				name: 'edit' // DO NOT change name
			},
			{
				extend: 'selected', // Bind to Selected row
				text: 'Delete',
				name: 'delete' // DO NOT change name
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
			}
		]
	});

	$('#table thead tr:eq(1) th').each(function (i) {
		var title = $(this).text();
		$(this).html('<input type="text" placeholder="Search ' + title + '" />');
		$('input', this).on('keyup change', function () {
			if (tableDT.column(i).search() !== this.value) {
				tableDT
					.column(i)
					.search(this.value)
					.draw();
			}
		});
	});
}

function collectXCoordinate(lines, indentationDifference) {
	var xCoords = [];
	var notKeywordsXcoords = [];

	for (var i = 0; i < lines.length; i++) {
		if (isKeyword(i, lines, indentationDifference)) {
			if (!xCoords.includes(lines[i].xCoordinate.toFixed(1))) {
				xCoords.push(lines[i].xCoordinate.toFixed(1));
				console.log("keyword with indented line = " + lines[i].str + lines[i + 1].str);
				console.log(lines[i].str + " = " + lines[i].yCoordinate);
				console.log(lines[i + 1].str + " = " + lines[i + 1].yCoordinate);
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

function getPartOfSpeech(table) {
	for (var i = 0; i < pSpeech.length; i++) {
		if (table.rows[table.rows.length - 1].cells[3].innerHTML.includes(pSpeech[i])) {
			var replaceStr = table.rows[table.rows.length - 1].cells[3].innerHTML;
			replaceStr = replaceStr.replace(pSpeech[i], " ");
			replaceStr.trim();
			table.rows[table.rows.length - 1].cells[3].innerHTML = replaceStr;
			return pSpeech[i];
		}
	}
	return "N/A";
}

function initializeRow(table) {
	var row, processNumber, keyword, partOfSpeech, relatedText;

	row = table.insertRow(table.rows.length);
	processNumber = row.insertCell(0);
	keyword = row.insertCell(1);
	partOfSpeech = row.insertCell(2);
	relatedText = row.insertCell(3);
}

function insertProcessNumber(table) {
	var processNumber = table.rows.length - 1;
	table.rows[table.rows.length - 1].cells[0].innerHTML += processNumber;
}

function insertKeywordToTable(table, word) {
	var relatedText;
	table.rows[table.rows.length - 1].cells[1].innerHTML += word;
}

function insertPartOfSpeech(table, pSpeech) {
	var processNumber = table.rows.length - 1;
	table.rows[table.rows.length - 1].cells[2].innerHTML += pSpeech;
}

function insertRelatedText(table, word) {
	var relatedText;
	if(word!=""){
	table.rows[table.rows.length - 1].cells[3].innerHTML += word.trim() + "<br>";}
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

	this.addToString = function (str) {
		this.str += str;
	};
}

function combineLineByLine(items) {
	var lines = [];
	var tempString = '';
	var xCoords, yCoords;

	for (var i = 0; i < items.length; i++) {
		if (!isSpace(items[i].str)) {
			tempString = items[i].str;
			xCoords = items[i].transform[4];
			yCoords = items[i].transform[5];

			while (((i + 1) < items.length) && isOnSameLine(items[i], items[i + 1])) {
				// console.log("test2");
				tempString += items[i + 1].str;
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

$(document).ready(function () {
	$('#table thead tr').clone(true).appendTo('#table thead');
	$('#table').DataTable()
	$("#files").on('change', function () {
		document.getElementById('files-label').innerHTML = this.files[0].name
	});
});
