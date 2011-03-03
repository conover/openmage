var EntityManager = function() {
    var that = this,
        entities = [],
        entity_count = 0;
        
    this.add_entity = function(entity) {
       if(entity.types.indexOf('entity') == -1) {
           throw 'Specified object must be an entity type'
       }
       entity_count += 1;
       entity.id = entity_count;
       entities.push(entity)
    }
    
    this.remove_entity = function(entity) {
        if(entity.types.indexOf('entity') == -1) {
            throw 'Specified object must be an entity type'
        }
        var remove_index = null;
        entities.forEach(function(val, index, arr) {
            if(val.id == entity.id) {
                remove_index = val.id;
            }
        });
        if(remove_index == null) {
            throw 'Specified entity could not be found to be deleted';
        }
        entities.splice(remove_index, 1);
    }
    
    this.notify_click = function(x, y) {
        entities.forEach(function(val, index, arr) {
            if(typeof val.on_click == 'function') {
                val.on_click(x, y);
            }
        });
    }
    this.maintain = function() {
        entities.forEach(function(val, index, arr) {
            //CONTEXT.save();
            val.draw();
            //CONTEXT.restore();
        })
    }
}

var Entity = function() { // Base from which all entities inherit
    var that = this;
    
    this.types.push('entity')

    this.id = null; // Assigned by the entity manager
    this.place = [0,0]
    this.dim = [0,0]
    
    this.set_dim = function(dim) {
        if(!(dim instanceof Array)) {
            throw 'Dimensions must be an array'
        } else if(dim.length != 2) {
            throw 'Dimensions must be an array of dim 2'
        } else if(dim[0].constructor !== Number || dim[1].constructor != Number) {
            throw 'Dimensions array values must be numbers'
        }
        //console.log(dim);
        that.dim = dim;
    }
    
    this.set_place = function(place) {
        if(!(place instanceof Array)) {
            throw 'Place must be an array'
        } else if(place.length != 2) {
            throw 'Place must be an array of dim 2'
        } else if(place[0].constructor !== Number || place[1].constructor != Number) {
            throw 'Place array galues must be numbers'
        }
        //console.log(place);
        that.place = place;
    }
    
    this.get_bounding_box = function () {
        return  [   that.place[0] - this.dim[0], this.place[1] - this.dim[1],
                    that.place[0] + this.dim[0], this.place[1] + this.dim[1],
                    that.place[0] - this.dim[0], this.place[1] + this.dim[1],
                    that.place[0] + this.dim[0], this.place[1] - this.dim[1]
                ]
    }
    
    this.draw = function() {
        throw 'Draw should be implemented for each type of entity'
    }
}

