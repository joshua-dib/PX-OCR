// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const TabGroup = require('electron-tabs');

let tabGroup = new TabGroup({
	newTab: {
		title: 'Extract',
		src: 'file://' + __dirname +  '/extract.html',
		visible: true,
		active: true,
		webviewAttributes: {
			nodeintegration: true
		}
	}
});

tabGroup.addTab({
	title: 'Extract',
	src: 'file://' + __dirname +  '/extract.html',
	visible: true,
	active: true,
	webviewAttributes: {
		nodeintegration: true
	}
});