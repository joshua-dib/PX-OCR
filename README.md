# PX-OCR
Files related to the extraction of structured entries from OCR'ed dictionaries

Installation
	Installer - 
		Go to the 'installers' folder and select the platform required

	Self Compile/Package - 
		Setup: Requires 
			Node.js https://nodejs.org/en/, 
			electron-forge https://www.electronforge.io/, 
			yarn https://yarnpkg.com/en/,
		1. Navigate to the 'src' directory
		2. In the system terminal run 
			2.1 'yarn start' to quickly run the application
			2.2 'yarn package' to get an exe output
			2.3 'yarn make' to get a system installer

Website -
	To continue running the website on a hosted server make sure to swap the html files in 'src' to include the download bar

File Directory -
	Archive: Test files in initial prototyping
	node_modules: required for packaging into an electron application
	installers: install files to add to system 
	src(relevant directory): JS, HTML, packages used
	Documentation: documentation throughout the course
	Dictionaries: tested dictionaries to be used as samples
	
Repository: https://github.com/Josh-18993745/PX-OCR.git
Developed 2019 by Roger Bernardo, Joshua Dib, Caleb Smith, Josephine Paculio