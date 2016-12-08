function runTraceryTests() {


	var obj = {
		playerNum: {
			current: "1",
			last: "0",
		},
		animals: {
			subspecies: [{
				bear: {
					name: "bear",
				}
			}, {
				okapi: {
					name: "okapi"
				}
			}]
		}
	}
	/*
	setFromDotPath(obj, "animals.class", "animalia");
	setFromDotPath(obj, "animals.subspecies[2].lemur", {
		name: "lemur"
	});
	console.log(obj);
*/

	console.log(getFromDotPath(obj, "animals.class"));
	console.log(getFromDotPath(obj, "animals.subspecies[playerNum.current]"));

console.log(getFromSlashPath(obj, "/animals"));
console.log(getFromSlashPath(obj, "/animals/{/playerNum/current}/name"));
	/*
		setFromSlashPath(obj, "animals.subspecies[3].emu", {
			name: "emu"
		});
		console.log(obj);

	*/
	var allTests = {
		ruleParsing: [
			["", {}],
			["[bar]", {}],
			["[bar]#foo#", {}],
			["#_foo#", {}],
			["#foo😎#", {}],
			["😎#foo#baz[bar]", {}],
			["[#foo#:#bar#]", {}]
		]

	};

	var testTypes = {
		ruleParsing: {
			fxn: parseRule,
			autogenTest: generateProtectedRule,
		}
	};
	var toTest = Object.keys(allTests);

	for (var i = 0; i < toTest.length; i++) {
		var testData = allTests[toTest[i]];
		var testSettings = testTypes[toTest[i]];
		console.log("---------------------");
		console.log("Testing " + toTest[i])
		for (var j = 0; j < testData.length; j++) {

		}
		for (var j = 0; j < 0; j++) {

			var s = testSettings.autogenTest();
			//s = "[f:[foo,bar,baz]]"
			var tree = parseRule(s);
			var holder = $("<div/>", {
				html: "<span class='traceryparse-label'>" + s + "</span>",
				class: "traceryparse-diagram"
			}).appendTo($("#panel-expansion .panel-content"));
			var holder2 = $("<div/>", {

			}).appendTo(holder);
			createDiagram(tree, holder2);
		}
	}
}