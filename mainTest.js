
function TestMode() {
	this.name = Jason.observable("Jason");
	this.age = "12";
	this.fullInfo = Jason.computed(function(){
		return this.name() + this.age;
	}, this);
}
var testMode = new TestMode();
Jason.modelBind(testMode);