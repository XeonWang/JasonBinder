Jason = function(rootObj) {
	var version = "1.0";
	var BIND_PRIFIX = "JasonBind";

	var BIND_TYPE = {
		TEXT: "text",
		FOREACH: "foreach"
	};

	var dom = rootObj.document || {};

	var Util = {
		stringArrayTrim: function(strings) {
			for (var i = 0; i < strings.length; i++) {
				strings[i] = strings[i].trim();
			};
		}
	};

	var setFieldValue = function(entity, value, changeHandle) {
		var htmlObj = entity.htmlObject;
		var tagName = htmlObj.tagName && htmlObj.tagName.toUpperCase();
		switch(tagName) {
			case "INPUT":
				htmlObj.value = value;
				break;
			case "SELECT":
				htmlObj.value = value;
				break;
			default:
				if (htmlObj.textContent !== undefined) {
					htmlObj.textContent = value;
				} else {
					console.log("Unknown field type: " + tagName);
				}
				break;
		}
		if (changeHandle) {
			if (htmlObj.changeHandles === undefined) {
				htmlObj.changeHandles = new Array();
				if (typeof(htmlObj.onchange) === "function") {
					htmlObj.changeHandles.push(htmlObj.onChange);
				}
				htmlObj.onchange = function(event) {
					for (var i = 0; i < htmlObj.changeHandles.length; i++) {
						htmlObj.changeHandles[i].call(htmlObj, event, entity);
					};
					doCustomListeners(entity, event);
				}
			}
			htmlObj.changeHandles.push(changeHandle);
		}
	};

	var doForeachBind = function(entity) {
		var htmlObj = entity.htmlObject;
		var bindKey = entity.bindKey;
		var data = entity.model[bindKey];
		var children = new Array();

		for (var i = 0; i < htmlObj.children.length; i++) {
			children[i] = htmlObj.children[0].cloneNode(true);
			htmlObj.removeChild(htmlObj.children[0]);
		};

		for (var i = 0; i < data.length; i++) {
			for (var j = 0; j < children.length; j++) {
				var newChild = children[j].cloneNode(true);
				htmlObj.appendChild(newChild);
				ui.modelBind(data[i], newChild);
			};			
		};
	};

	var doCustomListeners = function(entity, event) {
		for (var i = 0; i < entity.model[entity.bindKey].subscribes.length; i++) {
			entity.model[entity.bindKey].subscribes[i].call(htmlObj, event);
		};
	}
	
	var getBindEntitiesFn = function() {

		var objects = new Array();

		var Entity = function(bindValue, htmlObj) {
			bindValue = bindValue.split(":");
			Util.stringArrayTrim(bindValue);
			this.bindType = bindValue[0];
			this.bindKey = bindValue[1];
			this.htmlObject = htmlObj;
		};

		var collectBind = function(htmlObj) {

			var bindValue = htmlObj.getAttribute && htmlObj.getAttribute(BIND_PRIFIX);
			if (bindValue) {
				objects[objects.length] = new Entity(bindValue, htmlObj);
			} else {

				var children = htmlObj.childNodes;

				for (var i = 0; i < children.length; i++) {
					collectBind(children[i]);
				};
			}

			return objects;
		};

		return collectBind;
	};

	var bindedHtmlMaps;

	var rebind = function() {
		for (var i = 0; i < bindedHtmlMaps.length; i++) {
			var entity = bindedHtmlMaps[i];
			if ( typeof(entity.model[entity.bindKey]) === "function" ) {
				setFieldValue(entity, entity.model[entity.bindKey].call(entity.model));
			}
		};
	}

	var observables = new Array();

	var OBSERVABLE = function(object, property) {
		this.object = object;
		this.property = property;
	};

	var ui = {
		version: function() {
			alert(version);
		},

		observable: function(value) {
			var innerValue = value;
			var binder = function(newValue, suppress) {
				if (newValue === undefined) {
					return innerValue;
				} else {
					if(innerValue !== newValue) {
						innerValue = newValue;
						suppress || rebind();
					}
				}
			};
			binder.subscribes = new Array();
			binder.subscribe = function(listener) {
				binder.subscribes.push(listener);
			};
			binder.observable = true;
			return binder;
		},

		computed: function(computer, object) {
			var binder = function() {
				return computer.call(object);
			};
			return binder;
		},

		modelBind: function(model, htmlObj) {
			if (!htmlObj) {
				htmlObj = dom;
			}
			var collectRootBindEntities = getBindEntitiesFn();
			bindedHtmlMaps = collectRootBindEntities(htmlObj);
			if (!model) {
				if(console.log) {
					console.log("Illegal model as the first argument. (Jason.bind(model, [htmlObj]))");
				}
				return false;
			}

			for (var i = 0; i < bindedHtmlMaps.length; i++) {
				if (model[bindedHtmlMaps[i].bindKey]) {
					bindedHtmlMaps[i].model = model;
				}
			}

			var bindProperty = function(entity, value, changeHandle) {
				switch(entity.bindType) {
					case BIND_TYPE.TEXT: 
						setFieldValue(entity, value, changeHandle);
						break;
					case BIND_TYPE.FOREACH:
						doForeachBind(entity);
						break;
				}
			}	

			var updateModel = function(event, entity) {
				model[entity.bindKey].call(model, entity.htmlObject.value, true);
			}

			for (var i = 0; i < bindedHtmlMaps.length; i++) {
				var bindValue;
				var property = model[bindedHtmlMaps[i].bindKey];
				var typeOfProperty = typeof(property);
				if ( typeOfProperty === "function" ) {
					bindValue = property.call(model);
					bindProperty(bindedHtmlMaps[i], bindValue, updateModel);
				} else if(typeOfProperty !== "undefined") {
					bindValue = property;
					bindProperty(bindedHtmlMaps[i], bindValue);
				}

			};
		}
	};

	return ui;
}(window);