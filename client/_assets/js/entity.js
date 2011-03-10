var EntityManager = function() {
    var that            = this,
        entity_count    = 0;;
    
    this.entities        = [],
        
        
    this.add_entity = function(entity) {
       if(entity.types.indexOf('entity') == -1) {
          throw 'Specified object must be an entity type'
       }
       entity_count += 1;
       entity.id = Math.floor(Math.random() * 9999999);
       that.entities.push(entity)
    }
    
    this.remove_entity = function(entity) {
        if(entity.types.indexOf('entity') == -1) {
            throw 'Specified object must be an entity type'
        }
        var remove_index = null;
        that.entities.forEach(function(val, index, arr) {
            if(val.id == entity.id) {
                remove_index = val.id;
            }
        });
        if(remove_index == null) {
            throw 'Specified entity could not be found to be deleted';
        }
        that.entities.splice(remove_index, 1);
    }
    
    this.maintain = function(context, ws_queue) {
        
        that.entities.forEach(function(entity) {
            //CONTEXT.save();
            entity.draw(context);
            
            var e_json = entity.to_json()
            if(entity.prev_status != e_json) {
                ws_queue.push(e_json);
                entity.prev_status = e_json;
            }
            //CONTEXT.restore();
        })
    }
}

var Entity = function() { // Base from which all entities inherit
    MageObj.call(this);
    var that        = this;
    
    this.id         = null; // Assigned by the entity manager
    this.loc        = new Point(0, 0);
    this.dim        = new Dimension(0,0);
    
    this.sync_vars  = ['dim'];
    
    this.types.push('entity')
    
    this.prev_status = ''
    
    this.to_json = function() {
        return that.id + '|mage|' + that.toJSONString(that.sync_vars);
    }
    
    this.from_json = function(json_string) {
        var sync_obj = json_string.parseJSON()
        for(var prop in sync_obj) {
            if(prop == 'loc') {
                loc = sync_obj[prop]
                this[prop] = new Point(loc[0], loc[1])
            } else if(prop == 'dim') {
                dim = sync_obj[prop]
                this[prop] = new Dimension(dim[0], dim[1])
            } else if(prop == 'target_loc') {
                loc = sync_obj[prop]
                if(loc != null) {
                    this[prop] = new Point(loc[0], loc[1])
                }
            } else {
                this[prop] = sync_obj[prop]
            }
        }
    }
    
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
    Entity.call(this);
    
    var that            = this;
    
    this.target_loc      = null; // Point the user wants to move to
    this.mov_speed       = 2.7,  // Default movement speed
    this.health          = 75,   // Starting health
    this.shield          = 0;    // Starting shield    
    
    this.beam = null
    this.bursts = [] 
    
    this.sync_vars.push('target_loc', 'mov_speed', 'health', 'shield', 'color')
        
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
    
    this.draw = function(context) {
        if(that.beam != null) {
            that.beam.draw(context);
        }
        that.bursts.forEach(function(burst) {
            burst.draw(context);
        })
        
        
        var draw_loc = new Point(0, 0); // New location to draw the mage
        
        if(that.target_loc != null) {
            
            var abs_diff_x = Math.abs(that.loc.x - that.target_loc.x),
                abs_diff_y = Math.abs(that.loc.y - that.target_loc.y);
            
            if(abs_diff_x < 10 && abs_diff_y < 10) { // How close does the target have to be to stop moving
                draw_loc = that.loc;
                that.target_loc = null;
            } else {
                
                // Which directions to mov in
                var bearing = -1 * Math.atan2(that.target_loc.y - that.loc.y, that.target_loc.x - that.loc.x);
                
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
                    
                x_mov_speed = y_mov_speed = that.mov_speed * smooth_factor;
            
                if(abs_diff_x > abs_diff_y) {
                  x_mov_speed = that.mov_speed * 1.5
                } else {
                  y_mov_speed = that.mov_speed * 1.5
                }
                
                if(bearing == 0) { // Move right
                    //console.log('Move east')
                    draw_loc.x = that.loc.x + mov_speed
                    draw_loc.y = that.loc.y
                } else if(bearing == Math.PI || bearing == (-1 * Math.PI)) {
                    //console.log('Move west')
                    draw_loc.x = that.loc.x - mov_speed
                    draw_loc.y = that.loc.y 
                } else if(bearing == (Math.PI / 2)) {
                    //console.log('Move north')
                    draw_loc.x = that.loc.x
                    draw_loc.y = that.loc.y - mov_speed
                } else if(bearing == ((Math.PI /2) * -1)) {
                    //console.log('Move south')
                    draw_loc.x = that.loc.x
                    draw_loc.y = that.loc.y + mov_speed
                } else if(bearing > 0 && bearing < (Math.PI / 2)) {
                    //console.log('Move north-east')
                    draw_loc.x = that.loc.x + x_mov_speed
                    draw_loc.y = that.loc.y - y_mov_speed
                } else if(bearing < 0 && bearing > ((Math.PI / 2) * -1)) {
                    //console.log('Move south-east')
                    draw_loc.x = that.loc.x + x_mov_speed
                    draw_loc.y = that.loc.y + y_mov_speed
                } else if(bearing < ((Math.PI / 2) * -1) && bearing > (Math.PI * -1)) {
                    //console.log('Move south-west')
                    draw_loc.x = that.loc.x - x_mov_speed
                    draw_loc.y = that.loc.y + y_mov_speed
                } else if(bearing > (Math.PI / 2) && bearing < Math.PI) {
                    //console.log('Move norht-west')
                    draw_loc.x = that.loc.x - x_mov_speed
                    draw_loc.y = that.loc.y - y_mov_speed
                }
                that.loc = draw_loc;
            }
        } else {
            draw_loc = that.loc;
        }
        
        context.fillStyle = that.color
        context.fillRect(draw_loc.x, draw_loc.y,that.dim.width,that.dim.height);
        draw_health_bar(context);
        draw_shield_bar(context);
        draw_elements(context);
    } 
    
    
    function draw_health_bar(context) {
        // Health bar conists of a red bar on top of a black bar
        context.fillStyle = 'rgb(0,0,0)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        context.fillRect(vert_location,that.loc.y + 39,50, 5)
        
        context.fillStyle = 'rgb(255,0,0)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        context.fillRect(vert_location,that.loc.y + 39,Math.round(that.health / 2), 5)
    }
    
    function draw_shield_bar(context) {
        context.fillStyle = 'rgb(100,100,100)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        context.fillRect(vert_location,that.loc.y + 46,50, 4)
        
        
        context.fillStyle = 'rgb(255,255,255)'
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        context.fillRect(vert_location,that.loc.y + 46,Math.round(that.shield / 2), 4)
        
        context.strokeStyle = 'rgba(100,100,100, .4)';
        vert_location = that.loc.x - Math.round(that.dim.width / 2) - 10
        context.strokeRect(vert_location,that.loc.y + 46,50, 4)
    }
    
    function draw_elements(context) {
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
            
            context.strokeStyle = 'rgba(100,100,100,.5)';
            context.fillStyle = 'rgba(175,175,175,.3)';
            context.beginPath();
            context.arc(vert_location + (i * 10.3), that.loc.y + 57 , 4, 0, Math.PI * 2, true);
            context.closePath();
            context.fill();
            context.stroke();
        }
    
    }
    
    this. center = function() {
        return new Point(that.loc.x + Math.floor(that.dim.width/2), that.loc.y + Math.floor(that.dim.height/2))    
    }
    this.move = function(mouse_loc) {that.target_loc = mouse_loc;}
    
    this.fire_beam = function(mouse_loc) {
        that.beam = new Beam(mouse_loc, that);
    }
    this.stop_beam = function() {
        if(that.beam != null) {
            that.beam = null;
        }
    }
    
    this.fire_burst = function() {
        
    }
}

