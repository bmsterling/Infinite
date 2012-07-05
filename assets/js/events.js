(function (w,$,Backbone,_,blue, views, models, collections, router){

var m = Math,
    mround = function (r) { return r >> 0; },
    vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
        (/firefox/i).test(navigator.userAgent) ? 'Moz' :
        'opera' in window ? 'O' : '',

    // Browser capabilities
    isAndroid = (/android/gi).test(navigator.appVersion),
    isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
    isPlaybook = (/playbook/gi).test(navigator.appVersion),
    isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),

    has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
    hasTouch = 'ontouchstart' in window && !isTouchPad,
    hasTransform = vendor + 'Transform' in document.documentElement.style,
    hasTransitionEnd = isIDevice || isPlaybook,

    nextFrame = (function() {
        return window.requestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function(callback) { return setTimeout(callback, 17); }
    })(),
    cancelFrame = (function () {
        return window.cancelRequestAnimationFrame
            || window.webkitCancelAnimationFrame
            || window.webkitCancelRequestAnimationFrame
            || window.mozCancelRequestAnimationFrame
            || window.oCancelRequestAnimationFrame
            || window.msCancelRequestAnimationFrame
            || clearTimeout
    })(),

    // Events
    RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
    START_EV = hasTouch ? 'touchstart' : 'mousedown',
    MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
    END_EV = hasTouch ? 'touchend' : 'mouseup',
    CANCEL_EV = hasTouch ? 'touchcancel' : 'touchcancel',

    // Helpers
    trnOpen = 'translate' + (has3d ? '3d(' : '('),
	trnClose = has3d ? ',0)' : ')',
    
    fallback = 'https://mail.google.com/mail/images/2/',
    
    cursorGrab = (function(){
        var cursorGrab;
        if (vendor === '-moz-' || vendor === '-webkit-') {
            cursorGrab = vendor + 'grab';
        }
        else{
            cursorGrab = 'url('+fallback+'openhand.cur), default';
        }
        
        return cursorGrab;
    })(),
    
    cursorGrabbing = (function(){
        var cursorGrabbing;
        if (vendor === '-moz-' || vendor === '-webkit-') {
            cursorGrabbing = vendor + 'grabbing';
        }
        else{
            cursorGrabbing = 'url('+fallback+'closedhand.cur), default';
        }
        
        return cursorGrabbing;
    })(),

    getPoints = function (e) {
        return hasTouch ? (e.originalEvent.touches[0] || e.originalEvent.changedTouches[0] || e.touches[0]) : e;
    },
    
    _pos = function (x,y) {
        x = (o.x + x);
        y = (o.y + y);
        
        if (y>0) {
            y=-o.maxheight; 
        }
        
        if (y<-o.maxheight) {
            y=-o.minheight;
        }
        
        if (x>0) {
            x=-o.maxwidth;
        }
        
        if (x<-o.maxwidth) {
            x=-o.minwidth;
        }
        
        x = mround(x);
        y = mround(y);
        
        if (useTransform) {
            scroller.style[vendor + 'Transform'] = trnOpen + x + 'px,' + y + 'px' + trnClose + ' scale(1)';
        }
        else {
            scroller.style.left = x + 'px';
            scroller.style.top = y + 'px';
        }
        
        o.x = x;
        o.y = y;
            
        o.lastframeX = x;
        o.lastframeY = y;
    },
    
    scroller = null, /* the wrap */
    
    useTransform = true,
    
    o = {
        x         : 0,/* current x position of wrap*/
        y         : 0,/* current y position of wrap*/
        
        maxheight : 0,/* max height of the wrap */
        minheight : 0,/* min height of the wrap */
        
        maxwidth  : 0,/* max width of the wrap */
        minwidth  : 0,/* min width of the wrap */
        
        startX    : 0,
        startY    : 0,
        
        curX      : 0,
        curY      : 0,
        
        lastX      : 0,
        lastY      : 0,
        
        
        offsetX      : 0,
        offsetY      : 0,
        
        drag      : null,
        animi     : null,
        
        velocityX : 0,
        velocityY : 0,
        
        mousedown : false
    },
    
    s = {
        decay            : 0.94,
        speed_springness : 0.9,
        mouse_down_decay : 0.5,
        min_decay        : 2
    },
    
    handleMouseDown = function (e) {
        var 
            self = this,
            point = getPoints(e),
            x,
            y;
            
        cancelFrame(o.animi);
        cancelFrame(o.drag);
            
        o.mousedown = true;

        self.scroller
            .on(MOVE_EV, $.proxy(handleMouseMove,self))
            .on(END_EV, $.proxy(handleMouseUp,self))
            .on(CANCEL_EV, $.proxy(handleMouseUp,self));

        o.startX = point.clientX;
        o.startY = point.clientY;
        
        o.curX = o.lastX = point.clientX;
        o.curY = o.lastY = point.clientY;

        drag();
        
        return false;
    },
    
    handleMouseMove = function (e) {
        var 
            self = this,
            point = getPoints(e),
            x,
            y;

        o.curX = point.clientX;
        o.curY = point.clientY;
        
        o.velocityX += ((o.curX - o.lastX) * s.speed_springness);
        o.velocityY += ((o.curY - o.lastY) * s.speed_springness);
    },
    
    handleMouseUp = function (e) {
        var 
            self = this,
            point = getPoints(e),x,y;
            
        o.mousedown = false;
        
        o.lastX = 0;
        o.lastY = 0;
            
        o.isDragging=false;
        cancelFrame(o.drag);
        
        animate();

        self.scroller.unbind(MOVE_EV)
        .unbind(END_EV)
        .unbind(CANCEL_EV);
    },
    
    drag = function () {
        o.offsetX = o.curX-o.lastX;
        o.offsetY = o.curY-o.lastY;
        
        o.lastX = o.curX;
        o.lastY = o.curY;
        
        if (o.mousedown) {
            o.velocityX *= s.mouse_down_decay;
            o.velocityY *= s.mouse_down_decay;
        }
        
        _pos(o.offsetX,o.offsetY);
        
        o.drag = nextFrame(drag);
    },

    animate = function () {
        o.velocityX *= s.decay;
        o.velocityY *= s.decay;
        
        _pos(o.velocityX,o.velocityY);
        
        if (Math.abs(o.velocityX) > s.min_decay || Math.abs(o.velocityY) > s.min_decay) {
            o.animi = nextFrame(animate);
        }
    },
    
    _mouseout = function (e){};
    
    blue.events = function () {
        var self = this;
        
        scroller = blue.container.get(0);
                
        o.width = blue.container.width();
        o.height= blue.container.height();
            
        o.minwidth  = (o.width/3);
        o.minheight = (o.height/6);
            
        o.maxwidth  = o.width-o.minwidth;
        o.maxheight = o.height-o.minheight;
        
        // Set some default styles
        scroller.style[vendor + 'TransitionProperty'] = useTransform ? '-' + vendor.toLowerCase() + '-transform' : 'top left';
        scroller.style[vendor + 'TransitionDuration'] = '0';
        scroller.style[vendor + 'TransformOrigin'] = '0 0';
        
        if (useTransform) {
            scroller.style[vendor + 'Transform'] = trnOpen + '0px,0px' + trnClose;
        }
        else {
            scroller.style.cssText += ';position:absolute;top:0px;left:0px';
        }

        self.scroller.on(START_EV,$.proxy(handleMouseDown,self));
        
        $(window).on(RESIZE_EV,function () {
            o.width = blue.container.width(),
            o.height= blue.container.height();
                
            o.minwidth  = (o.width/3);
            o.minheight = (o.height/6);
                
            o.maxwidth  = o.width-o.minwidth;
            o.maxheight = o.height-o.minheight;
        });

        self.scroller.bind('mouseleave',$.proxy(_mouseout,self));
        
        blue.o = o;
        blue.s = s;
        
        blue.start();
    };
    
    blue.start = function () {
        var
            self = this;
            
        self.o.velocityX = -15;
        self.o.velocityY = -15;
        
        self.animate();
    }
    
    blue.animate = animate;
 
})(window,jQuery,Backbone,_,blue, blue.Views, blue.Models, blue.Collections, blue.Router );