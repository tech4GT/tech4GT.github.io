const getPixels = require('get-pixels');
module.exports = {
    getPreviousStep : function () {
        return this.getStep(-1);
    },

    getNextStep : function() {
        return this.getStep(1);
    },

    getInput : function(offset){
        if(offset + this.getIndex() === 0) offset++;
        return this.getStep(offset - 1).output;
    },

    getOuput : function(offset){
        return this.getStep(offset).output;
    },

    getOptions : function(){
        return this.getStep(0).options;
    },

    setOptions : function(optionsObj){
        let options = this.getStep(0).options;
        for(let key in optionsObj){
            if(options[key]) options[key] = optionsObj[key];
        }
    },

    getFormat : function(){
        return this.getStep(-1).output.format;
    },

    getHeight : function(callback){
        getPixels(this.getStep(-1).output.src,function(err,pixels){
            if (err) {
                console.log("Bad image path", image);
                return;
            }
            callback(pixels.shape[1]);
        });
    },

    getWidth : function (callback) {
        getPixels(this.getStep(-1).output.src,function(err,pixels){
            if (err) {
                console.log("Bad image path", image);
                return;
            }
            callback(pixels.shape[0]);
        });
    }
}