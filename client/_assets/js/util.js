if(typeof(console.log) == 'undefined') {
    console = function() {
        this.log = function(s) {alert(s);}
    }
}

Object.prototype.types = []

var Point = function(x, y) {
    var that = this;
    this.types.push('point')
    this.x = x;
    this.y = y;
    
    this.toJSON = function() { return [this.x,this.y];}
}

var Dimension = function(width, height) {
    var that = this;
    this.types.push('dimension');
    this.width = width;
    this.height = height;
    
    this.toJSON = function() {return [this.width, this.height]}
}