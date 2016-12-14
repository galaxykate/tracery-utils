/*=======================================================================================
 *
 * Visualization of parsing
 */


function createDiagram(node, holder, keyType) {
//console.log(node);
	if (!node) {

		console.warn("No node to diagram!");
		return;
	}

	// Array
	if (Array.isArray(node)) {
		var childHolder = $("<div/>", {
			class: "traceryparse-children",
		}).appendTo(holder);

		$.each(node, function(index, child) {
			createDiagram(child, childHolder, keyType);
		});

	} else {

		if (!isNaN(node)) {
			var div = $("<div/>", {
				html: node,
				class: "traceryparse-node traceryparse-number"
			}).appendTo(holder);

		}
		// String
		else if (typeof node === 'string' || node instanceof String) {

			if (keyType) {
				var div = $("<div/>", {
					html: node,
					class: "traceryparse-node traceryparse-key traceryparse-" + keyType + " traceryparse-" + keyType + "-" + node
				}).appendTo(holder);


			} else {
				var div = $("<span/>", {
					html: node,
					class: "traceryparse-text"
				}).appendTo(holder);

			}

		}

		// Other types of objects
		else {
			var div = $("<div/>", {
				class: "traceryparse-node traceryparse-" + node.type,
			}).appendTo(holder);
			if (keyType) {
				div.addClass("traceryparse-key traceryparse-" + keyType);
			}

			var header = $("<div/>", {
				html: node.raw,
				class: "traceryparse-header",
			}).appendTo(div);

			var content = $("<div/>", {
				class: "traceryparse-content",
			}).appendTo(div);

			switch (node.type) {
				case "expression":
					if (node.op) {
						createDiagram(node.lhs, content);

						var op = $("<div/>", {
							html: node.op,
							class: "traceryparse-op traceryparse-node",
						}).appendTo(content);

						createDiagram(node.rhs, content);

					}
					break;
				case "action":
					createDiagram(node.address, content, "symbolKey");

					if (node.op) {
						var op = $("<div/>", {
							html: node.op,
							class: "traceryparse-op traceryparse-node",
						}).appendTo(content);
					}

					if (node.rules) {
						var rules = $("<div/>", {
							class: "traceryparse-rules traceryparse-node",
						}).appendTo(content);

						createDiagram(node.rules, rules);
					}
					break;

				case "tag":

					$.each(node.preactions, function(index, action) {
						createDiagram(action, content);
					});

					if (node.address)
						createDiagram(node.address, content, "symbolKey");

					if (node.modifiers && node.modifiers.length > 0) {

						createDiagram(node.modifiers, content);
					}

					$.each(node.postactions, function(index, action) {
						createDiagram(action, content);
					});
					break;

				case "modifier":
					createDiagram(node.address, content, "modifierKey");
					//content.html(node.modName);
					if (node.parameters) {

						createDiagram(node.parameters, content);
					}
					break;
				case "parameter":

					if (node.rule)
						createDiagram(node.rule, content);
					break;

				case "rule":
					createDiagram(node.sections, content);
					break;

				case "symbolKey":
					content.html(node.key);
					break;
				case "modifierKey":
					content.html(node.key);
					break;

				case "dynamicKey":
					//createDiagram(node.ruleAddress, content);
					createDiagram(node.ruleAddress, content);
					console.log(node.ruleAddress);
					break;

				case "path":
					createDiagram(node.path, content, "pathKey");

					break;
			}
		}

	}
}