var Mage = function() {
    var that            = this,
        target_place    = null,
        mov_speed       = 2,
        health          = 75,
        shield          = 75;
    
    this.set_dim([15, 35])
    
    this.types.push('mage')
    
    this.set_color = function(color) {
        if(color.constructor !== String) {
            throw 'Color must be a string'
        } else if(!color.match(/rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\)/)) {
            throw 'Color must be a string of the form rgb(0-255,0-255,0-255)'
        }
        //console.log(color);
        that.color = color;
    }
    
    this.draw = function() {
        
        var draw_place = [0,0]
        
        if(target_place != null) {
            //console.log(Math.abs(that.place[0] - target_place[0]) + ' ' +  Math.abs(that.place[1] - target_place[1]))
            
            var abs_diff_x = Math.abs(that.place[0] - target_place[0]),
                abs_diff_y = Math.abs(that.place[1] - target_place[1]);
            
            
            if(abs_diff_x < 15 && abs_diff_y < 15) { // How close does the target have to be to stop moving
                
                draw_place = that.place;
                target_place = null;
            } else {
            
            
                //console.log((target_place[1] - that.place[1]) + ' '  + (target_place[0] - that.place[0]) )
            
                bearing = -1 * Math.atan2(target_place[1] - that.place[1], target_place[0] - that.place[0])
            
                if(bearing == 0) { // Move right
                    console.log('Move east')
                    draw_place[0] = that.place[0] + mov_speed
                    draw_place[1] = that.place[1]
                
                } else if(bearing == Math.PI || bearing == (-1 * Math.PI)) {
                    console.log('Move west')
                    draw_place[0] = that.place[0] - mov_speed
                    draw_place[1] = that.place[1] 
                } else if(bearing == (Math.PI / 2)) {
                    console.log('Move north')
                    draw_place[0] = that.place[0]
                    draw_place[1] = that.place[1] - mov_speed
                } else if(bearing == ((Math.PI /2) * -1)) {
                    console.log('Move south')
                    draw_place[0] = that.place[0]
                    draw_place[1] = that.place[1] + mov_speed
                } else if(bearing > 0 && bearing < (Math.PI / 2)) {
                    console.log('Move north-east')
                    
                    x_mov_speed = mov_speed;
                    y_mov_speed = mov_speed;
                    
                    if(abs_diff_x > abs_diff_y) {
                      x_mov_speed = mov_speed * 2
                    } else {
                      y_mov_speed = mov_speed * 2 
                    }
                    
                    draw_place[0] = that.place[0] + x_mov_speed
                    draw_place[1] = that.place[1] - y_mov_speed
                } else if(bearing < 0 && bearing > ((Math.PI / 2) * -1)) {
                    console.log('Move south-east')
                    draw_place[0] = that.place[0] + mov_speed
                    draw_place[1] = that.place[1] + mov_speed
                } else if(bearing < ((Math.PI / 2) * -1) && bearing > (Math.PI * -1)) {
                    console.log('Move south-west')
                    draw_place[0] = that.place[0] - mov_speed
                    draw_place[1] = that.place[1] + mov_speed
                } else if(bearing > (Math.PI / 2) && bearing < Math.PI) {
                    console.log('Move norht-west')
                    draw_place[0] = that.place[0] - mov_speed
                    draw_place[1] = that.place[1] - mov_speed
                }
            
                console.log(bearing);
                //place = target_place;
                that.place = draw_place;
                //target_place = null;
            }
        } else {
            draw_place = that.place
        }
        
        CONTEXT.fillStyle = that.color
        CONTEXT.fillRect(draw_place[0], draw_place[1],that.dim[0],that.dim[1]);
        draw_health_bar();
        draw_shield_bar();
        draw_elements();
    } 
    
    
    function draw_health_bar() {
        // Health bar conists of a red bar on top of a black bar
        CONTEXT.fillStyle = 'rgb(0,0,0)'
        vert_location = that.place[0] - Math.round(that.dim[0] / 2) - 10
        CONTEXT.fillRect(vert_location,that.place[1] + 39,50, 5)
        
        CONTEXT.fillStyle = 'rgb(255,0,0)'
        vert_location = that.place[0] - Math.round(that.dim[0] / 2) - 10
        CONTEXT.fillRect(vert_location,that.place[1] + 39,Math.round(health / 2), 5)
    }
    
    function draw_shield_bar() {
        CONTEXT.fillStyle = 'rgb(100,100,100)'
        vert_location = that.place[0] - Math.round(that.dim[0] / 2) - 10
        CONTEXT.fillRect(vert_location,that.place[1] + 46,50, 3)
        
        
        CONTEXT.fillStyle = 'rgb(255,255,255)'
        vert_location = that.place[0] - Math.round(that.dim[0] / 2) - 10
        CONTEXT.fillRect(vert_location,that.place[1] + 46,Math.round(shield / 2), 3)
        
        CONTEXT.strokeStyle = 'rgba(100,100,100, .4)';
        vert_location = that.place[0] - Math.round(that.dim[0] / 2) - 10
        CONTEXT.strokeRect(vert_location,that.place[1] + 46,50, 3)
    }
    
    function draw_elements() {
        // water
        // fire
        // cold
        // arcane
        // earth
        // shield
        // life
        // electric
        
        for(var i = 0; i < 5;i++) {
        
            vert_location = that.place[0] - Math.round(that.dim[0] / 2) - 5
            
            CONTEXT.strokeStyle = 'rgba(100,100,100,.5)';
            CONTEXT.fillStyle = 'rgba(175,175,175,.3)';
            CONTEXT.beginPath();
            CONTEXT.arc(vert_location + (i * 10.3), that.place[1] + 56 , 4, 0, Math.PI * 2, true);
            CONTEXT.closePath();
            CONTEXT.fill();
            CONTEXT.stroke();
        }
    
    }
    this.on_click = function(x, y) {
        target_place = [x,y];
        //console.log(x + ' ' + y);
    }
}

Mage.inherits(Entity);