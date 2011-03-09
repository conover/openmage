if(typeof(console.log) == 'undefined') {
    console = function() {
        this.log = function(s) {alert(s);}
    }
}

var MageObj = function() {
    this.types = []
}

var Point = function(x, y) {
    MageObj.call(this);
    var that = this;

    this.types.push('point');
    
    this.x = x;
    this.y = y;
    
    this.toJSON = function() { return [this.x,this.y];}
}

var Dimension = function(width, height) {
    MageObj.call(this);
    var that = this;
    
    this.types.push('dimension');
    
    this.width = width;
    this.height = height;
    
    this.toJSON = function() {return [this.width, this.height]}
}