var Projectile = function() {
    MageObj.call(this);
    var that = this;
    
    this.types.push('projectile');
}

var Beam = function(mouse_loc, mage) {
    Projectile.call(this);
    var that = this,
        max_duration = 3,
        beam_width = 7;
    
    this.types.push('beam');
    
    this.draw = function(context) {
        
        var bearing = -1 * Math.atan2(mouse_loc.y - mage.loc.y, mouse_loc.x - mage.loc.x),
            deg = null,
            mage_center = mage.center();
            
        deg =  Math.round(((bearing / (Math.PI * 2)) * 360))
        
        context.fillStyle = "red";
        context.beginPath()
        context.moveTo(mage_center.x, mage_center.y);
        context.lineTo(mouse_loc.x, mouse_loc.y);
        
        if(deg > 0 && deg < 90) {
            deg = deg / 100
            context.lineTo(mouse_loc.x - (beam_width * deg), mouse_loc.y - (beam_width * (.9 - deg)));
            context.lineTo(mage_center.x - (beam_width * deg), mage_center.y - (beam_width * (.9 - deg)));
        } else if(deg > 90) {
            deg = (deg - 90) / 100
            context.lineTo(mouse_loc.x - (beam_width * (.9 - deg)), mouse_loc.y + (beam_width * deg));
            context.lineTo(mage_center.x - (beam_width * (.9 - deg)), mage_center.y + (beam_width * deg));   
        } else if(deg < 0 && deg > -90) {
            deg = deg / 100 * -1
            context.lineTo(mouse_loc.x + (beam_width * deg), mouse_loc.y - (beam_width * (.9 - deg)));
            context.lineTo(mage_center.x + (beam_width * deg), mage_center.y - (beam_width * (.9 - deg)));
        } else if(deg < -90) {
            deg = (deg + 90) / 100 * -1
            
            context.lineTo(mouse_loc.x + (beam_width * (.9 - deg)), mouse_loc.y + (beam_width * deg));
            context.lineTo(mage_center.x + (beam_width * (.9 - deg)), mage_center.y + (beam_width * deg));
        }
        
        context.lineTo(mage_center.x, mage_center.y)
        context.fill();
        
    }
}