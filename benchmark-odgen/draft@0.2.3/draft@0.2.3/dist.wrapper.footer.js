	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = require('draft');
	} 
	else {
		if (typeof define === "function" && define.amd) {
			define("draft", [], function () { return require('draft'); });
		}
		else if ( typeof window === "object" && typeof window.document === "object" ) {
			window.draft = require('draft');
		}
	}
}();