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
    
    this.notify_mouse_drag = function(x, y) {
        entities.forEach(function(val, index, arr) {
            if(typeof val.on_mouse_drag == 'function') {
                val.on_mouse_drag(x, y);
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

    this.id     = null; // Assigned by the entity manager
    this.loc    = new Point(0, 0);
    this.dim    = new Dimension(0,0);
    
    this.set_dim = function(dim) {
        if(dim.types.indexOf('dimension') == -1) {
            throw 'Specified object must be a dimension type'
        }
        that.dim = dim;
    }
    
    this.set_loc = function(loc) {
        if(loc.types.indexOf('point') == -1) {
            throw 'Specifid object must be a point type'
        }
        that.loc = loc;
    }
    
    this.get_bounding_box = function () {
        return  [   that.loc.x - this.dim.width, this.loc.y - this.dim.height,
                    that.loc.x + this.dim.width, this.loc.y + this.dim.height,
                    that.loc.x - this.dim.width, this.loc.y + this.dim.height,
                    that.loc.x + this.dim.width, this.loc.y - this.dim.height
                ]
    }
    
    this.draw = function() {
        throw 'Draw should be implemented for each type of entity'
    }
}

var Mage = function() {
    var that            = this,
        
        target_loc      = null, // Point the user wants to move to
        mov_speed       = .7,   // Default movement speed
        health          = 75,   // Starting health
        shield          = 0;    // Starting shield
    
    this.set_dim(new Dimension(15, 35)) // Default mage size
    
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
        
        var draw_loc = new Point(0, 0); // New location to draw the mage
        
        if(target_loc != null) {
            
            var abs_diff_x = Math.abs(that.loc.x - target_loc.x),
                abs_diff_y = Math.abs(that.loc.y - target_loc.y);
            
            if(abs_diff_x < 10 && abs_diff_y < 10) { // How close does the target have to be to stop moving
                draw_loc = that.loc;
                target_loc = null;
            } else {
                
                // Which directions to mov in
                var bearing = -1 * Math.atan2(target_loc.y - that.loc.y, target_loc.x - that.loc.x);
                
                // Without a smoothing factor, the animation with look really jerky
                var     x_mov_speed     = null,
                        y_mov_speed     = null,
                        smooth_factor   = null;
                    
                smooth_factor = Math.abs(bearing);
                if(smooth_factor != 0) {
                    while(smooth_factor > 1) {
                        smooth_factor -= 1;
                    }
                }
                    
                x_mov_speed = y_mov_speed = mov_speed * smooth_factor;
            
                if(abs_diff_x > abs_diff_y) {
                  x_mov_speed = mov_speed * 1.5
                } else {
                  y_mov_speed = mov_speed * 1.5
                }
            
            
                if(bearing == 0) { // Move right
                    console.log('Move east')
                    draw_loc.x = that.loc.x + mov_speed
                    draw_loc.y = that.loc.y
                } else if(bearing == Math.PI || bearing == (-1 * Math.PI)) {
                    console.log('Move west')
                    draw_loc.x = that.loc.x - mov_speed
                    draw_loc.y = that.loc.y 
                } else if(bearing == (Math.PI / 2)) {
                    console.log('Move north')
                    draw_loc.x = that.loc.x
                    draw_loc.y = that.loc.y - mov_speed
                } else if(bearing == ((Math.PI /2) * -1)) {
                    console.log('Move south')
                    draw_loc.x = that.loc.x
                    draw_loc.y = that.loc.y + mov_speed
                } else if(bearing > 0 && bearing < (Math.PI / 2)) {
                    console.log('Move north-east')
                    
                    draw_loc.x = that.loc.x + x_mov_speed
                    draw_loc.y = that.loc.y - y_mov_speed
                } else if(bearing < 0 && bearing > ((Math.PI / 2) * -1)) {
                    console.log('Move south-east')
                    
                    draw_loc.x = that.loc.x + x_mov_speed
                    draw_loc.y = that.loc.y + y_mov_speed
                } else if(bearing < ((Math.PI / 2) * -1) && bearing > (Math.PI * -1)) {
                    console.log('Move south-west')
                    draw_loc.x = that.loc.x - x_mov_speed
                    draw_loc.y = that.loc.y + y_mov_speed
                } else if(bearing > (Math.PI / 2) && bearing < Math.PI) {
                    console.log('Move norht-west')
                    draw_loc.x = that.loc.x - x_mov_speed
                    draw_loc.y = that.loc.y - y_mov_speed
                }
                that.loc = draw_loc;
            }
        } else {
            draw_loc = that.loc;
        }
        
        CONTEXT.fillStyle = that.color
        CONTEXT.fillRect(draw_loc.x, draw_loc.y,that.dim.width,that.dim.height);
        draw_health_bar();
        draw_shield_bar();
        draw_elements();
    } 
    
    
    function draw_health_bar() {
        // Health bar conists of a red bar on top of a black bar
        CONTEXT.fillStyle = 'rgb(0,0,0)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        CONTEXT.fillRect(vert_location,that.loc.y + 39,50, 5)
        
        CONTEXT.fillStyle = 'rgb(255,0,0)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        CONTEXT.fillRect(vert_location,that.loc.y + 39,Math.round(health / 2), 5)
    }
    
    function draw_shield_bar() {
        CONTEXT.fillStyle = 'rgb(100,100,100)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        CONTEXT.fillRect(vert_location,that.loc.y + 46,50, 4)
        
        
        CONTEXT.fillStyle = 'rgb(255,255,255)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        CONTEXT.fillRect(vert_location,that.loc.y + 46,Math.round(shield / 2), 4)
        
        CONTEXT.strokeStyle = 'rgba(100,100,100, .4)';
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        CONTEXT.strokeRect(vert_location,that.loc.y + 46,50, 4)
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
        
            vert_location = that.loc.x - Math.round(that.dim.width / 2) - 5
            
            CONTEXT.strokeStyle = 'rgba(100,100,100,.5)';
            CONTEXT.fillStyle = 'rgba(175,175,175,.3)';
            CONTEXT.beginPath();
            CONTEXT.arc(vert_location + (i * 10.3), that.loc.y + 57 , 4, 0, Math.PI * 2, true);
            CONTEXT.closePath();
            CONTEXT.fill();
            CONTEXT.stroke();
        }
    
    }
    this.on_mouse_drag = function(x, y) {
        target_loc = new Point(x,y);
        console.log(x + ' ' + y);
    }
}

Mage.inherits(Entity);