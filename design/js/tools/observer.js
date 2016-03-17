define(function () {

    var Observer = {
        on: function(type, fn) {
            this.listeners = this.listeners || {};
            this.listeners[type] = this.listeners[type] || [];
            this.listeners[type].push(fn);
        },
        one: function(type, fn) {
            this.on(type, function tmp(ev) {
                fn.call(this, ev);
                this.unbind(type, tmp);
            });
        },
        trigger: function(type, ev) {
            if (this.listeners && this.listeners[type]) {
                for (var i = 0; i < this.listeners[type].length; i++) {
                    this.listeners[type][i].call(this, ev);
                }
            }
        },
        unbind: function(type, fn) {
            if (this.listeners && this.listeners[type]) {
                if (typeof fn !== 'function') {
                    delete this.listeners[type];
                } else {
                    for (var i = 0; i < this.listeners[type].length; i++) {
                        if (this.listeners[type][i] === fn) {
                            this.listeners[type].splice(i--, 1);
                        }
                    }
                    if (!this.listeners[type].length) {
                        delete this.listeners[type];
                    }
                }
            }
        }
    }

    return function () {
        this.sub = this.on = Observer.on;
        this.pub = this.trigger = Observer.trigger;
        this.one = Observer.one;
        this.unsub = this.unbind = Observer.unbind;
    }
    
});
