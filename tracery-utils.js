/*
 * Parsing Tracery syntax
 */


/*
 * (Protected) Rule syntax
 * Plaintext with inline tags and action
 * and optionally, ways to keep those from expanding 
 * eg: "foo", "foo #bar#", "#foo# [bar]#baz#"
 * Protected "foo (#bar#)"
 */

function clearAutoExpansions(s, grammar) {

	// Find and replace all toplevel autoexpanders {}
	var sections = splitIntoTopSections(s, "{");



	return sections.map(function(section) {
		if (section.depth === 1) {

			// TODO, actual expansion
			var expansion = section.inner;
			return "***";
		}
		return section.inner;
	}).join("");
}

function parseRule(s, grammar) {

	// Clear any autoexpansions
	if (grammar)
		s = clearAutoExpansions(s, grammar);
	var sections = splitIntoTopSections(s, "[(#");

	var parsedSections = sections.map(function(section) {
		switch (section.openChar) {
			case "[":
				return parseAction(section.inner);
				break;

			case "#":
				return parseTag(section.inner);
				break;


			default:
				return section.inner;
		}
	});



	return parsedSections;
}


/* 
 * Action syntax
 * key:rules
 * key:CLEAR
 * key:POP
 */
function parseAction(raw, grammar) {

	var errors = [];
	if (grammar)
		raw = clearAutoExpansions(raw, grammar);

	var raw2 = splitOnUnprotected(raw, [":", "="]);

	var target = raw2[0];
	target = parseTarget(target);

	var expression = raw2[1];
	var parsed = {
		type: "action",
		raw: raw,
		op: raw.charAt(raw2[0].length)
	};

	if (expression === undefined) {
		// No expression, just a target, ie, a single action
		// Means what?

	} else {
		// The expression is either a string, an array, or a JSON object
		var type = expression.charAt(0);
		switch (type) {
			case "{":
				// Probably a JSON obj.  Or maybe an autogen rule?
				parsed.rules = [expression];
				break;
			case "[":
				// A set of rules
				parsed.expression = expression.trim();
				if (expression.charAt(expression.length - 1) !== "]") {

					errors.push("No close bracket at the end of rule array: " + inQuotes(expression));
					expression = expression.substring(1);
				} else {
					expression = expression.substring(1, expression.length - 1);
				}

				parsed.rules = splitOnUnprotected(expression, ",");
				break;
			default:
				// A single rule
				parsed.rules = [expression];
				break;
		}
	}


	if (parsed.rules)
		parsed.rules = parsed.rules.map(function(rule) {
			return parseRule(rule, grammar);
		});


	parsed.target = target;
	parsed.expression = expression;
	return parsed;
}

// Parse something which could be either a tag or an address
function parseTarget(raw, isModifier) {
	if (raw.charAt(0) === "/") {
		var path = raw.substring(1).split("/");
		return {
			type: "path",
			path: path
		};
	}

	if (isModifier) {
		return {
			type: "modifierKey",
			key: raw
		}
	}
	return {
		type: "symbolKey",
		key: raw
	}
}

function parseTag(raw, grammar) {
	if (grammar)
		raw = clearAutoExpansions(raw, grammar);

	var sections = splitOnUnprotected(raw, ".");
	var target = parseTarget(sections[0]);
	var modifiers = sections.slice(1).map(parseModifier)

	return {
		modifiers: modifiers,
		target: target,
		raw: raw,
		type: "tag",
	};
}


/* 
 * Modifier
 * A modifier has a key (or an address?!)
 */
function parseModifier(raw, grammar) {
	var s = splitIntoTopSections(raw, "[(#").filter(function(s) {
		return s.inner.length > 0
	});

	var parsed = {
		target: parseTarget(s[0].inner, true),
		raw: raw,
		type: "modifier",
	}

	// has parameters
	if (s.length > 1) {
		parsed.parameters = splitOnUnprotected(s[1].inner, ",").map(function(s2) {
			return parseRule(s2, grammar);
		});
	}

	return parsed;;
}

/*===========================================
 * Test generators
 */

function generateProtectedRule(depth) {
	if (isNaN(depth))
		depth = 0;

	var sections = [];

	// Create a string of text
	var count = Math.floor(Math.random() * Math.max(0, 5 - depth * 3) + 1);
	for (var i = 0; i < count; i++) {
		var opt = Math.floor(4.5 * Math.pow(Math.random(), 1.9 + .2 * depth));
		//console.log(depth + ": " + opt + " " + count);
		// Possible componenets of a rule

		switch (opt) {
			case 0:
				// PlainText
				sections.push(generatePlainText(depth + 1));
				break;

			case 1:
				// Tag
				if (depth < 3) {
					sections.push(generateTagOrAddress(depth + 1));
				}
				break;

			case 2:
				if (depth < 3)
				// Action tag
					sections.push(generateAction(depth + 1));
				break;

			case 3:
				// A protected section [foo:#bar#]
				if (depth > 1)
					sections.push("(#" + generateTagOrAddress(depth + 1) + "#)");

				// An autoexpand section [#foo#]
				// is immediately replaced with its expansion
				// Like the javascript foo.bar vs foo[bar] syntax
				break;
		}


	}
	return sections.join("");
}



