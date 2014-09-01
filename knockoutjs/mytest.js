var simpleModel = {
	name: ko.observable('Bob'),
	age: 23
};

ko.applyBindings(simpleModel);

simpleModel.name.subscribe(function(){
	alert(2);
});