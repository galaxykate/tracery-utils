function createTestDiagram(type, s, testHolder) {
	if (!testHolder)
		testHolder = $("#panel-expansion .panel-content");

	var parsers = {
		address: parseAddress,
		tag: parseTag,
		rule: parseRule,
		expression: parseExpression
	}

	//s = "[f:[foo,bar,baz]]"
	var parsed = parsers[type](s);
	var holder = $("<div/>", {
		html: "<span class='traceryparse-label'>" + s + "</span>",
		class: "traceryparse-diagram traceryparse-diagram-" + type
	}).appendTo(testHolder);
	var holder2 = $("<div/>", {}).appendTo(holder);


	var keyType;
	if (!parsed.path && type === "address")
		keyType = "symbolKey";
	createDiagram(parsed, holder2, keyType);
}

function runTraceryTests() {


	var obj = {
			playerNum: {
				current: "1",
				last: "0",
			},
			animals: {
				subspecies: [{
					name: "bear",

				}, {
					name: "okapi"

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
		/*
			console.log(getFromDotPath(obj, "animals.class"));
			console.log(getFromDotPath(obj, "animals.subspecies[playerNum.current]"));
		*/
		/*
	console.log(getFromSlashPath(obj, "/animals"));
	console.log(getFromSlashPath(obj, "/animals/subspecies/{/foo/current}/name"));
	console.log(getFromSlashPath(obj, "/animals/subspecies/{/playerNum/current}/name"));
*/
		/*
			setFromSlashPath(obj, "animals.subspecies[3].emu", {
				name: "emu"
			});
			console.log(obj);

		*/
	var allTests = {
		ruleParsing: [
			["", ""],


			// pushes "#hey# to foo"
			["foo:(#hey#)", ""],

			// pushes "([[hey]]) to foo"
			["foo:\\(#hey#\\)", ""],



		]

	};



	var testTypes = {
		ruleParsing: {
			parseFxn: parseRule,
			//	autogenTest: generateProtectedRule,
		}
	};
	var toTest = Object.keys(allTests);

	/*
		for (var i = 0; i < toTest.length; i++) {
			var testData = allTests[toTest[i]];
			var testSettings = testTypes[toTest[i]];
			console.log("---------------------");
			console.log("Testing " + toTest[i])
			for (var j = 0; j < testData.length; j++) {
				console.log(testData[j][0]);
				createTestDiagram(testData[j][0], testSettings.parseFxn);
				//createTestDiagram()
			}
			for (var j = 0; j < 0; j++) {
				var s = testSettings.autogenTest();

			}
		}
		*/

	/*

		createTestDiagram("address", "/foo/bar");
		createTestDiagram("address", "/{#foo#}/bar");
		createTestDiagram("address", "/a{#foo#}Test/bar");
		createTestDiagram("address", "foo");
		createTestDiagram("address", "{#foo#}");


		createTestDiagram("tag", "[foo:bar]foo.baz(bar,#foo#)");
		createTestDiagram("tag", "foo.baz(#bar#,(#foo#))");
		createTestDiagram("tag", "foo.baz([bar#bar#,bat])");
		createTestDiagram("rule", "#/foo/bar# test something #bar#");

	createTestDiagram("rule", "#foo.baz# and (is) (not) #foo.bar.baz(#test#,(test2),#/test.bar#)#");
		createTestDiagram("rule", "#/foo/bar/{#baz#}#");
		
		createTestDiagram("rule", "[foo:[test,test]]");
		createTestDiagram("rule", "#foo.{#/bar/baz/{#foo#}#}#");
	createTestDiagram("rule", "(#foo#)[foo:([test])]");
	createTestDiagram("rule", "#foo#(#foo#)#foo#");
	createTestDiagram("rule", "#foo#");
	*/
}