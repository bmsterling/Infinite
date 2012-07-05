var 
echo = function (args) {
    window.console && console.log(args);
},
blue  = {
    split       : '/v6/',
    total       : 0,
    loaded      : 0,
    percentage  : 0,
    tmpl        : null,
    increment   : function () {
        var self = this;
        
        self.percentage+=3;
        
        return self.percentage;
    },
    Views       : {},
    Models      : {},
    Collections : {},
    Router      : {},
    events      : function () {},
    init        : function () {
        var self = this,el;
        
        self.tmpl = $('#project-tmpl').html();
        
        self.container = $('#projects');
        self.scroller  = $('#wrapper');

        // $('#percentage').text(blue.increment()+'%');
        
        self.Collections.projects = new self.Collections.Projects();
        
        self.Views.projects = new self.Views.Projects({collection:self.Collections.projects});
        
        self.Views.projects.render();
    },
    
    finalize : function () {
        var self = this,el;
        
        el = $(self.Views.projects.el);
        
        for (var i = 0; i < 18; i++) {
            el.clone(true).appendTo(self.container).addClass('group group'+(i+1));
        }
        
        self.Views.projects.removeOverlay();
        
        self.events();
    },
    
    preload : function (src) {
        var extra = "",imgPreloader;
        if ($.browser.msie && $.browser.version < 9) {
            extra = "?" + Math.floor(Math.random() * 3000);
        }
        src += extra;
        
        imgPreloader = new Image();
        
        imgPreloader.onload = function () {
            imgPreloader.onload = null;
            var src = (this.src).split(location.host+blue.split)[1];
            
            // $('img[src="'+src+'"]')
				// .fadeTo(
					// 'slow',
					// 1,
                    // function () {
                        // $(this).css('opacity','');
                    // }
				// );;
        };
        
        imgPreloader.src = src;
    }
};

(function (w,$,Backbone,_,blue, views, models, collections, router){
    models.Project = Backbone.Model.extend({});

    collections.Projects = Backbone.Collection.extend({
        url : "images.json"
    });
    
    views.Projects = Backbone.View.extend({
        className : 'wrap clearfix',

        initialize : function () {
            var self = this;

            _.bindAll(self, 'addOne');

            self.collection.bind('add',   self.addOne, self);
            self.collection.bind('reset', self.addAll, self);

            // grab the data
            self.collection.fetch({
                success : function () {
                    blue.total = self.collection.length;
                }
            });

            return self;
        },
        
        render : function () {
            var self = this;

            return self;
        },
        
        addOne : function (model) {
            var self = this;

			var view = new views.Project({model: model});
			$(self.el).append(view.render().el);

            return self;
        },
        
        addAll : function () {
            var self = this;

            self.collection.each(self.addOne);

            
            
            blue.finalize();

            return self;
        },

        removeOverlay : function () {
            $('.loader').fadeOut('slow');
        }
    });
    
    views.Project = Backbone.View.extend({
        className : 'item',
		
        events : {
            'mousedown' : 'handleDown',
            'mouseup'   : 'handleUp'
        },
        
        attributes : { 'onselectstart' : 'return false' },
        
        initialize : function () {
            var self = this;
			
			_.bindAll(self, 'handleDown','handleUp');
			
			self.model.bind('change', self.render, self);
			
			self.template = _.template(blue.tmpl);
            
            return self;
        },
        
        render : function () {
			var self = this,
				html = self.template(self.model.toJSON()),
                img  = null;
                
            
            img  =  $(self.el).html(html).find('img').get(0);
            
            blue.preload(img.src);
			
			var rel = 'gal'+self.model.get('id');
			
			$(self.el).data('rel',rel);
            
            return self;
        },
		
		handleDown : function (e) {},
		
		handleUp : function () {}
    });

})(window,jQuery,Backbone,_,blue, blue.Views, blue.Models, blue.Collections, blue.Router );

$($.proxy(blue,'init'));