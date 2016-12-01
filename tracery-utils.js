function test() {
	var tests = ["[(#", "]", "[]"];
	for (var i = 0; i < tests.length; i++) {
		var s = createTraceryTestRule();
		//s = "[foo:bax.whoo(bar)](bar)"
		//splitOnUnprotected();
		//	diagramParse(s, $("#panel-expansion .panel-content"));
	}

}


function parseModifier(mod) {
	console.log("mod: " + mod);
	mod = mod.trim();
	// get first and last parens
	var parenIndex = mod.indexOf("(");
	if (parenIndex >= 0) {
		if (mod.charAt(mod.length - 1) !== ")")
			console.warn("Poorly formed modifer");
		return {
			name: mod.substring(0, parenIndex),
			parameters: splitOnUnprotected(mod.substring(parenIndex + 1, mod.length - 1), ",")
		}
	} else {
		return {
			name: mod
		}
	}

}

function parseTagContents(s) {

	var sections = [];
	sections.errors = [];
	var start = 0;
	parseProtected(s, {
		onCloseSection: function(section) {
			if (section.depth === 1 && section.openChar === "[") {
				sections.push(section);
				start = section.end + 1;
			}

		},

		onOpenSection: function(section) {
			if (section.depth === 1 && section.openChar === "[") {
				var text = s.substring(start, section.start).trim();
				if (text.length > 0) {
					sections.push({
						depth: 0,
						start: start,
						end: section.start,
						inner: text
					});
				}
			}

		},

		error: function(error) {
			sections.errors.push(error);
		}
	});

	var text = s.substring(start).trim();
	if (text.length > 0) {
		sections.push({
			depth: 0,
			start: start,
			end: s.length,
			inner: s.substring(start)
		});
	}

	return sections;
}



function splitIntoTopSections(s) {

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


	return sections;
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
			if (Math.random() > .5 || depth > 2) {
				s += "#" + createTraceryTestTag(depth + 1) + "#"
			} else {
				s += "[" + createTraceryTestAction(depth + 1) + "]"
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

	return createTraceryWord() + ":" + createTraceryTestRule(depth + 1);
}


function createTraceryTestTag(depth) {
	if (depth === undefined)
		depth = 0;

	var base = createTraceryWord(depth);
	var count = Math.random() * 3;
	for (var i = 0; i < count; i++) {
		base += "." + createTraceryWord(depth);
	}
	return base;
}


function splitOnUnprotected(s, splitters) {
	if (typeof splitters === 'string' || splitters instanceof String)
		splitters = [splitters];

	var sections = [];
	var start = 0;
	parseProtected(s, {
		onChar: function(c, index, depth) {
			if (depth === 0) {
				var splitter = undefined;
				for (var i = 0; i < splitters.length; i++) {


					if (s.startsWith(splitters[i], index)) {
						splitter = splitters[i];
					}
					if (splitter) {

						sections.push(s.substring(start, index));
						start = index + splitter.length;
					}
				}
			}
		},
	})
	sections.push(s.substring(start));
	return sections;
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

function diagramParse(s, holder) {
	console.log("Diagram " + s);
	var divStack = "";

	function createDiv(holder, section) {
		var div = $("<div/>", {
			class: "traceryparse-section"
		}).appendTo(holder);

		var label = $("<div/>", {
			class: "traceryparse-label",

		}).appendTo(div);

		if (section) {

			if (section.openChar)
				$("<div/>", {
					class: "traceryparse-op",
					html: section.openChar
				}).appendTo(label);

			$("<div/>", {
				class: "traceryparse-text",
				html: section.inner
			}).appendTo(label);

			if (section.closeChar)
				$("<div/>", {
					class: "traceryparse-op",
					html: section.closeChar
				}).appendTo(label);

		} else {
			label.html(s);
		}

		div.children = $("<div/>", {
			class: "traceryparse-children",
		}).appendTo(div);

		if (section && section.children) {
			$.each(section.children, function(index, child) {
				createDiv(div.children, child);
			})
		}

		return div;


	}

	var rootDiv = createDiv(holder);

	var sectionStack = [];
	var sections = [];
	var rootSections = [];
	parseProtected(s, {
		onCloseSection: function(section) {
			console.log(tabSpacer(section.depth) + section.openChar + "\t" + inQuotes(section.inner) + "\t" + section.closeChar);


			sectionStack.pop(section);

			if (sectionStack.length === 0) {
				rootSections.push(section);
			} else {
				section.parent = sectionStack[sectionStack.length - 1];
				section.parent.children.push(section);
			}
		},
		onOpenSection: function(section) {
			section.children = [];
			sectionStack.push(section);
			sections.push(section);
		},

		onError: function(s) {
			console.log("ERROR: " + s);
		}
	});

	$.each(rootSections, function(index, section) {
		console.log(section);
		createDiv(rootDiv.children, section);
	});

	console.log(rootSections);
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