/*
 * Action syntax
 * Does something with rules
 * foo:bar
 * 
 */

function generateAction(depth) {

	var s = "";

	var rules = generateProtectedRule(depth + 1);
	var count = Math.floor(Math.random() * 4);
	if (Math.random() > .5) {
		for (var i = 0; i < count; i++) {
			rules += "," + generateProtectedRule(depth + 1)
		}

		rules = "[" + rules + "]";
	}
	//return s;
	return "[" + generateTagName() + ":" + rules + "]";
}

/*
 * Tag syntax
 * A central symbol key
 */
function generateTagOrAddress(depth) {

	var s = generateTagName();

	// address
	if (Math.random() > .5) {
		s = generateAddress(depth + 1);
	}

	var modCount = Math.floor(Math.random() * Math.random() * 3);
	for (var i = 0; i < modCount; i++) {
		var modName = generateTagName();

		s += "." + modName;

		var paramCount = Math.floor(Math.random() * Math.random() * 3);
		if (paramCount > 0) {

			for (var j = 0; j < paramCount; j++) {

			}
		}

	}

	if (depth < 2) {
		var preCount = Math.floor(Math.random() * Math.random() * 3);
		var postCount = Math.floor(Math.random() * Math.random() * 3);
		for (var i = 0; i < preCount; i++) {
			s += generateAction(depth + 1) + s;
		}

		for (var i = 0; i < postCount; i++) {
			s += generateAction(depth + 1);
		}
	}

	return "#" + s + "#";

}

function generateTagName() {
	var s = "";
	if (Math.random() > .2) {
		s += generatePlainTextWord();
	} else {
		// Generate an autoexpansion tag
		s += "{#" + generatePlainTextWord() + "#}"
	}

	return s;
}

function generateAddress(depth) {
	var s = "";
	var len = Math.floor(Math.random() * 4 + 1);
	for (var i = 0; i < len; i++) {
		s += "/" + generateTagName();

	}
	return s;
}


function generatePlainTextWord() {
	var s = getRandom("abcdefghijklmnopqrstuvwxyz");
	var len = Math.floor(Math.random() * 4);
	for (var i = 0; i < len; i++) {
		if (Math.random() > .4 && i < len - 1)
			s += getRandom("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
		s += getRandom("abcdefghijklmnopqrstuvwxyz");
	}
	return s;
}


function generatePlainText() {
	var s = "";
	var len = Math.floor(Math.random() * 4) + 1;
	for (var i = 0; i < len; i++) {
		if (i !== 0)
			s += " ";
		s += generatePlainTextWord();

		if (Math.random() > .9)
			s += "\\" + getRandom("(){}[]#".split(""));
	}

	s += getRandom([".", ", ", "? ", "", "", ""]);
	return s;
}



function splitIntoTopSections(s, sectionTypes) {

	var sections = [];
	sections.errors = [];
	var start = 0;
	parseProtected(s, {
		onCloseSection: function(section) {
			if (section.depth === 1 && (sectionTypes === undefined || sectionTypes.includes(section.openChar))) {
				var topSection = section;
				start = section.end + 1;
				if (topSection.inner.length > 0)
					sections.push(topSection);
				else {
					sections.errors.push("Empty section '" + section.openChar + "" + section.closeChar + "' at " + section.start);
				}

			}
		},

		onOpenSection: function(section) {
			if (section.depth === 1 && (sectionTypes === undefined || sectionTypes.includes(section.openChar))) {

				// Make a base-level section from the last section to the start of this one
				var topSection = {

					depth: 0,
					start: start,
					end: section.start,
					inner: s.substring(start, section.start)
				};
				start = section.start;
				if (topSection.inner.length > 0)
					sections.push(topSection);
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
				}

				if (splitter) {
					var s2 = s.substring(start, index);
					sections.push(s2);
					start = index + splitter.length;

				}
			}
		},
	})
	sections.push(s.substring(start));
	return sections;
}


/*=======================================================================================
 *
 * Abstract general-purpose parsing methods
 */

/*
 * Get indices of unprotected
 */
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


/*
 * Get indices of unprotected
 */

function getUnprotectedIndices(s, queries) {
	if (typeof queries === 'string' || queries instanceof String)
		queries = [queries];
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

}


function parseProtected(s, settings) {
	// Defaults
	var openChars = settings.openChars ? settings.openChars : "[({#";
	var closeChars = settings.closeChars ? settings.closeChars : "])}#";
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