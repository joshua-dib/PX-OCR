var KEYWORD;
var START_PAGE;
var END_PAGE;
var pSpeech=["noun","pronoun","adjective","adverb","verb","preposition","conjuction","interjection","article"];

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
	console.log(typeof START_PAGE);
	//get endSearchPage
	END_PAGE = document.getElementById("form").elements.namedItem("endSearchPage").value;
	END_PAGE = parseInt(END_PAGE);
	console.log(typeof END_PAGE);

	//test
	console.log("keyword = " + KEYWORD);
	console.log("startSearchPage = " + START_PAGE);
	console.log("endSearchPage = " + END_PAGE);
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
				pagesContents = pagesContents.concat(getPageContent(i + 1, pdfDocument));
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
		if (xCoordinatesOfKeyword.includes(lines[i].xCoordinate)) {
			keyword = getKeywordFromStr(lines[i].str);
			relatedText = getRelatedTextFromStr(lines[i].str);

			initializeRow(table);
			insertKeywordToTable(table, keyword);
			insertRelatedText(table, relatedText);
			insertProcessNumber(table);

			pSpeech = getPartOfSpeech(table);
			insertPartOfSpeech(table,pSpeech)
		} else {
			if (table.rows.length > 0) {
				insertRelatedText(table, lines[i].str);
			}
		}
	}
	///
	var tableDT = $('#table').DataTable({
		orderCellsTop: true,
		fixedHeader: true,

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
		responsive: true,
		altEditor: true,

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
				extend: 'print',
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
	document.getElementById("table").style.visibility = "visible";
}

function collectXCoordinate(lines, indentationDifference) {
	var xCoords = [];

	for (var i = 0; i < lines.length; i++) {
		if (isKeyword(i, lines, indentationDifference)) {
			if (!xCoords.includes(lines[i].xCoordinate)) {
				xCoords.push(lines[i].xCoordinate);
			}
		}
	}

	console.log("xCoords");
	for (var i = 0; i < xCoords.length; i++) {
		console.log(xCoords[i]);
	}

	return xCoords;
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
	for (var i = 0; i < table.rows.length; i++) {
		if(table.rows[table.rows.length-1].cells[3].innerHTML.includes(pSpeech[i])){
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

function insertKeywordToTable(table, word) {
	var relatedText;
	table.rows[table.rows.length - 1].cells[1].innerHTML += word;
}

function insertRelatedText(table, word) {
	var relatedText;
	table.rows[table.rows.length - 1].cells[3].innerHTML += word + "<br>";
}

function insertProcessNumber(table) {
	var processNumber = table.rows.length - 1;
	table.rows[table.rows.length - 1].cells[0].innerHTML += processNumber;
}

function insertPartOfSpeech(table, pSpeech) {
	var processNumber = table.rows.length - 1;
	table.rows[table.rows.length - 1].cells[2].innerHTML += pSpeech;
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
				console.log("test2");
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
});