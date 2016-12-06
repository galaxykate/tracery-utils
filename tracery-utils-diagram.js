/*=======================================================================================
 *
 * Visualization of parsing
 */


function createDiagram(node, holder) {
	if (Array.isArray(node)) {
		var childHolder = $("<div/>", {
			class: "traceryparse-children",
		}).appendTo(holder);

		$.each(node, function(index, child) {
			createDiagram(child, childHolder);
		});

	} else {

		if (typeof node === 'string' || node instanceof String) {
			$("<div/>", {
				html: inQuotes(node),
				class: "traceryparse-node traceryparse-text",
			}).appendTo(holder);
		} else {
			var div = $("<div/>", {
				class: "traceryparse-node traceryparse-" + node.type,
			}).appendTo(holder);

			var header = $("<div/>", {
				html: node.raw,
				class: "traceryparse-header",
			}).appendTo(div);

			var content = $("<div/>", {
				class: "traceryparse-content",
			}).appendTo(div);

			switch (node.type) {
				case "action":
					createDiagram(node.target, content);

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
					createDiagram(node.target, content);
					if (node.modifiers) {
						var mods = $("<div/>", {
							class: "traceryparse-modifiers traceryparse-node",
						}).appendTo(content);
						createDiagram(node.modifiers, mods);
					}
					break;

				case "modifier":
					createDiagram(node.target, content);
					//content.html(node.modName);
					if (node.parameters) {
						var parameters = $("<div/>", {
							class: "traceryparse-parameters traceryparse-node",
						}).appendTo(content);
						createDiagram(node.parameters, parameters);
					}
					break;

				case "symbolKey":
					content.html(node.key);
					break;
				case "modifierKey":
					content.html(node.key);
					break;

				case "path":
					$.each(node.path, function(index, path) {
						$("<div/>", {
							html: path,
							class: "traceryparse-node traceryparse-pathsegment"
						}).appendTo(content);
					})
					break;
			}
		}

	}
}