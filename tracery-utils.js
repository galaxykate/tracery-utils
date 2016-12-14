/*
 * Parsing Tracery syntax
 */


// Parse an expression of math, tracery
function parseExpression(raw) {


	// get unprotected operators


	var ops = "|| && >= <= < > == ! ^ % * / + -".split(" ");
	var s = splitOnUnprotected(raw, ops, true, "(['", ")]'");

	s = s.filter(function(s2) {

		if (typeof s2 === 'string' || s2 instanceof String)
			return s2.trim().length > 0;
		return true;
	});



	// turn into neg
	for (var i = 0; i < s.length - 1; i++) {
		if (s[i].splitter !== undefined && s[i + 1].splitter !== undefined) {

			// two in a row
			if (s[i + 1].splitter === "-") {

				s[i + 1].splitter = "NEG";
				s[i + 1].splitterIndex = 7.5;
			}
		}
	}


	function buildTree(sections) {
		if (sections.length === 1) {

			var s1 = sections[0].trim();

			// Single section could be text/tracery, number, or address
			var val = parseFloat(s1);
			if (!isNaN(val)) {
				return val;
			}

			if (s1.charAt(0) === "'") {
				return parseRule(s1.substring(1, s1.length - 1));

			}
			
			return parseDotAddress(s1);
		}

		/*
				console.log("Build tree: " + sections.map(function(s) {
					if (typeof s === 'string' || s instanceof String)
						return s;
					return s.splitter;
				}).join(" "));
		*/

		// get the earliest operator
		var priority = -99999;
		var topOp;
		var topOpIndex;

		for (var i = 0; i < sections.length; i++) {
			if (sections[i].splitterIndex > priority) {
				topOp = sections[i];
				topOpIndex = i;

				priority = sections[i].splitterIndex;
			}
		}



		// split on this one
		if (topOp) {

			return {
				type: "expression",
				op: topOp.splitter,
				lhs: buildTree(sections.slice(0, topOpIndex)),
				rhs: buildTree(sections.slice(topOpIndex + 1))
			}

		} else {
			console.log("Unknown ", sections);
		}

	}
	var tree = buildTree(s);
	tree.raw = raw;


	return tree;

}

// JS style addresses
function parseDotAddress(s) {
	var path = [];

	var s1 = splitOnUnprotected(s, ".");
	for (var i = 0; i < s1.length; i++) {
		var s2 = splitIntoTopSections(s1[i], "[");
		
		// j=0 will be depth 0, rest will be empty or 
		path.push(s2[0].inner);
		for (var j = 1; j < s2.length; j++) {
			var s3 = s2[j].inner.trim();
			if (s3.length > 0)
				path.push(parseExpression(s3));
		}
	}

	return {
		raw: s,
		type: "path",
		path: path
	}
}


// Return an address object
// "foo": symbol key
// "/foo": object address
// May have internal rule identifiers /{#foo#}/bar
function parseAddress(s) {
	s = s.trim();
	if (s.length === 0) {
		console.log("empty address");
		return undefined;
	}

	// Path address
	if (s.charAt(0) === "/") {
		var path = splitOnUnprotected(s.substring(1), "/");
		path = path.map(function(s2) {
			return parseAddress(s2);
		});

		return {
			raw: s,
			type: "path",
			path: path
		}
	}


	if (s.indexOf("{") >= 0) {
		var s2 = splitIntoTopSections(s, "{");
		return {
			type: "dynamicKey",
			raw: s,

			ruleAddress: s2.map(function(s3) {

				if (s3.depth === 0)
					return s3.inner;



				return parseRule(s3.inner, true);

			})
		}
	}

	return s;
}

function parseTag(s) {
	var parsed = {
		type: "tag",
		preactions: [],
		postactions: [],
		modifiers: [],
		raw: s
	}

	var s2 = splitIntoTopSections(s, "[");

	var inner;
	for (var i = 0; i < s2.length; i++) {
		if (s2[i].depth > 0) {
			if (inner !== undefined)
				parsed.postactions.push(parseAction(s2[i].inner));
			else
				parsed.preactions.push(parseAction(s2[i].inner));
		} else {
			if (inner !== undefined) {
				console.warn("multiple addresses in tag: " + s2[i].inner + " " + inner);
			}
			inner = s2[i].inner;
		}
	}

	var s3 = splitOnUnprotected(inner, ".");
	parsed.address = parseAddress(s3[0]);

	// Parse all the modifiers
	parsed.modifiers = s3.slice(1).map(function(modifierRaw) {
		var s5 = splitIntoTopSections(modifierRaw, "(");

		var modifier = {
			type: "modifier",
			address: parseAddress(s5[0].inner)
		}

		// Parse parameters
		if (s5.length > 1) {
			if (s5.length > 2)
				console.warn("unexpected sections in modifier " + inQuotes(s4));
			var paramRaw = splitOnUnprotected(s5[1].inner, ",");

			// Parameters are either arrays [], or rules
			modifier.parameters = paramRaw.map(function(paramRaw) {
				var parameter = {
					type: "parameter",
				}

				// Array parameter
				if (paramRaw.charAt(0) === "[" && paramRaw.charAt(paramRaw.length - 1) === "]") {
					paramRaw = paramRaw.substring(1, paramRaw.length - 1);
					var rules = splitOnUnprotected(paramRaw, ",");

					parameter.rule = rules.map(function(rule) {
						return parseRule(rule, true);
					});
				} else {
					// treat as a rule
					parameter.rule = parseRule(paramRaw, true);
				}


				return parameter;
			});
		}

		return modifier;
	});

	// Parse the address
	return parsed;
}

