/********
****** NinjaSlider, multipurpose html slider, it relies heavily in Function.prototype.bind, RequesAnimationFrame and css transitions
****** Support: IE10+
****** Author: Fernando Silva
****** URL: http://www.github.com/fdograph
*****/

/////////////////////////////////
///////////////////////////////// NinjaSlider Class
/////////////////////////////////
(function(window, document){
    "strict mode";

    var support = {
            touch: ('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch),
            pointers: window.navigator.msPointerEnabled || window.navigator.pointerEnabled,
            transitions: (function(temp) {
                var props = ['transitionProperty', 'WebkitTransition'],
                    i;
                for (i in props) { if (temp.style[ props[i] ] !== undefined) { return true; } }
                return false;
            })( document.createElement('ninja') )
        };

    ///// auxiliars
    var addListeners = function( element, events, handler ){
        events.forEach(function( e ){
            element.addEventListener( e, handler );
        });
    };
    var removeListeners = function( element, events, handler ){
        events.forEach(function( e ){
            element.removeEventListener( e, handler );
        });
    };
    var getCoords = function( event ){
        var x, y;

        if( support.touch ){
            if( event.touches && event.touches[0] ){
                x = event.touches[0].pageX;
                y = event.touches[0].pageY;
            } 
            else if( event.changedTouches && event.changedTouches[0] ){
                x = event.changedTouches[0].pageX;
                y = event.changedTouches[0].pageY;
            }
        }
        else {
            x = event.pageX;
            y = event.pageY;
        }

        return { x : x, y : y };
    };
    var extend = function(){
        var i, key;
        for( i = 1; i < arguments.length; i++){
            for( key in arguments[i]){
                if(arguments[i].hasOwnProperty(key)){
                    arguments[0][key] = arguments[i][key];
                }
            }
        }
        return arguments[0];
    };

    window.NinjaSlider = function( container, options ){
        if( !support.transitions ){ return false; }

        this.defaults = {
            auto : 2000,
            speed : 300,
            throttle : 300,
            effect : 'slide',
            handleKeys : true,
            blockScrolling : false
            // transitionCallback : function( index, item, slider ){},
        };
        this.settings = extend( this.defaults, (options || {}) );

        this.container = container;
        this.list = this.container.children[0];
        this.items = Array.prototype.map.call(this.list.children, function(e){ return e; });

        /// events closures
        this.setupClosures();

        this.initialized = false;
        this.resizeTimeout = null;
        this.setup();
        this.eventsHandler( 'engage' );

        if( this.settings.auto ){
            this.autoInterval = setInterval( this.next.bind( this ), this.settings.auto );
        }

        var effect = this.settings.effect;;
        if( typeof this.effects[ effect ].init === 'function' ){
            this.effects[ effect ].init( this );
        }

        return {
            slide : this.slide.bind( this ),
            prev : this.prev.bind( this ),
            next : this.next.bind( this ),
            kill : this.kill.bind( this )
        };
    };
    
    window.NinjaSlider.prototype = {
        ///// configs
        setup : function(){
            this.width = this.container.getBoundingClientRect().width || this.container.offsetWidth;
            this.currentIndex = this.currentIndex ? this.currentIndex : 0;
            this.slidesPos = [];

            var effect = this.settings.effect;
            this.effects[ effect ].setup( this );
            this.initialized = true;
        },
        kill : function(){
            var effect = this.settings.effect;
            this.effects[ effect ].kill( this );
            this.initialized = false;
        },
        setupClosures : function(){
            this.resize = this.onResize.bind( this );
            this.start = this.onStart.bind( this );
            this.move = this.onMove.bind( this );
            this.end = this.onEnd.bind( this );

            if( this.settings.auto ){
                this.stopAuto = function(){
                    if( this.autoInterval ){ 
            			clearInterval( this.autoInterval );
            			this.autoInterval = undefined;
            		}
                    removeListeners( this.container, ['mousedown', 'touchstart', 'keydown'], this.stopAuto );
                }.bind( this );
            }

            if( this.settings.handleKeys ){
            	this.keysHandler = function( event ){
            		if( event.keyCode == '39' ){ this.next(); }
            		else if( event.keyCode == '37' ){ this.prev(); }
            	}.bind( this );
            }
        },
        eventsHandler : function( action ){
            if( action === 'engage' ){
                addListeners( this.list, ['touchstart', 'mousedown'], this.start );
                addListeners( this.list, ['mousedown', 'touchstart', 'keydown'], this.stopAuto );

                if( this.settings.handleKeys ){
                	document.addEventListener( 'keydown', this.keysHandler);
                }

                window.addEventListener( 'resize', this.resize );
            }
            else {
                removeListeners( this.list, ['touchstart', 'mousedown'], this.start );
                removeListeners( this.list, ['mousedown', 'touchstart', 'keydown'], this.stopAuto );

                if( this.settings.handleKeys ){
                	document.removeEventListener( 'keydown', this.keysHandler);
                }

                window.removeEventListener( 'resize', this.resize );
            }
        },
        prev : function(){
            var target = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex -1;
            var effect = this.settings.effect;
            this.effects[ effect ].slide( this, target );

            if( typeof(this.settings.transitionCallback) === 'function' && this.items[ this.currentIndex ] ){
                this.settings.transitionCallback(this.currentIndex, this.items[ this.currentIndex ], this);
            }
        },
        next : function(){
            var target = this.currentIndex === this.items.length - 1 ? 0 : this.currentIndex +1;
            var effect = this.settings.effect;
            this.effects[ effect ].slide( this, target, this.settings.speed);

            if( typeof(this.settings.transitionCallback) === 'function' && this.items[ this.currentIndex ] ){
                this.settings.transitionCallback(this.currentIndex, this.items[ this.currentIndex ], this);
            }
        },
        slide : function( to, time ){
            var effect = this.settings.effect;
            console.log();
            this.effects[ effect ].slide( this, to, time );

            if( typeof(this.settings.transitionCallback) === 'function' && this.items[ this.currentIndex ] ){
                this.settings.transitionCallback(this.currentIndex, this.items[ this.currentIndex ], this);
            }
        },

        ///// delegations
        onResize : function(){
            clearTimeout( this.resizeTimeout );
            // closure for the resize timeout
            // lets not kill performance
            this.resizeTimeout = setTimeout((function( ninjaSlider ){
                return function(){
                    ninjaSlider.setup();
                };
            }(this)), this.settings.throttle);
        },
        onStart : function( event ){
            if( event.type === 'mousedown' ){ event.preventDefault(); }

            var pointerCoors = getCoords( event );

            this.startPos = {
                x : pointerCoors.x,
                y : pointerCoors.y,
                time : new Date()
            };

            this.delta = {};

            this.isScrolling = undefined;

            var effect = this.settings.effect;
            if( typeof this.effects[ effect ].onStart === 'function' ){
                this.effects[ effect ].onStart( this, pointerCoors, event );
            }

            addListeners( this.container, ['touchmove', 'mousemove'], this.move );
            addListeners( this.container, ['touchend', 'mouseup'], this.end );
        },
        onMove : function( event ){
            var pointerCoors = getCoords( event );

            this.delta = {
                x : pointerCoors.x - this.startPos.x,
                y : pointerCoors.y - this.startPos.y
            }; 

            if ( typeof(this.isScrolling) === 'undefined') {
                this.isScrolling = !!( this.isScrolling || Math.abs(this.delta.x) < Math.abs(this.delta.y) );
            }

            if( this.isScrolling && !this.settings.blockScrolling ){ 
                return; 
            }

            event.preventDefault();            

            this.delta.x = this.delta.x / 
                (( 
                    !this.currentIndex && this.delta.x > 0 ||
                    this.currentIndex === this.items.length -1 && 
                    this.delta.x < 0 
                ) ? ( Math.abs(this.delta.x) / this.width + 1 ) : 1 );

            var effect = this.settings.effect;
            this.effects[ effect ].onMove( this, pointerCoors, event );
        },
        onEnd : function( event ){
            // event.preventDefault();
            
            var pointerCoors = getCoords( event );
            var duration = new Date() - this.startPos.time,
                direction = this.delta.x < 0,
                targetIndex = this.currentIndex;

            var isValidSlide = Number(duration) < 250 && Math.abs(this.delta.x) > 40 || Math.abs(this.delta.x) > this.width/2,
                isPastBounds = !this.currentIndex && this.delta.x > 0 || this.currentIndex === (this.items.length -1) && this.delta.x < 0;

            if( isValidSlide && !isPastBounds ){
                targetIndex = direction ? this.currentIndex +1 : this.currentIndex -1;
            }

            var effect = this.settings.effect;
            if( typeof this.effects[ effect ].onEnd === 'function' ){
                this.effects[ effect ].onEnd( this, pointerCoors, targetIndex, event );
            }

            if( typeof(this.settings.transitionCallback) === 'function' && this.items[ this.currentIndex ] ){
                this.settings.transitionCallback(this.currentIndex, this.items[ this.currentIndex ], this);
            }

            removeListeners( this.container, ['touchmove', 'mousemove'], this.move );
            removeListeners( this.container, ['touchend', 'mouseup'], this.end );
        },
        

        //// effects
        effects : {},

        // settings
        settings : {}
    };

    window.NinjaSlider.addEffect = function( effectName, effectObject ){
        NinjaSlider.prototype.effects[ effectName ] = effectObject;
    };
    
    // wrapper in jquery
    if( jQuery ){
        jQuery.fn.ninjaSlider = function( options ){
            if( this.data('ninjaSlider') ) { return this.data('ninjaSlider'); }
            return this.each(function(){
                $(this).data('ninjaSlider', (new window.NinjaSlider(this, options)));
            });
        };
    }
}(window, document));


/////////////////////////////////
///////////////////////////////// Effects
/////////////////////////////////

(function(window, document){
    "use strict";

    var calcOffset = function( width, index ){
        var calc = index * width *-1;
        if( index === 0 ){ calc = calc - width; }
        return calc;
    };

    var changeStyle = function( element, props, value ){
        props.forEach(function( p ){
            element.style[p] = value;
        });
    };

    var move = function( item, offset, speed ){
        changeStyle( item, ['webkitTransitionDuration', 'MozTransitionDuration', 'msTransitionDuration', 'transitionDuration'], speed + 'ms' );
        changeStyle( item, ['webkitTransform', 'MozTransform', 'msTransform', 'transform'], 'translate(' + offset + 'px,0) translateZ(0)' );
    };

    /////////////////////////////////
    ///////////////////////////////// Slide effect
    /////////////////////////////////
    window.NinjaSlider.addEffect('slide', {
        setup : function( ninjaSlider ){
            ninjaSlider.container.style.visibility = 'visible';
            changeStyle( ninjaSlider.container, ['webkitBackfaceVisibility', 'mozBackfaceVisibility', 'msBackfaceVisibility', 'backfaceVisibility'], 'hidden' );
            changeStyle( ninjaSlider.container, ['webkitPerspective', 'mozPerspective', 'msPerspective', 'perspective'], 1000 );
            ninjaSlider.list.style.width = (ninjaSlider.width * ninjaSlider.items.length) + 'px';

            ninjaSlider.items.forEach(function( item, i ){
                var offset_calc = calcOffset( ninjaSlider.width, i ) + ninjaSlider.width;

                item.style.width = ninjaSlider.width + 'px';
                changeStyle( item, ['webkitTransform', 'MozTransform', 'msTransform', 'transform'], 'move(' + offset_calc + 'px,0) moveZ(0)' );

                if( !ninjaSlider.initialized ){
                    item.style.float = 'left';
                    item.dataset.index = i;
                    changeStyle( item, ['webkitTransitionDuration', 'MozTransitionDuration', 'msTransitionDuration', 'transitionDuration'], ninjaSlider.settings.speed + 'ms' );
                    item.dataset.offset = offset_calc;
                    ninjaSlider.slidesPos.push( offset_calc );
                }
            });

            if( ninjaSlider.initialized ){
                ninjaSlider.effects[ ninjaSlider.settings.effect ].slide( ninjaSlider, ninjaSlider.currentIndex, 0 );
            }
        },
        kill : function( ninjaSlider ){
            ninjaSlider.container.removeAttribute('style');
            ninjaSlider.list.removeAttribute('style');
            ninjaSlider.items.forEach(function( item ){
                item.removeAttribute('style');
            });
            ninjaSlider.eventsHandler( 'disengage' );
            ninjaSlider.initialized = false;
        },
        slide : function( ninjaSlider, to, speed ){
            var current = ninjaSlider.currentIndex,
                items = ninjaSlider.items, 
                width = ninjaSlider.width,
                prev = current < to ? current : to -1,
                next = current > to ? current : to +1,
                offset_prev, offset_target, offset_next;

            speed = typeof( speed ) === 'undefined' ? ninjaSlider.settings.speed : speed;

            if( items[ prev ] ){
                offset_prev = calcOffset( ninjaSlider.width, prev );
                if( prev !== 0 ){ offset_prev = offset_prev - width; }

                move( items[ prev ], offset_prev, speed );
                ninjaSlider.slidesPos[ prev ] = offset_prev;
                items[ prev ].dataset.offset = offset_prev;
            }
            
            if( items[ to ] ){
                offset_target = calcOffset( ninjaSlider.width, to ); 
                if( to === 0 ){ offset_target = offset_target + width; }

                move( items[ to ] , offset_target, speed );
                ninjaSlider.slidesPos[ to ] = offset_target;
                items[ to ].dataset.offset = offset_target;
            }
            
            if( items[ next ] ){
                offset_next = calcOffset( ninjaSlider.width, next ) + width;
                move( items[ next ], offset_next, speed );
                ninjaSlider.slidesPos[ next ] = offset_next;
                items[ next ].dataset.offset = offset_next;
            }

            items.filter(function(el, i){ 
                return (i < to && i !== prev) || (i > to && i !== next); 
            }).forEach(function( el ){
                var index = items.indexOf( el ),
                    direction = index > to,
                    offset = calcOffset( ninjaSlider.width, index );

                if( index !== 0 && !direction ){ offset = offset - width; }
                else if ( direction ) { offset = offset + width; }

                move( el, offset, 0 );
                ninjaSlider.slidesPos[ index ] = offset;
                el.dataset.offset = offset;
            });

            ninjaSlider.currentIndex = to;
        },
        onMove : function( ninjaSlider ){
            var deltaX = ninjaSlider.delta.x,
                slidesPos = ninjaSlider.slidesPos,
                prev = ninjaSlider.items[ ninjaSlider.currentIndex - 1 ],
                current = ninjaSlider.items[ ninjaSlider.currentIndex ],
                next = ninjaSlider.items[ ninjaSlider.currentIndex + 1 ];

            if( prev ){ move( prev, deltaX + slidesPos[ ninjaSlider.currentIndex - 1 ], 0 ); }
            move( current, deltaX + slidesPos[ ninjaSlider.currentIndex ], 0 );
            if( next ){ move( next, deltaX + slidesPos[ ninjaSlider.currentIndex + 1 ], 0 ); }
        },
        onEnd : function( ninjaSlider, pointerCoors, targetIndex, event ){
            ninjaSlider.effects[ ninjaSlider.settings.effect ].slide( ninjaSlider, targetIndex, ninjaSlider.settings.speed );
        }
    });



    /////////////////////////////////
    ///////////////////////////////// carousel effect
    /////////////////////////////////
    window.NinjaSlider.addEffect('carousel', {
        setup : function( ninjaSlider ){
            ninjaSlider.container.style.visibility = 'visible';
            changeStyle( ninjaSlider.container, ['webkitBackfaceVisibility', 'mozBackfaceVisibility', 'msBackfaceVisibility', 'backfaceVisibility'], 'hidden' );
            changeStyle( ninjaSlider.container, ['webkitPerspective', 'mozPerspective', 'msPerspective', 'perspective'], 1000 );
            ninjaSlider.list.style.width = (ninjaSlider.width * ninjaSlider.items.length) + 'px';

            ninjaSlider.items.forEach(function( item, i ){
                var offset_calc = calcOffset( ninjaSlider.width, i ) + ninjaSlider.width;

                item.style.width = ninjaSlider.width + 'px';
                changeStyle( item, ['webkitTransform', 'MozTransform', 'msTransform', 'transform'], 'move(' + offset_calc + 'px,0) moveZ(0)' );

                if( !ninjaSlider.initialized ){
                    item.style.float = 'left';
                    item.dataset.index = i;
                    changeStyle( item, ['webkitTransitionDuration', 'MozTransitionDuration', 'msTransitionDuration', 'transitionDuration'], ninjaSlider.settings.speed + 'ms' );
                    item.dataset.offset = offset_calc;
                    ninjaSlider.slidesPos.push( offset_calc );
                }
            });

            if( ninjaSlider.initialized ){
                ninjaSlider.effects[ ninjaSlider.settings.effect ].slide( ninjaSlider, ninjaSlider.currentIndex, 0 );
            }
        },
    });







}(window, document));