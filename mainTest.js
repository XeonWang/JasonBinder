
function TestMode() {
	this.name = Jason.observable("Jason");
	this.age = "12";
	this.fullInfo = Jason.computed(function(){
		return this.name() + this.age;
	}, this);
	this.friends = [{name:"friends1"}, {name:"friends2"}, {name:"friends3"}];
}
var testMode = new TestMode();
Jason.modelBind(testMode);