function parseRule(rawRule, protected) {
	var baseLevelIgnore = "(";

	if (protected)
		baseLevelIgnore = "";

	var rule = {
		sections: splitIntoTopSections(rawRule, "({[#", baseLevelIgnore).map(function(section) {
			switch (section.openChar) {

				// Protected:
				//  Treat the stuff inside like plaintext "([foo])"

				case "(":

					//	console.log(" " + section.inner);
					return section.inner;
					break;
				case "#":
					return parseTag(section.inner);
					break;
				case "[":
					return parseAction(section.inner);
					break;
				default:
					return section.inner;

			}
		}),
		raw: rawRule,
		type: "rule",
	};
	//	console.log(rule.sections);

	return rule;
}

function parseAction(rawAction) {
	var action = {
		type: "action",
		op: ":",
		raw: rawAction
	}

	var s = splitOnUnprotected(rawAction, ":");
	action.address = parseAddress(s[0]);

	// Rules exists
	// Rule types:
	//  Single rule
	//  Array [foo,bar,(baz)]
	//  Object TODO
	if (s[1]) {
		var rulesRaw = s[1];

		// Array
		if (rulesRaw.charAt(0) === "[" && rulesRaw.charAt(rulesRaw.length - 1) === "]") {
			action.rules = splitOnUnprotected(rulesRaw.substring(1, rulesRaw.length - 1), ",").map(function(s) {
				return parseRule(s, true);
			});

		} else if (rulesRaw.charAt(0) === "{" && rulesRaw.charAt(rulesRaw.length - 1) === "}") {
			//TODO
		} else {
			action.rules = parseRule(rulesRaw, true);
		}
	}
	return action;
}



/*=======================================================================================
 *
 * Abstract general-purpose parsing methods
 */



function splitIntoTopSections(s, sectionTypes, baseLevelIgnore) {


	var sections = [];
	sections.errors = [];
	var start = 0;
	parseProtected(s, {
		baseLevelIgnore: baseLevelIgnore,

		onCloseSection: function(section) {
			if (section.depth === 1 && (sectionTypes === undefined || sectionTypes.indexOf(section.openChar) >= 0)) {
				var topSection = section;
				start = section.end + 1;
				if (topSection.inner.length > 0)
					sections.push(topSection);
				else {
					sections.errors.push("Empty section '" + section.openChar + "" + section.closeChar + "' at " + section.start);
				}

			} else {

			}
		},

		onOpenSection: function(section) {
			if (section.depth === 1 && (sectionTypes === undefined || sectionTypes.indexOf(section.openChar) >= 0)) {

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

	sections = sections.filter(function(s) {
		return s.inner.length > 0;
	})


	return sections;
}



function splitOnUnprotected(s, splitters, saveSplitters, openChars, closeChars) {
	if (typeof splitters === 'string' || splitters instanceof String)
		splitters = [splitters];
	var sections = [];
	var start = 0;
	parseProtected(s, {
		openChars: openChars,
		closeChars: closeChars,
		onChar: function(c, index, depth) {
			if (depth === 0) {
				var splitter = undefined;
				for (var i = 0; i < splitters.length; i++) {


					if (s.startsWith(splitters[i], index)) {
						splitter = {
							splitterIndex: i,
							index: index,
							splitter: splitters[i],
						}
					}
				}

				if (splitter) {
					var s2 = s.substring(start, index);
					sections.push(s2);
					start = index + splitter.splitter.length;
					if (saveSplitters) {
						sections.push(splitter);
					}
				}


			}
		},
	})
	sections.push(s.substring(start));
	return sections;
}


/*
 * Get indices of unprotected
 * TODO
 */

function getUnprotectedIndices(s, queries) {
	if (typeof queries === 'string' || queries instanceof String)
		queries = [queries];
}



// Hero function
// Runs all the parsing stuff
function parseProtected(s, settings) {

	// Defaults
	var openChars = settings.openChars ? settings.openChars : "[({#";
	var closeChars = settings.closeChars ? settings.closeChars : "])}#";
	var baseLevelIgnore = settings.baseLevelIgnore ? settings.baseLevelIgnore : "";
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

					var ignore = depth.length === 0 && baseLevelIgnore.indexOf(c) > -1;

					var pastMaxDepth = settings.maxDepth && (depth.length < settings.maxDepth);

					// Ignoring everything in here until the close character is reached
					if (pastMaxDepth || ignore) {

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

function inSingleQuotes(s) {
	return "'" + s + "'";
}


function inTags(s) {
	return '#' + s + '#';
}

function inCurlyBrackets(s) {
	return '{' + s + '}';
}

function inSquareBrackets(s) {
	return '[' + s + ']';
}

function inParensBrackets(s) {
	return '(' + s + ')';
}

function tabSpacer(count) {
	var s = "";
	for (var i = 0; i < count; i++) {
		s += "\t"
	}
	return s;
}