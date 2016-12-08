// Paths

function getFromPath(obj, path) {
	var obj2 = obj;

	for (var i = 0; i < path.length - 1; i++) {
		var s = path[i];
		if (!obj2[s]) {
			console.log("No " + s + " found");
			return undefined;
		}

		obj2 = obj2[s];
	}

	var last = path[path.length - 1];

	return obj2[last];
}

function setFromPath(obj, path, val) {
	var obj2 = obj;

	for (var i = 0; i < path.length - 1; i++) {
		var s = path[i];
		if (!obj2[s])
			obj2[s] = {};

		obj2 = obj2[s];
	}

	var last = path[path.length - 1];
	obj2[last] = val;
}


// JS style paths like "foo.bar[5].baz[foo]"

function parseDotPath(path) {
	var path2 = [];

	var sections = splitOnUnprotected(path, ".");
	for (var i = 0; i < sections.length; i++) {
		var s2 = splitIntoTopSections(sections[i], "[");
		path2.push(s2[0].inner);
		for (var j = 1; j < s2.length; j++) {
			if (s2[j].depth === 1) {
				var val = s2[j].inner;
				if (isNaN(parseFloat(val))) {
					var pathNext = parseDotPath(val);
					path2.push(pathNext);
				} else {
					path2.push(parseFloat(val));
				}
			}
		}
	}

	return path2;
}

function getFromDotPath(obj, path) {
	var path2 = parseDotPath(path);
	return getFromPath(obj, path2);
}

function setFromDotPath(obj, path, val) {
	var path2 = parseDotPath(obj, path);
	setFromPath(obj, path2, val);
}

// Tracery style paths like "/foo/bar/{#foo.bar()#}/{/foo}"

function parseSlashPath(path) {
	
	if (path.charAt(0) === "/")
		path = path.substring(1);
	var path2 = splitOnUnprotected(path, "/").map(function(s) {
		return s;
	});
	
}

function getFromSlashPath(obj, path) {
	// Expand any curly brackets
	//path = clearAutoExpansions(path);

	parseSlashPath(path);
}


function setFromSlashPath(obj, path, val) {
	var path2 = [];
}