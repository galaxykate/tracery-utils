function splitIntoTopSections(s, splitters) {
	console.log(s);

	var sections = [];
	sections.errors = [];
	var start = 0;
	parseProtected(s, {
		onCloseSection: function(section) {
			if (section.depth === 1) {
				sections.push(section);
				start = section.end + 1;
			}

		},

		onOpenSection: function(section) {
			if (section.depth === 1) {
				sections.push({
					depth: 0,
					start: start,
					end: section.start,
					inner: s.substring(start, section.start)
				});
			}

		},

		error: function(error) {
			sections.errors.push(error);
		}
	});

	sections.push({
		depth: 0,
		start: start,
		end: s.length,
		inner: s.substring(start)
	});

	console.log(sections.map(function(s) {
		return inQuotes(s.inner) + s.depth;
	}).join("\t"));

	console.log(sections.errors);
	return sections;
}


var tests = ["[(#", "]", "[]"];
for (var i = 0; i < tests.length; i++) {
	var s = createTraceryTestRule();
	//splitIntoTopSections(tests[i], ",");
	testParse(s);
}

function createTraceryWord() {
	var s = getRandom("abcdefghijklmnopqrstuvwxyz");
	var count = Math.floor(Math.random() * 4);
	for (var i = 0; i < count; i++) {
		if (Math.random() > .4 && i < count - 1)
			s += getRandom("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
		s += getRandom("abcdefghijklmnopqrstuvwxyz");
	}
	return s;
}

function createTraceryTestRule(depth) {
	if (depth === undefined)
		depth = 0;

	var s = "";
	for (var i = 0; i < 10; i++) {
		if (Math.random() > .4) {
			s += createTraceryWord();

		} else {
			if (Math.random() > .5) {
				s += "#" + createTraceryWord() + "#"
			} else {
				s += "[" + createTraceryWord() + "]"
			}
		}
		if (Math.random() > .6)
			s += getRandom("    .,!'?").split("");
	}
	return s;
}

function createTraceryTestAction(depth) {
	if (depth === undefined)
		depth = 0;

}

function splitOnUnprotected(s, splitters) {
	if (typeof splitters === 'string' || splitters instanceof String)
		splitters = [splitters];

}

function getUnprotectedIndices(s, splitters) {
	if (typeof splitters === 'string' || splitters instanceof String)
		splitters = [splitters];
}

function testParse(s) {
	console.log("TEST: " + inQuotes(s));
	parseProtected(s, {
		onCloseSection: function(section) {
			console.log(tabSpacer(section.depth) + section.openChar + "\t" + inQuotes(section.inner) + "\t" + section.closeChar);

		},
		onOpenSection: function(section) {
			console.log(tabSpacer(section.depth) + "start " + section.openChar + section.type);
		},

		onError: function(s) {
			console.log("ERROR: " + s);
		}
	});
}

function parseProtected(s, settings) {
	// Defaults
	var openChars = settings.openChars ? settings.openChars : "[(#";
	var closeChars = settings.closeChars ? settings.closeChars : "])#";
	var ignoreInside = settings.ignoreInside ? settings.ignoreInside : "";

	/*
		console.log("IgnoreInside: " + ignoreInside);
		console.log("CloseChars: " + closeChars);
		console.log("OpenChars: " + openChars);
		*/

	var depth = [];
	var escaped = false;

	for (var i = 0; i < s.length; i++) {
		if (escaped) {
			escaped = false;
		} else {
			var c = s.charAt(i);
			if (c === "\\")
				escaped = true;
			else {

				// Top priority: close an open section
				if (depth.length > 0 && depth[depth.length - 1].closeChar === c) {
					var finished = depth.pop();
					finished.end = i;
					finished.inner = s.substring(finished.start + 1, finished.end);

					if (settings.onCloseSection)
						settings.onCloseSection(finished);
				} else {
					var openIndex = openChars.indexOf(c);


					var top = depth[depth.length - 1];

					var ignoreAll = depth.length > 0 && depth[depth.length - 1].ignoreInside;


					var pastMaxDepth = settings.maxDepth && (depth.length < settings.maxDepth);

					// Ignoring everything in here until the close character is reached
					if (pastMaxDepth || ignoreAll) {
						if (settings.onChar)
							settings.onChar(c, i, depth.length, s);
					} else {
						// Is this also a closing character?  what does it close?
						var closeIndex = closeChars.indexOf(c);

						if (openIndex < 0 && closeIndex >= 0) {
							if (settings.onError)
								settings.onError("Unmatched " + inQuotes(c) + " at " + i);
						}


						// open a new section
						if (openIndex >= 0) {

							var section = {
								openChar: openChars[openIndex],
								closeChar: closeChars[openIndex],
								start: i,
								depth: depth.length + 1,
								type: openIndex,
							}

							// Ignore everything inside of this section, until the section closer appears
							if (ignoreInside.indexOf(c) >= 0) {
								section.ignoreInside = true;
							}

							depth.push(section);
							var top = depth[depth.length - 1];



							if (settings.onOpenSection) {
								settings.onOpenSection(section);
							}
						} else {


							if (settings.onChar)
								settings.onChar(c, i, depth.length, s);
						}
					}
				}
			}
		}
	}

	if (settings.onError) {
		for (var i = 0; i < depth.length; i++) {
			settings.onError("Unmatched " + inQuotes(depth[i].openChar) + " at " + depth[i].start);
		}
	}

	if (settings.onEnd)
		settings.onEnd(depth);

}

function getRandom(arr) {
	return arr[Math.floor(arr.length * Math.random())];
}


function inQuotes(s) {
	return '"' + s + '"';
}

function tabSpacer(count) {
	var s = "";
	for (var i = 0; i < count; i++) {
		s += "\t"
	}
	return s;
}